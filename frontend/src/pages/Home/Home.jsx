import React, { useEffect, useState } from 'react'
import './Home.css'
import NavBar from '../../components/NavBar/NavBar'
import HomeCalendar from '../../components/HomeCalendar/HomeCalendar'
import { useAuth } from '../../contexts/AuthContext'
import { EVENT_URL, USER_URL } from '../../constants'
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [events, setEvents] = useState([])
    const [meetingRequests, setMeetingRequests] = useState([])
    const [proposedMeetings, setProposedMeetings] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return

            try {
                const fetchedEvents = await fetchEvents()
                setEvents(fetchedEvents)

                const fetchedMeetingRequests = await fetchMeetingRequests()
                setMeetingRequests(fetchedMeetingRequests)

                const fetchedProposedMeetings = await fetchProposedMeetings()
                setProposedMeetings(fetchedProposedMeetings)
            } catch (error) {
                console.error('Error fetching data:', error)
            }
            console.log('events', events)
            console.log('meetingRequests', meetingRequests)
            console.log('propsedMeetings', proposedMeetings)
        }

        fetchData()
    }, [user]) // Dependency array, re-run the effect when `user` changes

    // Helper function to fetch user details
    const fetchUserDetails = async userId => {
        try {
            const response = await fetch(`${USER_URL}${userId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            })
            const userDetails = await response.json()
            return userDetails.name
        } catch (error) {
            console.error('Error fetching user details:', error)
            return null
        }
    }

    const fetchEvents = async () => {
        if (!user) return []

        try {
            const eventsWhereOwnerRes = await fetch(
                `${EVENT_URL}?owner=${user.id}&is_finalized=true`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            )
            const eventsWhereOwner = await eventsWhereOwnerRes.json()

            const eventsWhereInviteeRes = await fetch(
                `${EVENT_URL}?invitee=${user.id}&is_finalized=true`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            )
            const eventsWhereInvitee = await eventsWhereInviteeRes.json()

            // Combine the events and map over them to replace the user ID with the name
            const events = [
                ...eventsWhereOwner.events,
                ...eventsWhereInvitee.events,
            ].map(async event => {
                // Check if the current user is the owner or invitee and fetch the other user's details
                const otherUserId =
                    user.id === event.owner ? event.invitee : event.owner
                const otherUserName = await fetchUserDetails(otherUserId)
                return {
                    ...event,
                    otherUser: otherUserName, // Add the other user's name to the event object
                }
            })

            // Resolve all promises from the map (since fetchUserDetails is async)
            const eventsWithNames = await Promise.all(events)
            return eventsWithNames
        } catch (error) {
            console.error('Error fetching events:', error)
            return []
        }
    }

    const fetchMeetingRequests = async () => {
        if (!user) return []

        try {
            const meetingRequestsRes = await fetch(
                `${EVENT_URL}?invitee=${user.id}&is_finalized=false`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            )
            const meetingRequestsJson = await meetingRequestsRes.json()
            const meetingRequests = meetingRequestsJson.events.map(
                async event => {
                    // Assuming the owner is the other user in this context
                    const otherUserName = await fetchUserDetails(event.owner)
                    return {
                        ...event,
                        otherUser: otherUserName,
                    }
                }
            )

            // Resolve all promises from the map
            const meetingRequestsWithNames = await Promise.all(meetingRequests)
            return meetingRequestsWithNames
        } catch (error) {
            console.error('Error fetching meeting requests:', error)
            return []
        }
    }

    const fetchProposedMeetings = async () => {
        if (!user) return []

        try {
            const proposedMeetingsRes = await fetch(
                `${EVENT_URL}?owner=${user.id}&is_finalized=false`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            )
            const proposedMeetingsJson = await proposedMeetingsRes.json()
            const proposedMeetings = proposedMeetingsJson.events.map(
                async event => {
                    // Assuming the invitee is the other user in this context
                    const otherUserName = await fetchUserDetails(event.invitee)
                    return {
                        ...event,
                        otherUser: otherUserName,
                    }
                }
            )

            // Resolve all promises from the map
            const proposedMeetingsWithNames =
                await Promise.all(proposedMeetings)
            return proposedMeetingsWithNames
        } catch (error) {
            console.error('Error fetching proposed meetings:', error)
            return []
        }
    }

    return (
        <div className='full-page'>
            <NavBar />
            <main className='content'>
                <div className='calendar'>
                    <HomeCalendar events={events} />
                </div>
                <div className='meetings'>
                    <div className='meeting-requests'>
                        <h3>Meeting Requests</h3>
                        {meetingRequests.length > 0 ? (
                            meetingRequests.map(request => (
                                <div
                                    className='meeting-request'
                                    key={request.id}
                                >
                                    <span className='title'>
                                        {request.name}
                                    </span>
                                    <span className='requester'>
                                        with {request.otherUser}
                                    </span>
                                    <span className='due'>
                                        due{' '}
                                        {new Date(
                                            request.deadline
                                        ).toLocaleString()}
                                    </span>
                                    <button
                                        className='add-availability button-primary'
                                        onClick={() =>
                                            navigate(
                                                `/meeting_details/${request.id}`
                                            )
                                        }
                                    >
                                        Enter your availability
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>You have no pending meeting requests.</p>
                        )}
                    </div>
                    <div className='proposed-meetings'>
                        <h3 style={{ color: 'white' }}>Proposed Meetings</h3>
                        {proposedMeetings.length > 0 ? (
                            proposedMeetings.map(meeting => (
                                <div
                                    className='proposed-meeting'
                                    key={meeting.id}
                                >
                                    <span className='title'>
                                        {meeting.name}
                                    </span>
                                    <span className='requester'>
                                        with {meeting.otherUser}
                                    </span>
                                    <span className='due'>
                                        due{' '}
                                        {new Date(
                                            meeting.selected_time
                                        ).toLocaleString()}
                                    </span>
                                    <button
                                        className='add-availability button-secondary'
                                        onClick={() =>
                                            navigate(
                                                `/meeting_details/${meeting.id}`
                                            )
                                        }
                                    >
                                        View
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'white' }}>
                                You have no unfinished proposed meetings.
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Home
