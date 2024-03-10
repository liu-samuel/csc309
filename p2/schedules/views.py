from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer
from .utils import time_orders_valid, start_end_same_day, round_time, split_into_increments, OverlapException, is_valid_datetime_string

import json

class EventAPIView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            event = Event.objects.get(pk=event_id)
        except:
            return Response({'error': f'Event does not exist with id {event_id}'}, status=status.HTTP_404_NOT_FOUND)

        try:
            all_availabilities = Availability.objects.filter(event__pk=event_id)
        except:
            return Response({'error': 'Cannot get availabilities for event'}, status=status.HTTP_404_NOT_FOUND)


        event_data = EventSerializer(event).data

        availabilities = [AvailabilitySerializer(availability).data for availability in all_availabilities]

        event_data["availabilities"] = availabilities


        return Response(event_data, status=200)
    

    def patch(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            event = Event.objects.get(pk=event_id)
        except:
            return Response({'error': f'Event does not exist with id {event_id}'}, status=status.HTTP_404_NOT_FOUND)
        
        is_finalized = request.data.get("is_finalized")
        name = request.data.get("name")
        selected_time = request.data.get("selected_time")

        # if any of these were not passed in, don't update that value
        if is_finalized != None:
            event.is_finalized = is_finalized
        if name != None:
            event.name = name
        if selected_time != None:
            # validation: make sure start time is of format YYYY-MM-DDThh:mm
            if not is_valid_datetime_string(selected_time):
                return Response({'error': 'selected_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

            event.selected_time = selected_time

        event.save()

        serializer = EventSerializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            event = Event.objects.get(pk=event_id)
        except:
            return Response({'error': f'Event does not exist with id {event_id}'}, status=status.HTTP_404_NOT_FOUND)
        
        event.delete()
        return Response({'message': 'Event deleted successfully'}, status=status.HTTP_200_OK)
        



class EventAvailabilityAPIView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]


    """
    Adds availabilities between start_time and end_date.
    If a specific 30-minute increment already exists, returns an error and does not update the database.
    """
    @transaction.atomic
    def post(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            user_email = request.data.get('email')
            start_time = request.data.get('start_time')
            end_time = request.data.get('end_time')
            availability_type = request.data.get('type')
        except Exception as e:
            print(e)
            return Response({'error': 'Missing parameter(s); email, start_time, end_time or type'}, status=status.HTTP_400_BAD_REQUEST)

        param_error = []
        if (user_email == None):
            param_error.append("email")
        if (start_time == None):
            param_error.append("start_time")
        if (end_time == None):
            param_error.append("end_time")
        if (availability_type == None):
            param_error.append("type")

        if len(param_error) > 0:
            return Response({'error': f'Missing parameter(s): {", ".join(param_error)}'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure start time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(start_time):
            return Response({'error': 'start_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure end time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(start_time):
            return Response({'error': 'end_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)


        try:
            user = get_user_model().objects.get(email=user_email)
        except get_user_model().DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        

        # validation: make sure start time < end time
        if not time_orders_valid(start_time, end_time):
            return Response({'error': 'Start time is after end time'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure start time and end time are on the same day
        #       UNLESS, end_time is 12:00am. Then it can be the next day
        if not start_end_same_day(start_time, end_time):
            return Response({'error': 'Start and end times must be the same day'}, status=status.HTTP_400_BAD_REQUEST)

        # round start and end time to nearest 30 minute
        start_time = round_time(start_time)
        end_time = round_time(end_time)

        # split into 30 minute increments
        increments = split_into_increments(start_time, end_time)

        # validation: check event_id
        try:
            event = Event.objects.get(pk=event_id)
        except:
            return Response({'error': f'Event does not exist with id {event_id}'}, status=status.HTTP_404_NOT_FOUND)


        creation_data = []

        # validation: check for start/end time overlap
        try:
            with transaction.atomic():
                for increment in increments:
                    availability = Availability.objects.filter(event_id=event_id).filter(start_time=increment[0], end_time=increment[1], person_id=user.pk)
                    if len(availability) > 0:
                        raise OverlapException(f"You are already available between {increment[0], increment[1]}")

                    availability_data = {
                        'person': user.pk,
                        'start_time': increment[0],
                        'end_time': increment[1],
                        'event': event_id,
                        'type': availability_type
                    }

                    serializer = AvailabilitySerializer(data=availability_data)
                    if serializer.is_valid():
                        serializer.save()
                        creation_data.append(serializer.data)
                    else:
                        raise Exception(serializer.errors)
                
                return Response(creation_data, status=status.HTTP_201_CREATED)
        except OverlapException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(json.dumps(str(e)), status=status.HTTP_400_BAD_REQUEST)


    """
    Replaces all availabilities between start_time and end_date.
    If a specific 30-minute increment does not exist, returns an error and does not update the database.
    """
    @transaction.atomic
    def put(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            user_email = request.data.get('email')
            start_time = request.data.get('start_time')
            end_time = request.data.get('end_time')
            availability_type = request.data.get('type')
        except Exception as e:
            return Response({'error': 'Missing parameter(s); email, start_time, end_time or type'}, status=status.HTTP_400_BAD_REQUEST)

        param_error = []
        if (user_email == None):
            param_error.append("email")
        if (start_time == None):
            param_error.append("start_time")
        if (end_time == None):
            param_error.append("end_time")
        if (availability_type == None):
            param_error.append("type")

        if len(param_error) > 0:
            return Response({'error': f'Missing parameter(s): {", ".join(param_error)}'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure start time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(start_time):
            return Response({'error': 'start_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure end time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(start_time):
            return Response({'error': 'end_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_user_model().objects.get(email=user_email)
        except get_user_model().DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        

        # validation: make sure start time < end time
        if not time_orders_valid(start_time, end_time):
            return Response({'error': 'Start time is after end time'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure start time and end time are on the same day
        #       UNLESS, end_time is 12:00am. Then it can be the next day
        if not start_end_same_day(start_time, end_time):
            return Response({'error': 'Start and end times must be the same day'}, status=status.HTTP_400_BAD_REQUEST)

        # round start and end time to nearest 30 minute
        start_time = round_time(start_time)
        end_time = round_time(end_time)

        # split into 30 minute increments
        increments = split_into_increments(start_time, end_time)

        # validation: check event_id
        try:
            event = Event.objects.get(pk=event_id)
        except:
            return Response({'error': f'Event does not exist with id {event_id}'}, status=status.HTTP_404_NOT_FOUND)


        update_data = []

        # validation: check for start/end time overlap
        try:
            with transaction.atomic():
                for increment in increments:
                    availability = Availability.objects.filter(event_id=event_id).filter(start_time=increment[0], end_time=increment[1], person_id=user.pk)
                    if not availability:
                        raise OverlapException(f"There is no current availability between {increment[0], increment[1]}")

                    availability = availability.get()

                    availability.type = availability_type

                    serializer = AvailabilitySerializer(availability)
                    availability.save()
                    update_data.append(serializer.data)
                
                return Response(update_data, status=status.HTTP_201_CREATED)
        except OverlapException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(json.dumps(str(e)), status=status.HTTP_400_BAD_REQUEST)

    """
    Delete all availabilities between start_time and end_time (assuming they're on the same date).
    If a specific 30-minute increment does not have an availability for this user, ignore it and keep deleting next increments
    """
    def delete(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            user_email = request.data.get('email')
            start_time = request.data.get('start_time')
            end_time = request.data.get('end_time')
        except Exception as e:
            print(e)
            return Response({'error': 'Missing parameter(s); email, start_time, end_time or type'}, status=status.HTTP_400_BAD_REQUEST)

        param_error = []
        if (user_email == None):
            param_error.append("email")
        if (start_time == None):
            param_error.append("start_time")
        if (end_time == None):
            param_error.append("end_time")

        if len(param_error) > 0:
            return Response({'error': f'Missing parameter(s): {", ".join(param_error)}'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure start time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(start_time):
            return Response({'error': 'start_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure end time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(start_time):
            return Response({'error': 'end_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_user_model().objects.get(email=user_email)
        except get_user_model().DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        

        # validation: make sure start time < end time
        if not time_orders_valid(start_time, end_time):
            return Response({'error': 'Start time is after end time'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure start time and end time are on the same day
        #       UNLESS, end_time is 12:00am. Then it can be the next day
        if not start_end_same_day(start_time, end_time):
            return Response({'error': 'Start and end times must be the same day'}, status=status.HTTP_400_BAD_REQUEST)

        # round start and end time to nearest 30 minute
        start_time = round_time(start_time)
        end_time = round_time(end_time)

        # split into 30 minute increments
        increments = split_into_increments(start_time, end_time)

        # validation: check event_id
        try:
            event = Event.objects.get(pk=event_id)
        except:
            return Response({'error': f'Event does not exist with id {event_id}'}, status=status.HTTP_404_NOT_FOUND)


        for increment in increments:
            availability = Availability.objects.filter(event_id=event_id).filter(start_time=increment[0], end_time=increment[1], person_id=user.pk)
            if len(availability) > 0:
                print(availability)
                availability.delete()
        
        return Response({'message': 'Availabilities deleted successfully'}, status=status.HTTP_201_CREATED)
        
        

