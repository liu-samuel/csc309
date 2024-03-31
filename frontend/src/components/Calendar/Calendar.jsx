import React from 'react';
import './Calendar.css'

class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: new Date(), // Current date as the start date
    };
  }

  // Function to advance to the next week
  nextWeek = () => {
    const { startDate } = this.state;
    const nextWeekStartDate = new Date(startDate);
    nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 4);
    this.setState({ startDate: nextWeekStartDate });
  };

  // Function to go back to the previous week
  prevWeek = () => {
    const { startDate } = this.state;
    const prevWeekStartDate = new Date(startDate);
    prevWeekStartDate.setDate(prevWeekStartDate.getDate() - 4);
    this.setState({ startDate: prevWeekStartDate });
  };
  
  calculateDayDate = (startDate, dayIndex) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString();
  };

  render() {
    // Array of hours
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar">
          <div className="calendar-header">
          <h2>{this.calculateDayDate(this.state.startDate, 0)} - {this.calculateDayDate(this.state.startDate, 3)}</h2>
            <div className="calendar-color-index">
              <div className="calendar-index-container">
                <p>Available:</p>
                <div
                  className="calendar-available-box secondary-green-background"
                ></div>
              </div>
              <div className="calendar-index-container">
                <p>Preferred:</p>
                <div
                  className="calendar-preferred-box blue-background"
                ></div>
              </div>
            </div>
          </div>
      <div className="calendar-container">
        <div className='week-buttons'>
          <button onClick={this.prevWeek} className='button-primary prev-week'>Previous Week</button>
          <button onClick={this.nextWeek} className='button-primary'>Next Week</button>
        </div>
        <table>
          <thead>
            <tr className="calendar-header">
            {['Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
                <th key={day}>
                  <span className="day">{day}</span>
                  <span className="date">{this.calculateDayDate(this.state.startDate, index)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td className="time">{String(hour).padStart(2, '0')}:00</td>
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
    );
  }
}

export default Calendar;