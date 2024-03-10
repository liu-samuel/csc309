from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import Event, Availability
from .serializers import EventSerializer, AvailabilitySerializer


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
