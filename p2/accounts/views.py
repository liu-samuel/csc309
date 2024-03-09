from .models import ContactRequest
from django.views.generic import ListView


# TODO: this is temporary to fix bug related to .as_view() in urls.py
class ContactRequestView(ListView):
    model = ContactRequest
    
    def get():
        return

    def post():
        return