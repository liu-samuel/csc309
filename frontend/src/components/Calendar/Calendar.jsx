import React, { useEffect, useState, forwardRef, useImperativeHandle, useLayoutEffect } from "react";
import "./Calendar.css";
import axios from "axios";
import { EVENT_AVAILABILITY_URL, EVENT_URL, TOKEN_URL } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}



const Calendar = forwardRef((props, ref) => {
  const [width, _] = useWindowSize();
  const [calendarColumns, setCalendarColumns] = useState(4);

  useEffect(() => {
    const updateCalendarColumns = () => {
      if (width <= 900) {
        setCalendarColumns(1);
      } else {
        setCalendarColumns(4);
      }
    }

    updateCalendarColumns();
  }, [width]);

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
        items: Array.from({ length: calendarColumns }, (_, j) => {
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
            other_availability: "",
          };
        }),
      };
    });
  };

  const nextWeek = () => {
    const nextWeekStartDate = new Date(startDate);
    nextWeekStartDate.setDate(nextWeekStartDate.getDate() + calendarColumns);
    const resetCalendar = resetCalendarItem(nextWeekStartDate);
    setStartDate(nextWeekStartDate);
    if (props.event_id) {
      updateCalendarItems(resetCalendar);
    }
  };

  const prevWeek = () => {
    const prevWeekStartDate = new Date(startDate);
    prevWeekStartDate.setDate(prevWeekStartDate.getDate() - calendarColumns);
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

    const weekdayElements = Array.from({ length: calendarColumns }, (_, i) => {
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
        items: Array.from({ length: calendarColumns }, (_, j) => {
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
            other_availability: "",
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
          } else {
            resetCalendar.forEach((item, i) => {
              item.items.forEach((piece, j) => {
                if (piece.time_start === availability.start_time.slice(0, 16)) {
                  new_calendar[i].items[j].other_availability = availability.type;
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
              } else {
                calendarItems.forEach((item, i) => {
                  item.items.forEach((piece, j) => {
                    if (piece.time_start === availability.start_time.slice(0, 16)) {
                      new_calendar[i].items[j].other_availability = availability.type;
                    }
                  });
                });
              }
            });
            setCalendarItems(new_calendar);
            console.log(new_calendar);
          }
        };
    }
    if (user.token !== "") {
      getCalendarItems();
    }
  }, [ref]);

  return (
    <>
    <div className="md-calendar-mobile-buttons">
      <button className="md-button-primary md-calendar-button" onClick={prevWeek} >
        Previous Day
      </button>
      <button className="md-button-primary md-calendar-button" onClick={nextWeek}>Next Day</button>
    </div>
    <div className="calendar">
      <div className="calendar-header">
        <h2>
          
          {calendarColumns > 1 ? (calculateDayDate(startDate, 0) + " - " + calculateDayDate(startDate, calendarColumns - 1)) : calculateDayDate(startDate, 0) }
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
          {calendarColumns > 1 ?
          (<><button onClick={prevWeek} className="button-primary prev-week">
            Previous Week
          </button>
          <button onClick={nextWeek} className="button-primary prev-week">
            Next Week
          </button></>)
          : (<></>)}

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
              {/* {console.log(row.items[0])} */}
                <tr key={row.key}>
                  <td className="time">{row.time}</td>
                  {Array.from({length: calendarColumns}, (_, i) => (
                    <td
                      onClick={() => {
                        handleAvailabilityChange(index, i);
                      }}
                      style={
                        row.items[i].other_availability && row.items[i].availability
                          ? { backgroundColor: "#096560" }
                          : row.items[i].availability === "preferred"
                          ? { backgroundColor: "#1400ff" }
                          : row.items[i].availability === "available"
                          ? { backgroundColor: "#03a200" }
                          : row.items[i].other_availability === "preferred"
                          ? { backgroundColor: "#1400ff", opacity: 0.5 }
                          : row.items[i].other_availability === "available"
                          ? { backgroundColor: "#03a200", opacity: 0.5 }
                          : { backgroundColor: "transparent" }
                      }
                    ></td>
                  ))}
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
});


export default Calendar;
