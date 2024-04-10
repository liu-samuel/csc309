import { React, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./MeetingDetails.css";
import axios from "axios";
import NavBar from "../../components/NavBar/NavBar";
import Footer from "../../components/Footer/Footer";
import Calendar from "../../components/Calendar/Calendar";
import { useAuth } from "../../contexts/AuthContext";
import { EVENT_URL, TOKEN_URL, USER_URL, AGNEDA_URL, AGENDA_URL } from "../../constants";

const MeetingDetails = () => {
  const {user} = useAuth();
  const [eventName, setEventName] = useState("");
  const [invitee, setInvitee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [agenda, setAgenda] = useState("");
  const [scheduling, setScehduling] = useState(false);
  const [selected, setSelected] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [eventTime, setEventTime] = useState("");
  const [editing, setEditing] = useState(false);

  const { event_id } = useParams();

  function editAgenda() {
    var container = document.querySelector('.meeting-agenda');
    container.contentEditable = true;
    setEditing(true);
    container.classList.add('editing-mode');
    container.focus();
  }

  async function saveAgenda() {
    setEditing(false);
    
    var container = document.querySelector('.meeting-agenda');
    var editedContent = container.innerText;
    container.contentEditable = false;
    container.classList.remove('editing-mode');
      try {
        const response = await axios.patch(`${AGENDA_URL(event_id)}`, {
          agenda: editedContent 
      }, {
          headers: {
              Authorization: `Bearer ${user.token}`,
          },
      });
    } catch (error) {
      console.error("Error updating agenda");
    }


  }

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
    const month = Number(str.slice(5, 7));
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
        response.data.deadline ? setDeadline(convertStringToDate(response.data.deadline.slice(0, 16))) : console.log("no deadline found");
        setAgenda(response.data.agenda);
        setScheduled(response.data.is_finalized);
        setEventTime(response.data.selected_time);
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
        {(scheduling && !selected) ? (
        <div className="md-notification-wrapper">
          <div className="md-notification">
            <svg className="md-alert" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              {/* <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--> */}
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg>
            <p>Click on a time to schedule a meeting</p>
          </div>
        </div>) : <></>
        }
        <h1 className="md-title">
          Meeting Details: <span className="md-attending-name">{eventName}</span>
        </h1>
        {scheduled ?
        <div className="md-scheduled-meeting"> 
        <h2>You have scheduled this event for:
        </h2><br/>
        <h2 className="md-attending-name">{convertStringToDate(eventTime)}</h2>
         <div className="md-button md-button-primary" onClick={() => {setScheduled(false)}}>Reschedule?</div>
        </div>
        : 
        <><Calendar editable event_id={event_id} scheduling={scheduling} setSelected={setSelected} setScheduled={setScheduled} setEventTime={setEventTime} />

        <div className="md-bottom-wrapper">
          <div className="md-deadline">
            Deadline to schedule:{" "}
            <span className="md-deadline-text">{deadline}</span>
          </div>

          <div className="md-button md-button-primary" onClick={() => {setScehduling(!scheduling)}}>Schedule Meeting</div>
        </div></>}

        <div className="meeting-agenda-container">
          <div className="agenda-title">Agenda</div>
          <hr />  

          <div className="meeting-agenda"> 
            {agenda}
          </div>
          
        </div>
        <div className="agenda-button-container">
          <button className="md-button-primary edit-agenda" onClick={editing ? saveAgenda : editAgenda}>
            {editing ? "Save" : "Edit"}
          </button>
        </div>
        
      </div>

      <Footer />
    </div>
  );
};

export default MeetingDetails;
