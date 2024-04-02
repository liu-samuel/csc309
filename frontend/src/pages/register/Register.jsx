import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Register.css';
import NavBar from '../../components/NavBar/NavBar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { REGISTER_URL } from '../../constants/index.js';

const emailRegex = /^[a-zA-Z][a-zA-Z0-9.!#$%\^&\*\+]*@[a-zA-Z][a-zA-Z0-9.!#$%\^&\*]*\.[a-zA-Z][a-zA-Z0-9]*$/;

export default function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password1Error, setPassword1Error] = useState('');
    const [password2Error, setPassword2Error] = useState('');

    const [registerError, setRegisterError] = useState("");

    useEffect(() => {
        validateEmail();
    }, [email]);

    useEffect(() => {
        validatePassword2();
    }, [password2]);

    function validateEmail() {
        if (email && !emailRegex.test(email)) {
            setEmailError("Email is invalid");
            return false;
        } else {
            setEmailError("");
            return true;
        }
    }

    function validatePassword2() {
        if (password2 !== password1) {
            setPassword2Error("Passwords do not match");
            return false;
        } else {
            setPassword2Error("");
            return true;
        }
    }

    async function submit() {
        let numErrors = 0;
        
        if (!username) {
            setUsernameError("This is a required field");
            numErrors++;
        }
        if (!firstName) {
            setFirstNameError("This is a required field");
            numErrors++;
        }

        if (!lastName) {
            setLastNameError("This is a required field");
            numErrors++;
        }

        if (!email) {
            setEmailError("This is a required field");
            numErrors++;
        } else {
            if (!validateEmail()) {
                numErrors++;
            }
        }

        if (!password1) {
            setPassword1Error("This is a required field");
            numErrors++;
        }

        if (!password2) {
            setPassword2Error("This is a required field");
            numErrors++;
        } else {
            if (!validatePassword2()) {
                numErrors++;
            }
        }

        if (numErrors === 0) {
            await register();
        }
    }

    async function register() {
        try {
            const response = await axios.post(`${REGISTER_URL}`, {
                username: username,
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password1
            });

            if (response.data.message === 'User created successfully') {
                // TODO: when context finished, set user context
                navigate("/home");
            }
        } catch (error) {
            if (error.response.data.error === "A user with that username already exists.") {
                setUsernameError("This username is already taken");
            } else if (error.response.data.error === "A user with that email already exists.") {
                setEmailError("This email is already taken");
            }
        } 
    }

    return (
    <div className='register-fullpage'>
      <NavBar />
      <div className="register-main">
        <h1 className='register-heading'>Sign Up</h1>
        <h2 className='register-subheading'>It's free and only takes a minute</h2>
        <div className='register-form'>
            <form onSubmit={e => e.preventDefault()}>
                <div>
                    <label className='register-field-label' for="username">Username *</label>
                    <input 
                        className='register-field-input' 
                        type="text" 
                        name="username" 
                        value={username} 
                        onChange={(event) => {
                            setUsername(event.currentTarget.value);
                            setUsernameError("");
                        }} 
                    />
                    {usernameError ? FormFieldErrorMessage(usernameError) : null}
                </div>

                <div>
                    <label className='register-field-label' for="firstName">First Name *</label>
                    <input 
                        className='register-field-input' 
                        type="text" 
                        name="firstName" 
                        value={firstName} 
                        onChange={(event) => {
                            setFirstName(event.currentTarget.value);
                            setFirstNameError("");
                        }} 
                    />
                    {firstNameError ? FormFieldErrorMessage(firstNameError) : null}
                </div>

                <div>
                    <label className='register-field-label' for="lastName">Last Name *</label>
                    <input 
                        className='register-field-input' 
                        type="text" 
                        name="lastName" 
                        value={lastName} 
                        onChange={(event) => {
                            setLastName(event.currentTarget.value);
                            setLastNameError("");
                        }} 
                    />
                    {lastNameError ? FormFieldErrorMessage(lastNameError) : null}
                </div>

                <div>
                    <label className='register-field-label' for="email">Email *</label>
                    <input 
                        className='register-field-input' 
                        type="email" 
                        name="email" 
                        value={email} 
                        onChange={(event) => {
                            setEmail(event.currentTarget.value)
                            validateEmail();
                        }} 
                    />
                    {emailError ? FormFieldErrorMessage(emailError) : null}
                </div>
                
                <div>
                    <label className='register-field-label' for="password">Password *</label>
                    <input 
                        className='register-field-input' 
                        type="password" 
                        name="password" 
                        value={password1} 
                        onChange={(event) => {
                            setPassword1(event.currentTarget.value);
                            setPassword1Error("");
                        }} 
                    />
                    {password1Error ? FormFieldErrorMessage(password1Error) : null}
                </div>
                
                <div>
                    <label className='register-field-label' for="confirmPassword">Confirm Password *</label>
                    <input 
                        className='register-field-input' 
                        type="password" 
                        name="confirmPassword" 
                        value={password2} 
                        onChange={(event) => {
                            setPassword2(event.currentTarget.value)
                            validatePassword2();
                        }} 
                    />
                    {password2Error ? FormFieldErrorMessage(password2Error) : null}
                </div>

                <div><button className="register-submit" onClick={submit}>Submit</button></div>
            </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function FormFieldErrorMessage(message) {
    return (
        <p className='register-form-error'>{message}</p>
    );
}