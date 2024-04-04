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
from .utils import time_orders_valid, start_end_same_day, round_time, split_into_increments, OverlapException, is_valid_datetime_string, append_hours_minutes

import json
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer
from django.core.exceptions import ValidationError

class EventsListAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, **kwargs):
        owner = request.query_params.get("owner")
        invitee = request.query_params.get("invitee")
        is_finalized = request.query_params.get("is_finalized")

        # Convert is_finalized to boolean
        if is_finalized:
            if is_finalized.lower() == "false":
                is_finalized = False
            elif is_finalized.lower() == "true":
                is_finalized = True
            else:
                return Response({'error': 'is_finalized must be a boolean value'}, status=status.HTTP_400_BAD_REQUEST)

        # Build the filter arguments based on provided query parameters
        filter_args = {}
        if owner:
            if not owner.isnumeric():
                return Response({'error': "Parameter 'owner' must be a number"}, status=status.HTTP_400_BAD_REQUEST)
            filter_args['owner__pk'] = owner

        if invitee:
            if not invitee.isnumeric():
                return Response({'error': "Parameter 'invitee' must be a number"}, status=status.HTTP_400_BAD_REQUEST)
            filter_args['invitee__pk'] = invitee

        if is_finalized is not None:
            filter_args['is_finalized'] = is_finalized

        # Ensure at least one of owner or invitee is provided
        if not owner and not invitee:
            return Response({'error': 'At least one of owner or invitee must be provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Query events based on filter arguments
        try:
            events = Event.objects.filter(**filter_args)
        except Exception:
            return Response({'error': 'Cannot get events'}, status=status.HTTP_404_NOT_FOUND)

        # Serialize and return the events
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
        deadline = deadline.split("T")[0]
        # check that deadline is a valid date time string
        formatted_deadline = append_hours_minutes(deadline)
        if not is_valid_datetime_string(formatted_deadline):
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
            "deadline": formatted_deadline,
            "name": name,
            "is_finalized": is_finalized,
            "selected_time": selected_time
        }
        print(event_data)

        serializer = EventSerializer(data=event_data)
        if serializer.is_valid():
            event = serializer.save()
            response = Response({'message': 'Event Invite Sent'}, status=status.HTTP_201_CREATED)
            try:
                send_request_email(owner=owner, invitee=invitee_user, event=event)
            except:
                print("here")
                return Response({'error': 'Could not send email'}, status=status.HTTP_400_BAD_REQUEST)
            
            return response
        print("hereafter")
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
        try:
            event.save()

            serializer = EventSerializer(event)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": e}, status=status.HTTP_400_BAD_REQUEST)

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
            availabilities = request.data.get("availabilities")

            increments = []
            # validation: check event_id
            try:
                event = Event.objects.get(pk=event_id)
            except:
                return Response({'error': f'Event does not exist with id {event_id}'}, status=status.HTTP_404_NOT_FOUND)

            for availability in availabilities:
                try:
                    user_email = availability.get('email')
                    start_time = availability.get('start_time')
                    end_time = availability.get('end_time')
                    availability_type = availability.get('type')
                except Exception as e:
                    return Response({'error': 'Missing list parameter(s); email, start_time, end_time or type'}, status=status.HTTP_400_BAD_REQUEST)

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
                    return Response({'error': f'Missing list parameter(s): {", ".join(param_error)}'}, status=status.HTTP_400_BAD_REQUEST)

                if (availability_type != "available" and availability_type != "preferred"):
                    return Response({'error': "type must be either 'available' or 'preferred'"}, status=status.HTTP_400_BAD_REQUEST)

                # validation: make sure start time is of format YYYY-MM-DDThh:mm
                if not is_valid_datetime_string(start_time):
                    return Response({'error': 'start_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

                # validation: make sure end time is of format YYYY-MM-DDThh:mm
                if not is_valid_datetime_string(end_time):
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

                # validation: check if the current user is either owner or invitee. if not, they are forbidden
                logged_in_user = request.user
                if logged_in_user.id != event.owner.id and logged_in_user.id != event.invitee.id:
                    return Response({'error': 'You are not allowed to add availability to this event'}, status=status.HTTP_403_FORBIDDEN)


                creation_data = []

                # split into 30 minute increments
                increments.append([start_time, end_time])

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
                            raise ValidationError(serializer.errors)
                    
                    return Response(creation_data, status=status.HTTP_201_CREATED)
            except OverlapException as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except ValidationError as e:
                return Response({'error': e}, status=status.HTTP_400_BAD_REQUEST)
        except:
            pass

        try:
            user_email = request.data.get('email')
            start_time = request.data.get('start_time')
            end_time = request.data.get('end_time')
            availability_type = request.data.get('type')
        except Exception as e:
            return Response({'error': 'Missing individual parameter(s); email, start_time, end_time or type'}, status=status.HTTP_400_BAD_REQUEST)

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
            return Response({'error': f'Missing individual parameter(s): {", ".join(param_error)}'}, status=status.HTTP_400_BAD_REQUEST)

        if (availability_type != "available" and availability_type != "preferred"):
            return Response({'error': "type must be either 'available' or 'preferred'"}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure start time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(start_time):
            return Response({'error': 'start_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure end time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(end_time):
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
                        raise ValidationError(serializer.errors)
                
                return Response(creation_data, status=status.HTTP_201_CREATED)
        except OverlapException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({'error': e}, status=status.HTTP_400_BAD_REQUEST)


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

        if (availability_type != "available" and availability_type != "preferred"):
            return Response({'error': "type must be either 'available' or 'preferred'"}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure start time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(start_time):
            return Response({'error': 'start_time must be of the format YYYY-MM-DDThh:mm'}, status=status.HTTP_400_BAD_REQUEST)

        # validation: make sure end time is of format YYYY-MM-DDThh:mm
        if not is_valid_datetime_string(end_time):
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
        except ValidationError as e:
            return Response({'error': e}, status=status.HTTP_400_BAD_REQUEST)

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
        if not is_valid_datetime_string(end_time):
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
                    if a1.start_time < a2.end_time:
                        times = {'start_time': str(a1.start_time), 'end_time': str(a2.end_time)}
                        overlapping_times.add(tuple(times.values()))
                elif (a2.start_time >= a1.start_time and a2.end_time >= a1.end_time):
                    if a2.start_time < a1.end_time:
                        times = {'start_time': str(a2.start_time), 'end_time': str(a1.end_time)}
                        overlapping_times.add(tuple(times.values()))
                elif (a1.start_time >= a2.start_time and a1.end_time <= a2.end_time):
                    if a1.start_time < a1.end_time:
                        times = {'start_time': str(a1.start_time), 'end_time': str(a1.end_time)}
                        overlapping_times.add(tuple(times.values()))
                elif (a2.start_time >= a1.start_time and a2.end_time <= a1.end_time):
                    if a2.start_time < a2.end_time:
                        times = {'start_time': str(a2.start_time), 'end_time': str(a2.end_time)}
                        overlapping_times.add(tuple(times.values()))

        overlapping_times = [{'start_time': start_time, 'end_time': end_time} for start_time, end_time in overlapping_times]
        return Response(overlapping_times)
