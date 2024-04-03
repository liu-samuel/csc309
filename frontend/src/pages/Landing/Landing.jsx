import React from 'react'
import NavBar from '../../components/NavBar/NavBar'
import Footer from '../../components/Footer/Footer'
import './Landing.css'
import { useNavigate } from 'react-router-dom'

const Landing = () => {
    const navigate = useNavigate()
    return (
        <div className='full-page'>
            <NavBar />
            <main className='content'>
                <h1>
                    Make scheduling <span className='green-underline'>fun</span>
                </h1>
                <h2>
                    Simple and intuitive scheduling with the people who matter
                    most to you.
                </h2>
                <div className='buttons'>
                    <a
                        className='primary'
                        href='./register.html'
                        onClick={() => navigate('/register')}
                    >
                        Get Started
                    </a>
                    <a
                        className='secondary'
                        href='./login.html'
                        onClick={() => navigate('/login')}
                    >
                        Log In
                    </a>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default Landing
