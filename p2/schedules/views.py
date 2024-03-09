from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import Event
from .serializers import EventSerializer

class EventAPIView(generics.CreateAPIView):
    # permission_classes = [permissions.IsAuthenticated]

    def get(self, request, **kwargs):
        print(kwargs["event_id"])
        return Response("Hello, " + str(kwargs["event_id"]), status=200)
    
