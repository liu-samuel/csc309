import React from 'react'
import './NavBar.css'

const NavBar = () => {
  return (
    <nav id="nav">
        <div id="nav-logo">Meetings-R-Us</div>
        <ul id="nav-links">
            <li className="nav-link"><a href="./home.html">Home</a></li>
            <li className="nav-link"><a href="./new_meeting.html">New Meeting</a></li>
            <li className="nav-link"><a href="./contacts.html">Friends</a></li>
            <button className="nav-link"><a href="./login.html">Log out</a></button>
        </ul>
    </nav>
  )
}

export default NavBar

