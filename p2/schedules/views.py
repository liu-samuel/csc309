from .utils import send_email
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import Event
from .serializers import EventSerializer
from django.core import serializers

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer

import json

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
            return Response({'error': f"Missing required parameters {missing_params.join(', ')}"}, status=status.HTTP_400_BAD_REQUEST)
        
        # check that the current user is either the owner or the invitee
        current_user = request.user
        if (current_user.pk != owner) and (current_user.pk != invitee):
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        
        # check that owner and invitee are different
        if owner == invitee:
            return Response({'error': 'owner and invitee must be different'}, status=status.HTTP_400_BAD_REQUEST)

        if is_finalized:
            if is_finalized.lower() == "false":
                is_finalized = False
            elif is_finalized.lower() == "true":
                is_finalized = True
        
        try:
            events = Event.objects.filter(owner__pk=owner, invitee__pk=invitee, is_finalized=bool(is_finalized))
        except Exception:
            return Response({'error': 'Cannot get availabilities for event'}, status=status.HTTP_404_NOT_FOUND)

        try:
            events_response = serializers.serialize('json', events)
            return Response(json.loads(events_response), status=status.HTTP_200_OK)
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
            return Response({'error': f"Missing required parameters {missing_params.join(', ')}"}, status=status.HTTP_400_BAD_REQUEST)
        
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
        if invitee_user not in owner.friends.all():
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
    body = f"add link here"

    send_email(owner_email, [invitee_email], subject, body)



class SuggestionAPIView(APIView):
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
