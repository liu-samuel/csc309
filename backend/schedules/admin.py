from django.contrib import admin
from .models import Event
from .models import Availability

admin.site.register(Event)
admin.site.register(Availability)

