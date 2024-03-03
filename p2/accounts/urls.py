from django.urls import path
from .views import ContactRequestView

app_name = 'accounts'

urlpatterns = [
    path('contact_request/', ContactRequestView.as_view(), name="contact_request")
]