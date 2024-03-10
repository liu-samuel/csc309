from django.urls import path
from .views import EventsListAPIView, SuggestionAPIView
# from .views import EventAPIView, EventAvailabilityAPIView, SuggestionAPIView


app_name = 'schedules'

urlpatterns = [
    path('events/', EventsListAPIView.as_view(), name='events'),
    path('events/<int:event_id>/suggestion/', SuggestionAPIView.as_view(), name="suggestion")
]