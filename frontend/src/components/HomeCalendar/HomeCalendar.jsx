import React, { useState, useEffect } from 'react'
import './HomeCalendar.css'
import { useNavigate } from 'react-router-dom'

const HomeCalendar = ({ events }) => {
    const navigate = useNavigate()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [displayDays, setDisplayDays] = useState(4)

    const goToNextDay = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))
    }

    const goToPreviousDay = () => {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))
    }

    const goToEventDetail = eventId => {
        navigate(`/meeting_details/${eventId}`)
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

    // Function to check if an event is on a given date and time
    const isEventOnDateTime = (event, date) => {
        const eventDate = new Date(event.selected_time)
        return (
            eventDate.toDateString() === date.toDateString() &&
            eventDate.getHours() === date.getHours() &&
            eventDate.getMinutes() === date.getMinutes()
        )
    }

    const getRandomBackgroundColor = () => {
        const colors = [
            '#FFCCCB',
            '#FFE4CC',
            '#FFD1FF',
            '#FFFFCC',
            '#99D6EA',
            '#EAD9C9',
            '#99A3FF',
            '#CCC2A3',
            '#CCFFCC',
            '#D1A3A3',
            '#B3D699',
            '#D1D18C',
            '#FFDADA',
            '#A3B3D6',
            '#B3D1A3',
        ]
        return colors[Math.floor(Math.random() * colors.length)]
    }

    const renderCalendarCells = () => {
        const rows = []
        for (let hour = 0; hour < 24; hour++) {
            for (let half = 0; half < 2; half++) {
                // Add loop for half-hour intervals
                const row = []
                const timeString = `${hour.toString().padStart(2, '0')}:${half === 0 ? '00' : '30'}`
                row.push(<td className='time'>{timeString}</td>) // Time column

                for (let i = 0; i < displayDays; i++) {
                    const date = new Date(currentDate)
                    date.setDate(currentDate.getDate() + i)
                    date.setHours(hour, half * 30, 0, 0) // Set minutes to 0 or 30

                    const event =
                        Array.isArray(events) &&
                        events.find(e => isEventOnDateTime(e, date))
                    if (event) {
                        row.push(
                            <td
                                key={`${hour}-${half}-${i}`}
                                className='with-meeting'
                                style={{
                                    backgroundColor: getRandomBackgroundColor(),
                                }}
                                onClick={() => goToEventDetail(event.id)} // Add click handler
                            >
                                <div className='meeting-tile'>
                                    {event.name}
                                    <div className='meeting-tile-subtext'>
                                        with {event.otherUser}
                                    </div>
                                </div>
                            </td>
                        )
                    } else {
                        row.push(<td key={`${hour}-${half}-${i}`}></td>)
                    }
                }
                rows.push(<tr key={`${hour}-${half}`}>{row}</tr>)
            }
        }
        return rows
    }

    return (
        <div className='calendar-container'>
            <table>
                <thead>
                    <tr className='header'>{renderHeaderDates()}</tr>
                </thead>

                <tbody>{renderCalendarCells()}</tbody>
            </table>
        </div>
    )
}

export default HomeCalendar
