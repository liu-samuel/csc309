from django.urls import path
from .views import ContactRequestAPIView, ContactsAPIView, UserRegistrationAPIView, UserAPIView, UserIdFromEmailAPIView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', UserRegistrationAPIView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('contact_request/', ContactRequestAPIView.as_view(), name="contact_request"),
    path('contacts/', ContactsAPIView.as_view(), name='contacts'),
    path('user/<int:user_id>/', UserAPIView.as_view(), name='user'),
    path('user/', UserIdFromEmailAPIView.as_view(), name='user_email'),
]