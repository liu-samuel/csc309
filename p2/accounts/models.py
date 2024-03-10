from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    # # Make email unique
    # email = models.EmailField(_('email address'), unique=True)
    # The email, password, first_name, and last_name fields are already included in the AbstractUser
    friends = models.ManyToManyField('self', blank=True, symmetrical=True, related_name='my_friends')
    # Make username optional
    # username = models.CharField(max_length=150, unique=True, blank=True, null=True)

    # Use email as the username field
    # USERNAME_FIELD = 'email'
    # REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class ContactRequest(models.Model):
    from_user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='requests_sent')
    to_user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='received_requests')
    timestamp = models.DateTimeField(auto_now_add=True)