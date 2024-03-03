from django.db import models
from django.contrib.auth.models import User

class ContactRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_sent')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    timestamp = models.DateTimeField(auto_now_add=True)