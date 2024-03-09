from django.urls import path

app_name = 'schedules'

urlpatterns = [
    # path('contact_request/', ContactRequestView.as_view(), name="contact_request")
    path('events/<int:event_id>/availability/', name="event_availability"),
    path('events/<int:event_id>/', name="events")
]