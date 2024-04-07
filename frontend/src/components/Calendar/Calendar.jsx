import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import "./Calendar.css";
import axios from "axios";
import { EVENT_AVAILABILITY_URL, EVENT_URL, TOKEN_URL } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

const Calendar = forwardRef((props, ref) => {
  

  const setAvailability = async (email) => {
    try {
      for (var i = 0; i < calendarItems[0].items.length; i++) {
        const end_date = new Date(calendarItems[0].items[i].time_start);
        end_date.setDate(end_date.getDate() + 1);
        end_date.setUTCHours(0);
        const body = JSON.stringify({
          email: email,
          start_time: calendarItems[0].items[i].time_start,
          end_time: end_date.toISOString().slice(0, 16),
        });

        const response = await axios.delete(
          `${EVENT_AVAILABILITY_URL(props.event_id)}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
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

      await addAvailability(email);

      
      // return response.data.user_id;
    } catch (error) {
      console.error("Error adding availability: ", error);
    }
  };


  
  const addAvailability = async (email, inviteID) => {
    const body_request = [];
      calendarItems.forEach((row) => {
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
      
      const eventID = inviteID ? inviteID : props.event_id;
      if (body_request.length > 0) {
        await axios.post(
          `${EVENT_AVAILABILITY_URL(eventID)}`,
          availability_data,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

  }

  useImperativeHandle(ref, () => ({

    addAvailability: addAvailability

  }));
  


  const resetCalendarItem = (new_date) => {
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
                new Date(calculateDayDate(new_date, j))
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

  const nextWeek = () => {
    const nextWeekStartDate = new Date(startDate);
    nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 4);
    const resetCalendar = resetCalendarItem(nextWeekStartDate);
    setStartDate(nextWeekStartDate);
    if (props.event_id) {
      updateCalendarItems(resetCalendar);
    }
  };

  const prevWeek = () => {
    const prevWeekStartDate = new Date(startDate);
    prevWeekStartDate.setDate(prevWeekStartDate.getDate() - 4);
    const resetCalendar = resetCalendarItem(prevWeekStartDate);
    setStartDate(prevWeekStartDate);
    if (props.event_id) {
      updateCalendarItems(resetCalendar);
    }
  };

  const calculateDayDate = (startDate, dayIndex) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString();
  };

  const renderWeekdays = () => {
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const startDayIndex = startDate.getDay();

    const weekdayElements = Array.from({ length: 4 }, (_, i) => {
      const weekdayIndex = (startDayIndex + i) % 7;
      const day = weekdays[weekdayIndex];

      return (
        <th key={day}>
          <span className="day">{day}</span>
          <span className="date">{calculateDayDate(startDate, i)}</span>
        </th>
      );
    });

    return <tr className="calendar-header">{weekdayElements}</tr>;
  };

  const handleAvailabilityChange = (i, j) => {
    let previous_calendar = [...calendarItems];

    const old_avail = previous_calendar[i].items[j].availability;
    if (old_avail === "") {
      previous_calendar[i].items[j].availability = "available";
    } else if (old_avail === "available") {
      previous_calendar[i].items[j].availability = "preferred";
    } else {
      previous_calendar[i].items[j].availability = "";
    }

    setCalendarItems(previous_calendar);
  };

  const updateAvailabilities = (e) => {
    // delete all availabilities for the days
    // add availabilities
    if (user.token !== "") {
      setAvailability(loggedInEmail);
      return;
    }
    // TODO: handle error with token
  };

  const [startDate, setStartDate] = useState(new Date());
  const [loggedInEmail, setLoggedInEmail] = useState("user1@user1.com");
  const {user} = useAuth();
  const [loggedInUserId, setLoggedInUserId] = useState(1);
  const [calendarItems, setCalendarItems] = useState(
    Array.from({ length: 48 }, (_, i) => {
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
                new Date(calculateDayDate(new Date(), j))
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
    })
  );

  const updateCalendarItems = async (resetCalendar) => {
    if (props.event_id) {
      const response = await axios.get(`${EVENT_URL}${props.event_id}/`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.statusText === "OK") {
        let new_calendar = [...resetCalendar];
        response.data.availabilities.forEach((availability) => {
          if (availability.person == loggedInUserId) {
            resetCalendar.forEach((item, i) => {
              item.items.forEach((piece, j) => {
                if (piece.time_start === availability.start_time.slice(0, 16)) {
                  new_calendar[i].items[j].availability = availability.type;
                }
              });
            });
          }
        });
        setCalendarItems(new_calendar);
      }
    }
  };

  useEffect(() => {
      const getCalendarItems = async () => {
        if (props.event_id) {
      const response = await axios.get(`${EVENT_URL}${props.event_id}/`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.statusText === "OK") {
        let new_calendar = [...calendarItems];
        response.data.availabilities.forEach((availability) => {
          if (availability.person == loggedInUserId) {
            calendarItems.forEach((item, i) => {
              item.items.forEach((piece, j) => {
                if (piece.time_start === availability.start_time.slice(0, 16)) {
                  new_calendar[i].items[j].availability = availability.type;
                }
              });
            });
          }
        });
        setCalendarItems(new_calendar);
      }
    };

    if (user.token !== "") {
      getCalendarItems();
    }
  }
  }, []);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h2>
          {calculateDayDate(startDate, 0)} - {calculateDayDate(startDate, 3)}
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
          <button onClick={prevWeek} className="button-primary prev-week">
            Previous Week
          </button>
          <button onClick={nextWeek} className="button-primary prev-week">
            Next Week
          </button>

          {props.editable ? (
            <button onClick={updateAvailabilities} className="button-primary">
              Save Availability
            </button>
          ) : (
            <></>
          )}
        </div>
        <table>
          <thead>{renderWeekdays()}</thead>
          <tbody>
            {calendarItems.map((row, index) => (
              <>
                <tr key={row.key}>
                  <td className="time">{row.time}</td>
                  <td
                    onClick={() => {
                      handleAvailabilityChange(index, 0);
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
                      handleAvailabilityChange(index, 1);
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
                      handleAvailabilityChange(index, 2);
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
                      handleAvailabilityChange(index, 3);
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
});


export default Calendar;
