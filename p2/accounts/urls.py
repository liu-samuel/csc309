from django.urls import path
from .models import ContactRequestView

app_name = 'accounts'

urlpatterns = [
    path('contact_request/', ContactRequestView.as_view(), name="contact_request")
]