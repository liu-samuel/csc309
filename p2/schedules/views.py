from .utils import send_email
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from django.core import serializers

from django.db import transaction

from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer
from .utils import time_orders_valid, start_end_same_day, round_time, split_into_increments, OverlapException, is_valid_datetime_string

import json
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer

class EventsListAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, **kwargs):
        owner = request.query_params.get("owner")
        invitee = request.query_params.get("invitee")
        is_finalized = request.query_params.get("is_finalized")
        
        # validations

        # check for missing params
        missing_params = []
        if not owner:
            missing_params.append('owner')
        if not invitee:
            missing_params.append('invitee')
        if not is_finalized:
            missing_params.append('is_finalized')
        if len(missing_params) > 0:
            return Response({'error': f"Missing required parameter(s): {', '.join(missing_params)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        num_params = []
        if not owner.isnumeric():
            num_params.append('owner')
        if not invitee.isnumeric():
            num_params.append('invitee')
        if len(num_params) > 0:
            return Response({'error': f"Parameter(s) must be a number: {', '.join(num_params)}"}, status=status.HTTP_400_BAD_REQUEST)


        # check that the current user is either the owner or the invitee
        current_user = request.user
        if (current_user.pk != int(owner)) and (current_user.pk != int(invitee)):
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        
        # check that owner and invitee are different
        if owner == invitee:
            return Response({'error': 'owner and invitee must be different'}, status=status.HTTP_400_BAD_REQUEST)

        if is_finalized:
            if is_finalized.lower() == "false":
                is_finalized = False
            elif is_finalized.lower() == "true":
                is_finalized = True
            else:
                return Response({'error': 'is_finalized must be a boolean value'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            events = Event.objects.filter(owner__pk=owner, invitee__pk=invitee, is_finalized=bool(is_finalized))
        except Exception:
            return Response({'error': 'Cannot get events'}, status=status.HTTP_404_NOT_FOUND)

        try:
            events_response = [EventSerializer(event).data for event in events]
            return Response({'events': events_response}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Serialization error'}, status=status.HTTP_400_BAD_REQUEST)


    def post(self, request, **kwargs):
        owner = request.user
        invitee = request.data.get("invitee")
        deadline = request.data.get("deadline")
        name = request.data.get("name")
        is_finalized = False
        selected_time = None
        
        # VALIDATIONS

        # check that all required fields exist
        missing_params = []
        if not invitee:
            missing_params.append('invitee')
        if not deadline:
            missing_params.append('deadline')
        if len(missing_params) > 0:
            return Response({'error': f"Missing required parameter(s): {(', ').join(missing_params)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        # check that invitee is a number
        if not invitee.isnumeric():
            return Response({'error': "invitee ID must be a number"}, status=status.HTTP_400_BAD_REQUEST)
        
        # check that deadline is a valid date time string
        if not is_valid_datetime_string(deadline):
            return Response({'error': "deadline must be a valid DateTime string"}, status=status.HTTP_400_BAD_REQUEST)
        
        # check that the two users are different
        if owner.pk == invitee:
            return Response({'error': 'Can\'t invite yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        # check that invitee user ID exists
        try:
            invitee_user = get_user_model().objects.get(pk=invitee)

            if not name: # necessary due to serializer
                name = f'{owner.first_name} / {invitee_user.first_name}'
        except get_user_model().DoesNotExist:
            return Response({'error': 'User(s) not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # check that the owner and invitee are contacts
        if invitee_user not in owner.contacts.all():
            return Response({'error': 'Must be contacts to create an event invitation'}, status=status.HTTP_403_FORBIDDEN)
        
        event_data = {
            "owner": owner.pk,
            "invitee": invitee,
            "deadline": deadline,
            "name": name,
            "is_finalized": is_finalized,
            "selected_time": selected_time
        }

        serializer = EventSerializer(data=event_data)
        if serializer.is_valid():
            event = serializer.save()
            response = Response(serializer.data, status=status.HTTP_201_CREATED)
            try:
                send_request_email(owner=owner, invitee=invitee_user, event=event)
            except:
                return Response({'error': 'Could not send email'}, status=status.HTTP_400_BAD_REQUEST)
            
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def send_request_email(owner, invitee, event):
    owner_email = owner.email
    invitee_email = invitee.email
    subject = f"{owner.email} has invited you to input availability for '{event.name}'"
    body = f"Please input your availability"

    send_email(owner_email, [invitee_email], subject, body)

class EventAPIView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            event = Event.objects.get(pk=event_id)
        except:
            return Response({'error': f'Event does not exist with id {event_id}'}, status=status.HTTP_404_NOT_FOUND)

        # validation: check if the current user is either owner or invitee. if not, they are forbidden
        logged_in_user = request.user
        if logged_in_user.id != event.owner.id and logged_in_user.id != event.invitee.id:
            return Response({'error': 'You are not allowed to view this event'}, status=status.HTTP_403_FORBIDDEN)

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
        
        # validation: check if the current user is either owner or invitee. if not, they are forbidden
        logged_in_user = request.user
        if logged_in_user.id != event.owner.id and logged_in_user.id != event.invitee.id:
            return Response({'error': 'You are not allowed to update this event'}, status=status.HTTP_403_FORBIDDEN)

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
        
        # validation: check if the current user is either owner or invitee. if not, they are forbidden
        logged_in_user = request.user
        if logged_in_user.id != event.owner.id and logged_in_user.id != event.invitee.id:
            return Response({'error': 'You are not allowed to delete this event'}, status=status.HTTP_403_FORBIDDEN)

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

        # validation: check if the current user is either owner or invitee. if not, they are forbidden
        logged_in_user = request.user
        if logged_in_user.id != event.owner.id and logged_in_user.id != event.invitee.id:
            return Response({'error': 'You are not allowed to add availability to this event'}, status=status.HTTP_403_FORBIDDEN)


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


        # validation: check if the current user is either owner or invitee. if not, they are forbidden
        logged_in_user = request.user
        if logged_in_user.id != event.owner.id and logged_in_user.id != event.invitee.id:
            return Response({'error': 'You are not allowed to update availability for this event'}, status=status.HTTP_403_FORBIDDEN)

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

        # validation: check if the current user is either owner or invitee. if not, they are forbidden
        logged_in_user = request.user
        if logged_in_user.id != event.owner.id and logged_in_user.id != event.invitee.id:
            return Response({'error': 'You are not allowed to delete availability for this event'}, status=status.HTTP_403_FORBIDDEN)


        for increment in increments:
            availability = Availability.objects.filter(event_id=event_id).filter(start_time=increment[0], end_time=increment[1], person_id=user.pk)
            if len(availability) > 0:
                availability.delete()
        
        return Response({'message': 'Availabilities deleted successfully'}, status=status.HTTP_200_OK)
    

class SuggestionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def get(self, request, event_id):

        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=404)
        
        invitee = event.invitee
        owner = event.owner

        invitee_availabilities = Availability.objects.filter(person_id=invitee.id)
        owner_availabilities = Availability.objects.filter(person_id=owner.id)

        overlapping_times = set()
        for a1 in owner_availabilities:
            for a2 in invitee_availabilities: 
                if (a1.start_time >= a2.start_time and a1.end_time >= a2.end_time):
                    times = {'start_time': str(a1.start_time), 'end_time': str(a2.end_time)}
                    
                elif (a2.start_time >= a1.start_time and a2.end_time >= a1.end_time):
                    times = {'start_time': str(a2.start_time), 'end_time': str(a1.end_time)}

                elif (a1.start_time >= a2.start_time and a1.end_time <= a2.end_time):
                    times = {'start_time': str(a1.start_time), 'end_time': str(a1.end_time)}

                elif (a2.start_time >= a1.start_time and a2.end_time <= a1.end_time):
                    times = {'start_time': str(a2.start_time), 'end_time': str(a2.end_time)}
                overlapping_times.add(tuple(times.values()))

        overlapping_times = [{'start_time': start_time, 'end_time': end_time} for start_time, end_time in overlapping_times]
        return Response(overlapping_times)
