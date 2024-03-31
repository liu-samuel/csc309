import React from 'react'
import './NavBar.css'
import { useAuth } from '../../contexts/AuthContext'

const NavBar = () => {
    const { user, login, logout } = useAuth()
    return user ? (
        <nav id='nav'>
            <div id='nav-logo'>Meetings-R-Us</div>
            <ul id='nav-links'>
                <li className='nav-link'>
                    <a href='./home.html'>Home</a>
                </li>
                <li className='nav-link'>
                    <a href='./new_meeting.html'>New Meeting</a>
                </li>
                <li className='nav-link'>
                    <a href='./contacts.html'>Friends</a>
                </li>
                <button onClick={logout} className='nav-link'>
                    Log out
                </button>
            </ul>
        </nav>
    ) : (
        <nav id='nav'>
            <div id='nav-logo'>Meetings-R-Us</div>
            <ul id='nav-links'>
                <li className='nav-link'>
                    <a href='./home.html'>Sign Up</a>
                </li>
                <li className='nav-link'>
                    <button onClick={logout} className='nav-link'>
                        Log In
                    </button>
                </li>
            </ul>
        </nav>
    )
}

export default NavBar
