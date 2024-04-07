import { React, useState, useRef } from 'react'
import './NewMeeting.css'
import axios from 'axios'
import NavBar from '../../components/NavBar/NavBar'
import Footer from '../../components/Footer/Footer'
import Calendar from '../../components/Calendar/Calendar'
import { EVENT_URL, TOKEN_URL, USER_URL } from '../../constants'
import { useAuth } from '../../contexts/AuthContext'

const NewMeeting = () => {
  const childRef = useRef();
    const [eventName, setEventName] = useState('')
    const [invitee, setInvitee] = useState('')
    const [deadline, setDeadline] = useState('')
    const [agenda, setAgenda] = useState('')
    const [inviteMessage, setInviteMessage] = useState('')
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const {user, logout} = useAuth();

    async function sendMeetingInvite(email) {
        try {
            let inviteeID = await getIDFromEmail(invitee)
            const postData = {
                invitee: String(inviteeID),
                deadline: deadline,
                name: eventName,
                agenda: agenda,
            }
            const response = await axios.post(`${EVENT_URL}`, postData, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            })
            setInviteMessage(response.data.message)
            setInviteSuccess(true)
            await childRef.current.addAvailability(email, response.data.event.id);

        } catch (error) {
            console.error('Error creating new event: ', error)
            setInviteMessage(error.response.data.error)
            setInviteSuccess(false)
        }
    }

    async function getIDFromEmail(email) {
        try {
            const response = await axios.get(`${USER_URL}?email=${email}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            })
            return response.data.user_id
        } catch (error) {
            console.error('Error creating new event: ', error)
        }
    }

    return (
        <div className='full-page'>
            <NavBar />
            <div className='new-meeting-content'>
                <h1 className='title'>
                    New Meeting With <span className='attending-name'>{user.firstName} {user.lastName}</span>
                </h1>
                <Calendar ref={childRef}/>
                <div className='calendar-mobile-buttons'>
                    <button className='button-primary calendar-button'>
                        Previous Day
                    </button>
                    <button className='button-primary calendar-button'>
                        Next Day
                    </button>
                </div>

                <div className='event-name'>
                    <div className='form-label'>Event Name</div>
                    <input
                        type='text'
                        placeholder='Event Name'
                        value={eventName}
                        onChange={e => setEventName(e.target.value)}
                    />
                </div>
                <div className='search-bar'>
                    <div className='form-label'>Invite Others</div>
                    <input
                        type='text'
                        placeholder='Invite Others'
                        value={invitee}
                        onChange={e => setInvitee(e.target.value)}
                    />
                </div>
                <div className='deadline'>
                    <div className='form-label'>Deadline To Respond</div>
                    <input
                        type='text'
                        placeholder='YYYY-MM-DD'
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                    />
                </div>
                <div className='agenda'>
                  <div className='form-label'>Meeting Agenda</div>
                  <textarea
                        placeholder='Agenda'
                        value={agenda}
                        onChange={e => setAgenda(e.target.value)}
                    />
                </div>
                <div className='submit-button'>
                    <button
                        className='button-primary'
                        onClick={async () => {await sendMeetingInvite(user.email);}}
                    >
                        Send Invite
                    </button>
                </div>
                <div className='invite-message'>
                    <div style={{ color: inviteSuccess ? 'green' : 'red' }}>
                        {inviteMessage}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}


export default NewMeeting
