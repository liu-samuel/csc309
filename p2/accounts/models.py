from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    contacts = models.ManyToManyField('self', blank=True, symmetrical=True, related_name='my_friends')

    def __str__(self):
        return self.email

class ContactRequest(models.Model):
    from_user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='requests_sent')
    to_user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='received_requests')
    timestamp = models.DateTimeField(auto_now_add=True)