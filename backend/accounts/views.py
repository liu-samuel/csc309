from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated

from .models import ContactRequest
from .serializers import ContactRequestSerializer, UserRegistrationSerializer

User = get_user_model()

class UserRegistrationAPIView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Check for existing user with the same username or email
            username = serializer.validated_data.get('username')
            email = serializer.validated_data.get('email')
            if User.objects.filter(username=username).exists():
                return Response({'error': 'A user with that username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(email=email).exists():
                return Response({'error': 'A user with that email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            user = serializer.save()
            return Response({
                "user": UserRegistrationSerializer(user).data,
                "message": "User created successfully"
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ContactsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        to_user = request.user
        from_user_email = request.data.get('email')
        if not from_user_email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if from_user_email == to_user.email:
            return Response({'error': "Can't add yourself as a contact"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find a contact request where the user who is "accepting" the request is the to_user
        contact_request = ContactRequest.objects.filter(to_user__email=to_user.email).first()
        if not contact_request:
            return Response({'error': "Could not find contact request between two specified users"}, status=status.HTTP_400_BAD_REQUEST)
        if contact_request.to_user != request.user:
            return Response({'error': "Only the requested user can accept this contact request"}, status=status.HTTP_400_BAD_REQUEST)

        from_user = contact_request.from_user
        
        # Add the from_user to the to_user's friend list
        request.user.contacts.add(contact_request.from_user)
        # Add the to_user to the from_user's friend list
        from_user.contacts.add(contact_request.to_user)

        # Delete the contact request
        contact_request.delete()

        return Response({'message': 'Contact added successfully'}, status=status.HTTP_201_CREATED)

    def get(self, request):
        # Get all contacts for the user
        contacts = request.user.contacts.all()
        contacts_data = [{'email': user.email, 'name': user.get_full_name()} for user in contacts]
        return Response(contacts_data, status=status.HTTP_200_OK)

    def delete(self, request):
        # Remove a contact from both users' contact lists
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        if email == request.user.email:
            return Response({'error': "Can't remove yourself as a contact"}, status=status.HTTP_400_BAD_REQUEST)

        
        try:
            contact_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Remove from both sides
        request.user.contacts.remove(contact_user)
        contact_user.contacts.remove(request.user)
        return Response({'message': 'Contact removed successfully'}, status=status.HTTP_200_OK)


class ContactRequestAPIView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        current_user = request.user
        contact_requests = ContactRequest.objects.filter(to_user=current_user)
        serializer = ContactRequestSerializer(contact_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        

    def create(self, request):
        current_user = request.user
        contacts = request.user.contacts.all()
        contacts_emails = [user.email for user in contacts]
        email = request.data.get('email')
        to_user = request.data.get

        if not email:
            return Response({'error': 'Field "email" is required'}, status=status.HTTP_400_BAD_REQUEST)

        if email in contacts_emails:
            return Response({'error': 'You are already contacts with this user'}, status=status.HTTP_400_BAD_REQUEST)

        if current_user.email == email:
            return Response({'error': 'Can\'t send request to yourself'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = get_user_model().objects.get(email=email)
        except get_user_model().DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        existing_request = ContactRequest.objects.filter(from_user=current_user, to_user=target_user).first()
        if existing_request:
            return Response({'message': 'ContactRequest already exists'}, status=status.HTTP_200_OK)
        
        existing_incoming_request = ContactRequest.objects.filter(from_user=target_user, to_user=current_user).first()
        if existing_incoming_request:
            return Response({'message': 'Incoming ContactRequest already exists'}, status=status.HTTP_200_OK)
        
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




