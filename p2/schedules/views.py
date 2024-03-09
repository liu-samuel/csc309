from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer

class EventAPIView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            availabilities = Availability.objects.filter(event__pk=event_id)
        except:
            return Response({'error': 'Cannot get availabilities for event'}, status=status.HTTP_404_NOT_FOUND)


        return Response("Hello, " + str(kwargs["event_id"]), status=200)
    

class EventAvailabilityAPIView(generics.CreateAPIView):
    # permission_classes = [permissions.IsAuthenticated]

    def post(self, request, **kwargs):
        event_id = kwargs["event_id"]

        try:
            print(request.POST)
            user_email = request.POST.get('email')
            start_time = request.POST.get('start_time')
            end_time = request.POST.get('end_time')
            availability_type = request.POST.get('type')
        except Exception as e:
            print(e)
            return Response({'error': 'Missing parameter(s); email, start_time, end_time or type'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            print(user_email)
            user = get_user_model().objects.get(email=user_email)
        except get_user_model().DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # TODO: validation: check event_id

        # TODO: round start and end time to nearest hour
        # TODO: validation: make sure start time and end time are on the same day
        # TODO: validation: make sure start time < end time
        # TODO: validation: make sure start and end time are not in the future

        # TODO: validation: check for start/end time overlap

        availability_data = {
            'person': user.pk,
            'start_time': start_time,
            'end_time': end_time,
            'event': event_id,
            'type': availability_type
        }

        serializer = AvailabilitySerializer(data=availability_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


