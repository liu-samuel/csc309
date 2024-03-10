import datetime
from django.core import mail

"""
Checks if a string is a valid datetime string of the format YYYY-MM-DDThh:mm
"""
def is_valid_datetime_string(time):
    try:
        formatted = datetime.datetime.strptime(time, "%Y-%m-%dT%H:%M")
    except:
        return False
    return True

"""
Sends an email
"""
def send_email(from_email, recipient_list, subject, body):
    with mail.get_connection() as connection:
        mail.EmailMessage(
            subject,
            body,
            from_email,
            recipient_list,
            connection=connection,
        ).send()