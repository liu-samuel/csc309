import { React, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./MeetingDetails.css";
import axios from "axios";
import NavBar from "../../components/NavBar/NavBar";
import Footer from "../../components/Footer/Footer";
import Calendar from "../../components/Calendar/Calendar";
import { useAuth } from "../../contexts/AuthContext";
import { EVENT_URL, TOKEN_URL, USER_URL } from "../../constants";

const MeetingDetails = () => {
  const {user, logout} = useAuth();
  const [eventName, setEventName] = useState("");
  const [invitee, setInvitee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [agenda, setAgenda] = useState("");

  const { event_id } = useParams();

  function convertStringToDate(str) {
    const map = [
      "",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const year = str.slice(0, 4);
    const month = str.slice(5, 7);
    const day = str.slice(8, 10);
    const hour = str.slice(11, 13);
    const minute = str.slice(14, 16);

    return `${map[month]} ${day}, ${year}, ${hour}:${minute}`;
  }

  useEffect(() => {
    async function updateEventDetails() {
      try {
        const response = await axios.get(`${EVENT_URL}${event_id}/`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        setEventName(response.data.name);
        setDeadline(convertStringToDate(response.data.deadline.slice(0, 16)));
        setAgenda(response.data.agenda);
        console.log(response);
      } catch (error) {
        console.error("Error getting event details", error);
      }
    }

    updateEventDetails();
  }, []);

  async function getIDFromEmail(email) {
    try {
      const response = await axios.get(`${USER_URL}?email=${email}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return response.data.user_id;
    } catch (error) {
      console.error("Error creating new event: ", error);
    }
  }

  return (
    <div className="md-full-page">
      <NavBar />
      <div className="md-meeting-details-content">
        <h1 className="md-title">
          Meeting Details: <span className="md-attending-name">{eventName}</span>
        </h1>
        <Calendar editable event_id={event_id} />
        <div className="md-calendar-mobile-buttons">
          <button className="md-button-primary md-calendar-button">
            Previous Day
          </button>
          <button className="md-button-primary md-calendar-button">Next Day</button>
        </div>

        <div className="md-bottom-wrapper">
          <div className="md-deadline">
            Deadline to schedule:{" "}
            <span className="md-deadline-text">{deadline}</span>
          </div>

          <div className="md-button md-button-primary">Schedule Meeting</div>
        </div>

        <div className="meeting-agenda-container">
          <div className="agenda-title">Agenda</div>
          <hr />  

          <div className="meeting-agenda"> 
            {agenda}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MeetingDetails;
