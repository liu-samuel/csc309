from django.urls import path
from .views import EventAPIView

app_name = 'schedules'

urlpatterns = [
    # path('events/<int:event_id>/availability/', name="event_availability"),
    path('events/<int:event_id>/', EventAPIView.as_view(),  name="events_id")
]