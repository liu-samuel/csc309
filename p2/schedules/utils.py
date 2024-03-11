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

class OverlapException(Exception):
    def __init__(self, message):            
        # Call the base class constructor with the parameters it needs
        super().__init__(message)

"""
Rounds time to the nearest 30 minutes
@pre time is of the format YYYY-MM-DDThh:mm
"""
def round_time(time: str) -> str:
    time = time.split(":")
    start = time[0][:-2]
    hours = int(time[0][-2:])
    minutes = int(time[1])

    minute_offset = minutes % 30
    if (minute_offset >= 15):
        minutes += 30 - minute_offset
    else:
        minutes -= minute_offset

    if minutes == 60:
        hours += 1
        minutes = 0

    hours = str(hours)
    if len(hours) == 1:
        hours = "0" + hours

    minutes = str(minutes)
    if len(minutes) == 1:
        minutes = "0" + minutes

    new_time = start +  hours + ":" + minutes

    return new_time



"""
Returns if start_time is before end_time
@pre start_time, end_time is of the format YYYY-MM-DDThh:mm
"""
def time_orders_valid(start_time, end_time):
    return start_time < end_time


"""
Helper function to split a datetime string into its pieces
"""
def split_datetime_string(time):
    time = time.split(":")
    start = time[0][:-2]
    start = start.split("-")
    year = start[0]
    month = start[1]
    day = start[2][:-1]
    hours = time[0][-2:]
    minutes = time[1]
    return year, month, day, hours, minutes

"""
Returns if start_time and end_time are on the same day.
Also returns true if end_time ends at 12:00am the day after start_time.
@pre start_time, end_time is of the format YYYY-MM-DDThh:mm
"""
def start_end_same_day(start_time, end_time):
    start_year, start_month, start_day, start_hours, start_minutes = split_datetime_string(start_time)
    end_year, end_month, end_day, end_hours, end_minutes = split_datetime_string(end_time)

    if start_year == end_year and start_month == end_month:
        if start_day == end_day:
            return True
        
        start_day_datetime = datetime.datetime.strptime(start_time, "%Y-%m-%dT%H:%M")
        end_day_datetime = datetime.datetime.strptime(end_time, "%Y-%m-%dT%H:%M")

        end_day_minus_one = end_day_datetime - datetime.timedelta(days=1)
        # return True if 1 day apart and next day is 00:00
        if end_day_minus_one.strftime("%Y-%m-%d") == start_day_datetime.strftime("%Y-%m-%d"):
            return end_day_datetime.strftime("%H:%M") == "00:00"
        

    return False


"""
Helper function to build a datetime string from pieces
"""
def build_datetime_string(year, month, day, hour, minute):
    hour = str(hour)
    if len(hour) == 1:
        hour = "0" + hour
    minute = str(minute)
    if len(minute) == 1:
        minute = "0" + minute
    return f"{str(year)}-{str(month)}-{str(day)}T{hour}:{minute}"

"""
Splits start_time and end_time into a list of 30 minute increments
@pre start_time and end_time must be rounded to the nearest 30 minute

>>> split_into_increments("2023-11-09T11:00", "2023-11-09T12:30")
[["2023-11-09T11:00", "2023-11-09T11:30"], ["2023-11-09T11:30", "2023-11-09T12:00"], ["2023-11-09T12:00", "2023-11-09T12:30"]]
"""
def split_into_increments(start_time, end_time):
    start_year, start_month, start_day, start_hours, start_minutes = split_datetime_string(start_time)
    end_year, end_month, end_day, end_hours, end_minutes = split_datetime_string(end_time)

    start_hours = int(start_hours)
    start_minutes = int(start_minutes)
    end_hours = int(end_hours)
    end_minutes = int(end_minutes)

    if end_hours == 0:
        # set it to 24 so we can loop through it, modulus it after
        end_hours = 24

    split_list = []

    for hour in range(start_hours, end_hours + 1):
        # build the start/end for both 0 and 30
        start = build_datetime_string(start_year, start_month, start_day, hour % 24, "00")
        mid = build_datetime_string(start_year, start_month, start_day, hour % 24, "30")
        end = datetime.datetime.strptime(mid, "%Y-%m-%dT%H:%M") + datetime.timedelta(minutes=30)
        end = end.strftime("%Y-%m-%dT%H:%M")

        # base case for if you start at the 30 minute mark
        if hour == start_hours and start_minutes == 30:
            split_list.append([mid, end])
        elif hour < end_hours:
            split_list.append([start, mid])
            split_list.append([mid, end])
        else:
            # check if end_minutes ends at 30
            if end_minutes == 30:
                split_list.append([start, mid])

    return split_list

"""
Checks if a string is a valid datetime string of the format YYYY-MM-DDThh:mm
"""
def is_valid_datetime_string(time):
    try:
        formatted = datetime.datetime.strptime(time, "%Y-%m-%dT%H:%M")
    except:
        return False
    return True
