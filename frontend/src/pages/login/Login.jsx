import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Login.css';
import NavBar from '../../components/NavBar/NavBar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { TOKEN_URL } from '../../constants/index.js';

export default function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function submit() {
        if (username && password) {
            setError("");
            // console.log("submit");
            await login();
        }
    }

    async function login() {
        try {
            const response = await axios.post(`${TOKEN_URL}`, {
                username: username,
                password: password
            });
            // console.log(response.data);
            if (response.data.access) {
                // TODO: when context finished, set user context
                navigate("/home");
            }
        } catch (error) {
            setError("Username and/or password is incorrect");
            console.error("Error logging in: ", error);
        } 
    }

    return (
        <div className='login-fullpage'>
            <NavBar />
            <div className="login-main">
                <h1 className='login-heading'>Login</h1>
                <h2 className='login-subheading'>Schedule your meetings</h2>
                <div className='login-form'>
                    <form onSubmit={e => e.preventDefault()}>
                        <div>
                            <label className='login-field-label' for="username">Username</label>
                            <input 
                                className='login-field-input' 
                                type="text" 
                                name="username" 
                                value={username} 
                                onChange={(event) => {
                                    setUsername(event.currentTarget.value);
                                }} 
                            />
                        </div>
                        
                        <div>
                            <label className='login-field-label' for="password">Password</label>
                            <input 
                                className='login-field-input' 
                                type="password" 
                                name="password" 
                                value={password} 
                                onChange={(event) => {
                                    setPassword(event.currentTarget.value);
                                }} 
                            />
                        </div>

                        <div><button className="login-submit" onClick={submit} disabled={!username || !password}>Submit</button></div>
                        {error ? <p className='login-form-error'>{error}</p> : null}

                        <div class="text-and-link">Don't have an account? <a href="./register">Register.</a></div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    )
}