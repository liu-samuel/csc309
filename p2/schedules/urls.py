from django.urls import path
from .views import EventAPIView, EventAvailabilityAPIView
from .views import SuggestionAPIView

app_name = 'schedules'

urlpatterns = [
    path('events/<int:event_id>/availability/', EventAvailabilityAPIView.as_view(), name="event_availability"),
    path('events/<int:event_id>/', EventAPIView.as_view(),  name="events_id"),
    path('events/<int:event_id>/suggestion/', SuggestionAPIView.as_view(), name="suggestion")
]