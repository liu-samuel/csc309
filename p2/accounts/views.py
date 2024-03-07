from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import ContactRequest
from .serializers import ContactRequestSerializer


class ContactRequestAPIView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        current_user = request.user
        email = request.query_params.get('email')

        if current_user.email == email:
            return Response({'error': 'Can\'t send request to yourself'}, status=status.HTTP_404_NOT_FOUND)

        try:
            target_user = get_user_model().objects.get(email=email)
        except get_user_model().DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        existing_request = ContactRequest.objects.filter(from_user=current_user, to_user=target_user).first()
        if existing_request:
            return Response({'message': 'ContactRequest already exists'}, status=status.HTTP_200_OK)
        
        contact_request_data = {
            'from_user': current_user.id,
            'to_user': target_user.id,
        }

        serializer = ContactRequestSerializer(data=contact_request_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        current_user = request.user
        email = request.query_params.get('email')

        try:
            target_user = get_user_model().objects.get(email=email)
        except get_user_model().DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        contact_request = ContactRequest.objects.filter(from_user=target_user, to_user=current_user).first()
        if contact_request:
            contact_request.delete()
            return Response({'message': 'ContactRequest deleted successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'ContactRequest not found'}, status=status.HTTP_404_NOT_FOUND)




