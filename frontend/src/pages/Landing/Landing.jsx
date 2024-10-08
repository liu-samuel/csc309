import React from 'react'
import NavBar from '../../components/NavBar/NavBar'
import Footer from '../../components/Footer/Footer'
import './Landing.css'
import { useNavigate } from 'react-router-dom'

const Landing = () => {
    const navigate = useNavigate()
    return (
        <div className='landing-full-page'>
            <NavBar />
            <main className='landing-content'>
                <h1>
                    Make scheduling <span className='green-underline'>fun</span>
                </h1>
                <h2>
                    Simple and intuitive scheduling with the people who matter
                    most to you.
                </h2>
                <div className='buttons'>
                    <button
                        className='primary'
                        onClick={() => navigate('/register')}
                    >
                        Get Started
                    </button>
                    <button
                        className='secondary'
                        onClick={() => navigate('/login')}
                    >
                        Log In
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default Landing
