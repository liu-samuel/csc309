import React from 'react'
import './NavBar.css'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const NavBar = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    let navLinks = [
        <li className='nav-link'>
            <span onClick={() => navigate('/register')}>Get Started</span>
        </li>,
        <li className='nav-link'>
            <span onClick={() => navigate('/login')}>Log In</span>
        </li>,
    ]

    if (user) {
        navLinks = [
            <li className='nav-link'>
                <span onClick={() => navigate('/home')}>Home</span>
            </li>,
            <li className='nav-link'>
                <span onClick={() => navigate('/new_meeting')}>
                    New Meeting
                </span>
            </li>,
            <li className='nav-link'>
                <span onClick={() => navigate('/contacts')}>Contacts</span>
            </li>,
            <button className='nav-link'>
                <span
                    onClick={() => {
                        logout()
                        navigate('/login')
                    }}
                >
                    Log out
                </span>
            </button>,
        ]
    }

    return (
        <nav id='nav'>
            <div id='nav-logo'>Meetings-R-Us</div>
            <ul id='nav-links'>{navLinks}</ul>
        </nav>
    )
}

export default NavBar
