from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import Event
from .serializers import EventSerializer
from django.core import serializers

class EventsListAPIView(generics.CreateAPIView):
    # permission_classes = [permissions.IsAuthenticated]

    def get(self, request, **kwargs):
        owner = request.query_params.get("owner")
        invitee = request.query_params.get("invitee")
        is_finalized = request.query_params.get("is_finalized")

        try:
            events = Event.objects.filter(owner=owner, invitee=invitee, is_finalized=is_finalized)
        except:
            return Response({'error': 'Cannot get availabilities for event'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            events_response = serializers.serialize('json', events)

            return Response(events_response, status=status.HTTP_201_CREATED)
        except:
            return Response({'error': 'Serialization error'}, status=status.HTTP_400_BAD_REQUEST)


    def post(self, request, **kwargs):
        owner = request.POST.get("owner")
        invitee = request.POST.get("invitee")
        deadline = request.POST.get("deadline")
        name = request.POST.get("name")
        is_finalized = False
        selected_time = None

        # necessary due to serializer
        if not name:
            name = ""
        
        # TODO validations

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
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


