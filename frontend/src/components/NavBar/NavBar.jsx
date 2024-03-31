import React from 'react'
import './NavBar.css'

const NavBar = (authenticated = true) => {
  let navLinks = [
    <li className="nav-link"><a href="./register">Get Started</a></li>, 
    <li className="nav-link"><a href="./login">Log In</a></li>
  ];
  
  if (authenticated) {
    navLinks = [
      <li className="nav-link"><a href="./home">Home</a></li>,
      <li className="nav-link"><a href="./new_meeting">New Meeting</a></li>,
      <li className="nav-link"><a href="./contacts">Friends</a></li>,
      <button className="nav-link"><a href="./login">Log out</a></button>
    ];
  }

  return (
      <nav id="nav">
          <div id="nav-logo">Meetings-R-Us</div>
          <ul id="nav-links">
              {navLinks}
          </ul>
      </nav>
  );
}

export default NavBar

