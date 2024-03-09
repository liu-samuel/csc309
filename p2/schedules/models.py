from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class Event(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owner")
    invitee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invitee")
    deadline = models.DateTimeField()
    name = models.CharField(max_length=50, blank=True)
    is_finalized = models.BooleanField()
    selected_time = models.DateTimeField(null=True)

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = f"{self.owner.first_name} / {self.invitee.first_name}"
        super(Event, self).save(*args, **kwargs)

class Availability(models.Model):
    class AvailabilityType(models.TextChoices):
        PREFERRED = "preferred", _("preferred")
        AVAILABLE = "available", _("available")

    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='person')
    start_time = models.DateTimeField(null=False)
    end_time = models.DateTimeField(null=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='requests_sent')
    type = models.CharField(choices=AvailabilityType, default=AvailabilityType.AVAILABLE, max_length=9)