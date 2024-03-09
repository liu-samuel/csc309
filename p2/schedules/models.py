from django.db import models
from django.contrib.auth.models import User

# Create your models here.
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
