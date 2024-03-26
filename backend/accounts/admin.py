from django.contrib import admin
from .models import ContactRequest, CustomUser

admin.site.register(ContactRequest)
admin.site.register(CustomUser)
