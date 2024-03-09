from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class Event(models.Model):
    # TODO
    pass

class Availability(models.Model):
    class AvailabilityType(models.TextChoices):
        preferred = "preferred", _("preferred")
        available = "available", _("available")

    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='person')
    start_time = models.DateTimeField(null=False)
    end_time = models.DateTimeField(null=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='requests_sent')
    type = models.CharField(choices=AvailabilityType, default=AvailabilityType.available, max_length=9)