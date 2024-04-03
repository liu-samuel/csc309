import React from 'react'
import './Home.css'
import NavBar from '../../components/NavBar/NavBar'
import HomeCalendar from '../../components/HomeCalendar/HomeCalendar'

const Home = () => {
    return (
        <div className='full-page'>
            <NavBar />
            <main className='content'>
                <div className='calendar'>
                    <HomeCalendar />
                </div>
                <div className='meetings'>
                    <div className='meeting-requests'>
                        <h3>Meeting Requests</h3>
                        <div className='meeting-request'>
                            <span className='title'>Sprint Retro</span>
                            <span className='requester'>with Samuel Liu</span>
                            <span className='due'>due Jan 14, 2:00PM</span>
                            <button
                                className='add-availability button-primary'
                                onclick='viewMeetingDetails()'
                            >
                                Enter your availability
                            </button>
                        </div>
                    </div>
                    <div class='proposed-meetings'>
                        <h3 class='white'>Proposed Meetings</h3>
                        <div class='proposed-meeting'>
                            <span class='title'>Run Club</span>
                            <span class='requester'>
                                with Elsie Zhu, Ron Varshavsky, and Samuel Liu
                            </span>
                            <button
                                class='add-availability button-secondary'
                                onclick='viewMeetingDetails()'
                            >
                                View
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Home
