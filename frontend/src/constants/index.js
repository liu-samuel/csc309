export const CONTACT_REQUEST_URL = 'http://localhost:8000/accounts/contact_request/';
export const CONTACTS_URL = 'http://localhost:8000/accounts/contacts/';
export const TOKEN_URL = 'http://localhost:8000/accounts/token/';
export const USER_URL = 'http://localhost:8000/accounts/user/';
export const EVENT_URL = 'http://localhost:8000/schedules/events/';
export const REGISTER_URL = 'http://localhost:8000/accounts/register/';
export const EVENT_AVAILABILITY_URL = (event_id) => {
  return `http://localhost:8000/schedules/events/${event_id}/availability/`;
};
