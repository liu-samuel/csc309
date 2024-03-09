from django.urls import path
from .views import ContactRequestAPIView

app_name = 'accounts'

urlpatterns = [
    path('contact_request/', ContactRequestAPIView.as_view(), name="contact_request"),
]