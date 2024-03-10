from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import Event
from .serializers import EventSerializer
from django.core import serializers
from django.core import mail

import json

class EventsListAPIView(generics.ListCreateAPIView):
    # permission_classes = [permissions.IsAuthenticated]

    def get(self, request, **kwargs):
        owner = request.query_params.get("owner")
        invitee = request.query_params.get("invitee")
        is_finalized = request.query_params.get("is_finalized")
        
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
        owner = request.data.get("owner")
        invitee = request.data.get("invitee")
        deadline = request.data.get("deadline")
        name = request.data.get("name")
        is_finalized = False
        selected_time = None
        
        # validations
        try:
            owner_user = get_user_model().objects.get(pk=owner)
            invitee_user = get_user_model().objects.get(pk=invitee)

            if not name: # necessary due to serializer
                name = f'{owner_user.first_name} / {invitee_user.first_name}'
        except get_user_model().DoesNotExist:
            return Response({'error': 'User(s) not found'}, status=status.HTTP_404_NOT_FOUND)
        
        event_data = {
            "owner": owner,
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

            send_request_email(owner=owner_user, invitee=invitee_user, event=event)
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def send_request_email(owner, invitee, event):
    owner_email = owner.email
    invitee_email = invitee.email
    subject = f"{owner.email} has invited you to input availability for '{event.name}'"
    description = f"add link here"
    with mail.get_connection() as connection:
        mail.EmailMessage(
            subject,
            description,
            owner_email,
            [invitee_email],
            connection=connection,
        ).send()
