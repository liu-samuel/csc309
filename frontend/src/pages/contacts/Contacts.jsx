import React, { useState, useEffect } from 'react';
import './contacts.css';
import { CONTACT_REQUEST_URL, CONTACTS_URL, TOKEN_URL, USER_URL } from '../../constants/index.js';
import axios from 'axios';
import NavBar from '../../components/NavBar/NavBar.jsx';
import Footer from '../../components/Footer/Footer.jsx';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingPage, setIsPendingPage] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

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
      } finally {
        setIsLoading(false);
      }
    }

    fetchToken();
  }, []);

  async function fetchContacts() {
    try {
      if (!token) {
        return;
      } 
      const contactPageURL = isPendingPage ? CONTACT_REQUEST_URL : CONTACTS_URL;
      const response = await axios.get(`${contactPageURL}`, {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      });
      if (!isPendingPage) {
        setContacts(response.data);
      } else {
        let usersData = [];
        for (let user of Object.values(response.data)) {
          const userResponse = await axios.get(`${USER_URL}${user.from_user}/`, {
            headers: {
              Authorization: `Bearer ${token}` 
            }
          });
          usersData.push(userResponse.data);
        }
        setContacts(usersData);

      }
    } catch (error) {
      console.error("Error fetching contacts: ", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchContacts();
  }, [token, isPendingPage]);

  const handleUnfriend = async (email) => {
    try {
      await axios.delete(`${CONTACTS_URL}?email=${email}`, {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      });
      fetchContacts();
    } catch (error) {
      console.error("Error unfriending contact: ", error);
    }
  }

  const handleFriend = async (email) => {
    try {
      await axios.post(`${CONTACTS_URL}`, 
        { email: email },
        {
          headers: {
            Authorization: `Bearer ${token}` 
          }, 
        }
      );
      fetchContacts();
    } catch (error) {
      console.error("Error friending contact: ", error);
    }
  }

  const sendFriendRequest = async () => {
    try {
      const response = await axios.post(`${CONTACT_REQUEST_URL}`,
        { email: searchTerm },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setRequestMessage(response.data.message);
      setRequestSuccess(true);
    } catch (error) {
      console.error("Error sending request: ", error);
      setRequestMessage(error.response.data.error);
      setRequestSuccess(false);
    }
  }

  const deleteRequest = async (email) => {
    try {
      await axios.delete(`${CONTACT_REQUEST_URL}?email=${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      fetchContacts()
    } catch (error) {
      console.error("Error deleting request: ", error);
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendFriendRequest(searchTerm);
    }
  };

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  if (isLoading) {
    return <div>Loading...</div>; 
  }


  return (
    <div>
      <NavBar />
      <div className="contact-navbar">
          <button className="active-page friends" onClick={() => {setIsPendingPage(false); setIsSearch(false);}}>Friends</button>
          <button className="pending" onClick={() => {setIsPendingPage(true); setIsSearch(false)}}>Pending</button>
          <button className="add-friend" onClick={() => setIsSearch(true)}>Add Friend</button>
      </div>
      <hr />
      <div className="contacts">
        {isSearch ? (
          <div className='wrapper-div'>
            <div className="search-title">
              Search For a New Contact!
            </div>
            <div className="search-container">
              <div className="search">
              <input
                type="text"
                placeholder="Enter email..."
                value={searchTerm}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
              </div> 
            </div>
            <div className='request-message' style={{ color: requestSuccess ? 'green' : 'red' }}>
              {requestMessage}
            </div>
          </div>
        ) : (
            contacts.map((item, index) => (
              <div className="wrapper-div" key={index}>
                <div className="contact">
                    <div className="profile">
                      <div className="initial-pic">
                        {item.name.split(' ').map(word => word[0]).join('')}
                      </div>
                      <div className="name-email">
                          <div className="name">
                              {item.name}
                          </div>
                          <div className="email">
                              {item.email}
                          </div>
                      </div>
                    </div>
                    
                    
                    {!isPendingPage ? (
                      <button className="unfriend" onClick={() => handleUnfriend(item.email)}>
                        Unfriend
                      </button>
                      ) : (
                        <div className='buttons'>
                          <button className="add" onClick={() => handleFriend(item.email)}>
                            Add
                          </button>

                          <button className="delete" onClick={() => deleteRequest(item.email)}>
                            Delete
                          </button>
                        </div>
                      )
                    }
                    
                </div>
                {index !== contacts.length - 1 && <hr />}
              </div>
            ))
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Contacts