from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model


class CustomUser(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    contacts = models.ManyToManyField('self', blank=True, symmetrical=True)

    def __str__(self):
        return self.email

class ContactRequest(models.Model):
    from_user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='requests_sent')
    to_user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='received_requests')
    timestamp = models.DateTimeField(auto_now_add=True)