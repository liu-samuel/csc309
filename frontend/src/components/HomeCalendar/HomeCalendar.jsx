import React, { useState, useEffect } from 'react'
import './HomeCalendar.css'

const HomeCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [displayDays, setDisplayDays] = useState(4)

    // Placeholder for fetching events from the backend
    const fetchEvents = () => {
        // TODO: Implement event fetching logic
        return []
    }

    const fetchMeetingRequests = () => {}

    const fetchProposedMeetings = () => {}

    const events = fetchEvents()

    const goToNextDay = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))
    }

    const goToPreviousDay = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))
    }

    const goToEventDetail = eventId => {
        // TODO: Navigate to event's detail page
    }

    useEffect(() => {
        const updateDisplayDaysBasedOnWidth = () => {
            const screenWidth = window.innerWidth
            if (screenWidth <= 767) {
                setDisplayDays(1) // Only show the current day on small screens
            } else {
                setDisplayDays(4) // Show the next four days on larger screens
            }
        }

        updateDisplayDaysBasedOnWidth()
        window.addEventListener('resize', updateDisplayDaysBasedOnWidth)

        return () =>
            window.removeEventListener('resize', updateDisplayDaysBasedOnWidth)
    }, [])

    // Function to render header dates dynamically based on displayDays state
    const renderHeaderDates = () => {
        const dates = []
        for (let i = 0; i < displayDays; i++) {
            const date = new Date(currentDate)
            date.setDate(currentDate.getDate() + i)
            dates.push(
                <th key={i}>
                    <span className='day'>
                        {date.toLocaleString('default', { weekday: 'long' })}
                    </span>
                    <span className='date'>{date.toLocaleDateString()}</span>
                </th>
            )
        }
        return dates
    }

    return (
        <div className='calendar-container'>
            <table>
                <thead>
                    <tr className='header'>{renderHeaderDates()}</tr>
                </thead>
                <tbody>
                    <tr>
                        <td className='time'>00:00</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>01:00</td>
                        <td
                            className='with-meeting'
                            onclick='viewMeetingDetails()'
                        >
                            <div className='meeting-tile'>
                                Run Club
                                <div className='meeting-tile-subtext'>
                                    with Samuel, Elsie, and Ron
                                </div>
                            </div>
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>02:00</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>03:00</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>04:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>05:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>06:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>07:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>08:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>09:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>10:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>11:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>12:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>13:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>14:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>15:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>16:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>17:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>18:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>19:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>20:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>21:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>22:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className='time'>23:00</td>

                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default HomeCalendar
