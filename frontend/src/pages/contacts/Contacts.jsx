import React, { useState, useEffect } from 'react';
import './contacts.css';
import { CONTACT_REQUEST_URL, CONTACTS_URL, TOKEN_URL } from '../../constants/index.js';
import axios from 'axios';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [token, setToken] = useState("");
  async function getToken() {
    try {
      const response = await axios.post(`${TOKEN_URL}`, {
        username: 'user1',
        password: 'password',
      })
      setToken(response.data.access);
    } catch (error) {
      console.error("Error fetching contacts: ", error);
    }
  }

  async function fetchContacts() {
    try {
      await getToken();
      const response = await axios.get(`${CONTACTS_URL}`, {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      });
      
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts: ", error);
    }
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div>
      <div className="contact-navbar">
          <a href="./contacts.html" className="active-page friends">Friends - 2</a>
          <a href="./pending.html" className="pending">Pending - 2</a>
          <a href="./add_friend.html" className="add-friend">Add Friend</a>
      </div>
      <hr />
      <div className="contacts">
        {contacts.map((item, index) => (
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
                
                
                <button className="unfriend">
                    Unfriend
                </button>
            </div>
            {index !== contacts.length - 1 && <hr />}
          </div>
        ))}
        
      </div>
    </div>
  )
}

export default Contacts