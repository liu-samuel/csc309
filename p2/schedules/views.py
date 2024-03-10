from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

class SuggestionAPIView(APIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def get(self, request):
        event_id = self.kwargs.get('pk')
        try:
            event = self.get_queryset().get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=404)
        
        invitee = event.invitee
        owner = event.owner

        invitee_availabilities = Availability.objects.filter(person_id=invitee.id, type='availability')
        owner_availabilities = Availability.objects.filter(person_id=owner.id, type='availability')

        overlapping_times = []

        for a1 in owner_availabilities:
            for a2 in invitee_availabilities: 
                if (a1.start_time <= a2.start_time and a1.start_time >= a2.end_time):
                    overlapping_times.append(a2)
        return overlapping_times
