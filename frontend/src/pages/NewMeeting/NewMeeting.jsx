import { React, useState, useEffect } from 'react'
import './NewMeeting.css'
import axios from 'axios';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import { EVENT_URL, TOKEN_URL, USER_URL } from '../../constants';

const NewMeeting = () => {

  const [token, setToken] = useState("");
  const [eventName, setEventName] = useState('');
  const [invitee, setInvitee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);


  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await axios.post(`${TOKEN_URL}`, {
          username: 'stlaz123',
          password: 'Password12345',
        });
        setToken(response.data.access);
      } catch (error) {
        console.error("Error fetching token: ", error);
      } 
    }

    fetchToken();
  }, []);

  async function sendMeetingInvite () {
    try {
      let inviteeID = await getIDFromEmail(invitee);
      const postData = {
        invitee: String(inviteeID),
        deadline: deadline,
        name: eventName,
      }
      const response = await axios.post(`${EVENT_URL}`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      setInviteMessage(response.data.message);
      setInviteSuccess(true);        
    } catch (error) {
      console.error("Error creating new event: ", error)
      setInviteMessage(error.response.data.error);
      setInviteSuccess(false);
    }
  }

  async function getIDFromEmail(email) {
    try {
      const response = await axios.get(`${USER_URL}?email=${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      return response.data.user_id;
    } catch (error) {
      console.error("Error creating new event: ", error)
    }
  }
  

  return (
    <div className='full-page'>
      <NavBar />
      <div className="content">
        <h1 className="title">
            New Meeting With <span className="attending-name">Ron</span>
        </h1>
        <div className="calendar">
                  <div className="calendar-header">
            <h2>Jan 1-4</h2>
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
            <table>
              <thead>
                <tr className="header">
                  <th>
                    <span className="day">Tuesday</span
                    ><span className="date">Jan 1</span>
                  </th>
                  <th>
                    <span className="day">Wednesday</span
                    ><span className="date">Jan 2</span>
                  </th>
                  <th>
                    <span className="day">Thursday</span
                    ><span className="date">Jan 3</span>
                  </th>
                  <th>
                    <span className="day">Friday</span
                    ><span className="date">Jan 4</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="time">00:00</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">01:00</td>
                  <td>
                    
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">02:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">03:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">04:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">05:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">06:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">07:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">08:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">09:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">10:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">11:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">12:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">13:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">14:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">15:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">16:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">17:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">18:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">19:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">20:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">21:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">22:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="time">23:00</td>

                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="calendar-mobile-buttons">
            <button className="button-primary calendar-button">
              Previous Day
            </button>
            <button className="button-primary calendar-button">
              Next Day
            </button>
          </div>
        </div>
            <div className="event-name">
              <div className='form-label'>
                Event Name
              </div>
              <input 
                type="text" 
                placeholder="Event Name" 
                value={eventName} 
                onChange={(e) => setEventName(e.target.value)} 
              /> 
          </div>
            <div className="search-bar">
            <div className='form-label'>
                Invite Others
              </div>
              <input 
                type="text" 
                placeholder="Invite Others" 
                value={invitee} 
                onChange={(e) => setInvitee(e.target.value)} 
              /> 
            </div>
            <div className="deadline">
            <div className='form-label'>
                Deadline To Respond
              </div>
              <input 
                type="text" 
                placeholder="YYYY-MM-DD" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)} 
              /> 
            </div>
            <div className="submit-button">
                <button className="button-primary" onClick={sendMeetingInvite}>Send Invite</button>
            </div>
            <div className='invite-message'>
              <div style={{ color: inviteSuccess ? 'green' : 'red' }}>
              {inviteMessage}
                
              </div>
            </div>
            

			
			
		</div>
        <Footer />
    </div>
    
  )
}


export default NewMeeting