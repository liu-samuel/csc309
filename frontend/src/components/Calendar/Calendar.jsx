import React from "react";
import "./Calendar.css";
import axios from "axios";
import { EVENT_AVAILABILITY_URL, TOKEN_URL } from "../../constants";

class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: new Date(),
      token: "",
      logged_in_email: "user1@user1.com",
      calendarItems: Array.from({ length: 48 }, (_, i) => {
        return {
          key: i / 2,
          hour: Math.floor(i / 2),
          time:
            String(Math.floor(i / 2)).padStart(2, "0") +
            (i % 2 == 0 ? ":00" : ":30"),
          items: Array.from({ length: 4 }, (_, j) => {
            return {
              time_start:
                String(
                  new Date(this.calculateDayDate(new Date(), j))
                    .toISOString()
                    .slice(0, 10)
                ) +
                "T" +
                String(Math.floor(i / 2)).padStart(2, "0") +
                (i % 2 == 0 ? ":00" : ":30"),
              availability: "",
            };
          }),
        };
      }),
    };
  }

  async fetchToken() {
    try {
      const response = await axios.post(`${TOKEN_URL}`, {
        username: "user1",
        password: "password",
      });
      this.setState({ token: response.data.access });
      return response.data.access;
    } catch (error) {
      console.error("Error fetching token: ", error);
    }
  }

  async setAvailability(email, token) {
    try {
      for (var i = 0; i < this.state.calendarItems[0].items.length; i++) {
        const end_date = new Date(
          this.state.calendarItems[0].items[i].time_start
        );
        end_date.setDate(end_date.getDate() + 1);
        end_date.setUTCHours(0);
        const body = JSON.stringify({
          email: email,
          start_time: this.state.calendarItems[0].items[i].time_start,
          end_time: end_date.toISOString().slice(0, 16),
        });

        const response = await axios.delete(
          `${EVENT_AVAILABILITY_URL(this.props.event_id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            data: body,
          }
        );
        if (response.status >= 300 || response.status < 200) {
          console.error("Error deleting availability");
          console.log(response);
        }
      }

      const body_request = [];
      this.state.calendarItems.forEach((row) => {
        row.items.forEach(async (cell) => {
          if (cell.availability !== "") {
            // add 30 mins
            const end_time = new Date(
              new Date(cell.time_start + "Z").getTime() + 30 * 60000
            )
              .toISOString()
              .slice(0, 16);

            const body = {
              email: email,
              start_time: cell.time_start,
              end_time,
              type: cell.availability,
            };

            body_request.push(body);
          }
        });
      });

      const availability_data = JSON.stringify({
        availabilities: body_request,
      });

      await axios.post(
        `${EVENT_AVAILABILITY_URL(this.props.event_id)}`,
        availability_data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // return response.data.user_id;
    } catch (error) {
      console.error("Error adding availability: ", error);
    }
  }

  updateCalendarItem = (new_date) => {
    return Array.from({ length: 48 }, (_, i) => {
      return {
        key: i / 2,
        hour: Math.floor(i / 2),
        time:
          String(Math.floor(i / 2)).padStart(2, "0") +
          (i % 2 == 0 ? ":00" : ":30"),
        items: Array.from({ length: 4 }, (_, j) => {
          return {
            time_start:
              String(
                new Date(this.calculateDayDate(new_date, j))
                  .toISOString()
                  .slice(0, 10)
              ) +
              "T" +
              String(Math.floor(i / 2)).padStart(2, "0") +
              (i % 2 == 0 ? ":00" : ":30"),
            availability: "",
          };
        }),
      };
    });
  };

  nextWeek = () => {
    const { startDate } = this.state;
    const nextWeekStartDate = new Date(startDate);
    nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 4);
    const newCalendar = this.updateCalendarItem(nextWeekStartDate);
    this.setState({ startDate: nextWeekStartDate, calendarItems: newCalendar });
  };

  prevWeek = () => {
    const { startDate } = this.state;
    const prevWeekStartDate = new Date(startDate);
    prevWeekStartDate.setDate(prevWeekStartDate.getDate() - 4);
    const newCalendar = this.updateCalendarItem(prevWeekStartDate);
    this.setState({ startDate: prevWeekStartDate, calendarItems: newCalendar });
  };

  calculateDayDate = (startDate, dayIndex) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString();
  };

  renderWeekdays = () => {
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const startDayIndex = this.state.startDate.getDay();

    const weekdayElements = Array.from({ length: 4 }, (_, i) => {
      const weekdayIndex = (startDayIndex + i) % 7;
      const day = weekdays[weekdayIndex];

      return (
        <th key={day}>
          <span className="day">{day}</span>
          <span className="date">
            {this.calculateDayDate(this.state.startDate, i)}
          </span>
        </th>
      );
    });

    return <tr className="calendar-header">{weekdayElements}</tr>;
  };

  handleAvailabilityChange = (i, j) => {
    let previous_calendar = this.state.calendarItems;

    const old_avail = previous_calendar[i].items[j].availability;
    if (old_avail === "") {
      previous_calendar[i].items[j].availability = "available";
    } else if (old_avail === "available") {
      previous_calendar[i].items[j].availability = "preferred";
    } else {
      previous_calendar[i].items[j].availability = "";
    }

    this.setState({ calendarItems: previous_calendar });
  };

  updateAvailabilities = (e) => {
    // delete all availabilities for the days
    // add availabilities
    if (this.state.token == "") {
      this.fetchToken().then((token) => {
        this.setAvailability(this.state.logged_in_email, token);
      });
      return;
    }
    this.setAvailability(this.state.logged_in_email, this.state.token);
  };

  render() {
    return (
      <div className="calendar">
        <div className="calendar-header">
          <h2>
            {this.calculateDayDate(this.state.startDate, 0)} -{" "}
            {this.calculateDayDate(this.state.startDate, 3)}
          </h2>
          <div className="calendar-color-index">
            <div className="calendar-index-container">
              <p>Available:</p>
              <div className="calendar-available-box secondary-green-background"></div>
            </div>
            <div className="calendar-index-container">
              <p>Preferred:</p>
              <div className="calendar-preferred-box blue-background"></div>
            </div>
          </div>
        </div>
        <div className="calendar-container">
          <div className="week-buttons">
            <button
              onClick={this.prevWeek}
              className="button-primary prev-week"
            >
              Previous Week
            </button>
            <button
              onClick={this.nextWeek}
              className="button-primary prev-week"
            >
              Next Week
            </button>

            {this.props.editable ? (
              <button
                onClick={this.updateAvailabilities}
                className="button-primary"
              >
                Save Availability
              </button>
            ) : (
              <></>
            )}
          </div>
          <table>
            <thead>{this.renderWeekdays()}</thead>
            <tbody>
              {this.state.calendarItems.map((row, index) => (
                <>
                  <tr key={row.key}>
                    <td className="time">{row.time}</td>
                    <td
                      onClick={() => {
                        this.handleAvailabilityChange(index, 0);
                      }}
                      data-block={row.items[0].time_start}
                      style={
                        row.items[0].availability === "preferred"
                          ? { backgroundColor: "#1400ff" }
                          : row.items[0].availability === "available"
                          ? { backgroundColor: "#03a200" }
                          : { backgroundColor: "transparent" }
                      }
                    ></td>
                    <td
                      onClick={() => {
                        this.handleAvailabilityChange(index, 1);
                      }}
                      data-block={row.items[1].time_start}
                      style={
                        row.items[1].availability === "preferred"
                          ? { backgroundColor: "#1400ff" }
                          : row.items[1].availability === "available"
                          ? { backgroundColor: "#03a200" }
                          : { backgroundColor: "transparent" }
                      }
                    ></td>
                    <td
                      onClick={() => {
                        this.handleAvailabilityChange(index, 2);
                      }}
                      data-block={row.items[2].time_start}
                      style={
                        row.items[2].availability === "preferred"
                          ? { backgroundColor: "#1400ff" }
                          : row.items[2].availability === "available"
                          ? { backgroundColor: "#03a200" }
                          : { backgroundColor: "transparent" }
                      }
                    ></td>
                    <td
                      onClick={() => {
                        this.handleAvailabilityChange(index, 3);
                      }}
                      data-block={row.items[3].time_start}
                      style={
                        row.items[3].availability === "preferred"
                          ? { backgroundColor: "#1400ff" }
                          : row.items[3].availability === "available"
                          ? { backgroundColor: "#03a200" }
                          : { backgroundColor: "transparent" }
                      }
                    ></td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default Calendar;
