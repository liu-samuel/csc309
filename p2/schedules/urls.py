from django.urls import path
from .views import EventsListAPIView


app_name = 'schedules'

urlpatterns = [
    path('events/', EventsListAPIView.as_view(), name='events')
]