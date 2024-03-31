import React from 'react'
import './Calendar.css'

class Calendar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            startDate: new Date(),
        }
    }

    nextWeek = () => {
        const { startDate } = this.state
        const nextWeekStartDate = new Date(startDate)
        nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 4)
        this.setState({ startDate: nextWeekStartDate })
    }

    prevWeek = () => {
        const { startDate } = this.state
        const prevWeekStartDate = new Date(startDate)
        prevWeekStartDate.setDate(prevWeekStartDate.getDate() - 4)
        this.setState({ startDate: prevWeekStartDate })
    }

    calculateDayDate = (startDate, dayIndex) => {
        const date = new Date(startDate)
        date.setDate(date.getDate() + dayIndex)
        return date.toLocaleDateString()
    }

    renderWeekdays = () => {
        const weekdays = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ]
        const startDayIndex = this.state.startDate.getDay()

        const weekdayElements = Array.from({ length: 4 }, (_, i) => {
            const weekdayIndex = (startDayIndex + i) % 7
            const day = weekdays[weekdayIndex]

            return (
                <th key={day}>
                    <span className='day'>{day}</span>
                    <span className='date'>
                        {this.calculateDayDate(this.state.startDate, i)}
                    </span>
                </th>
            )
        })

        return <tr className='calendar-header'>{weekdayElements}</tr>
    }

    render() {
        const hours = Array.from({ length: 24 }, (_, i) => i)

        return (
            <div className='calendar'>
                <div className='calendar-header'>
                    <h2>
                        {this.calculateDayDate(this.state.startDate, 0)} -{' '}
                        {this.calculateDayDate(this.state.startDate, 3)}
                    </h2>
                    <div className='calendar-color-index'>
                        <div className='calendar-index-container'>
                            <p>Available:</p>
                            <div className='calendar-available-box secondary-green-background'></div>
                        </div>
                        <div className='calendar-index-container'>
                            <p>Preferred:</p>
                            <div className='calendar-preferred-box blue-background'></div>
                        </div>
                    </div>
                </div>
                <div className='calendar-container'>
                    <div className='week-buttons'>
                        <button
                            onClick={this.prevWeek}
                            className='button-primary prev-week'
                        >
                            Previous Week
                        </button>
                        <button
                            onClick={this.nextWeek}
                            className='button-primary'
                        >
                            Next Week
                        </button>
                    </div>
                    <table>
                        <thead>{this.renderWeekdays()}</thead>
                        <tbody>
                            {hours.map(hour => (
                                <tr key={hour}>
                                    <td className='time'>
                                        {String(hour).padStart(2, '0')}:00
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}

export default Calendar
