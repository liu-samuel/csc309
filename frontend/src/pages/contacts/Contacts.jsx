import React, { useState, useEffect } from 'react'
import './contacts.css'
import {
    CONTACT_REQUEST_URL,
    CONTACTS_URL,
    TOKEN_URL,
    USER_URL,
} from '../../constants/index.js'
import axios from 'axios'
import NavBar from '../../components/NavBar/NavBar.jsx'
import Footer from '../../components/Footer/Footer.jsx'
import {useAuth} from '../../contexts/AuthContext.js'

const Contacts = () => {
    const [contacts, setContacts] = useState([])
    const [isPendingPage, setIsPendingPage] = useState(false)
    const [isSearch, setIsSearch] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [requestMessage, setRequestMessage] = useState('')
    const [requestSuccess, setRequestSuccess] = useState(false)
    const {user} = useAuth();

    async function fetchContacts() {
        try {
            if (!user.token) {
                return
            }
            const contactPageURL = isPendingPage
                ? CONTACT_REQUEST_URL
                : CONTACTS_URL
            const response = await axios.get(`${contactPageURL}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            })
            if (!isPendingPage) {
                setContacts(response.data)
            } else {
                let usersData = []
                for (let request of Object.values(response.data)) {
                    const userResponse = await axios.get(
                        `${USER_URL}${request.from_user}/`,
                        {
                            headers: {
                                Authorization: `Bearer ${user.token}`,
                            },
                        }
                    )
                    usersData.push(userResponse.data)
                }
                setContacts(usersData)
            }
        } catch (error) {
            console.error('Error fetching contacts: ', error)
        }
    }

    useEffect(() => {
        fetchContacts()
    }, [isPendingPage])

    const handleUnfriend = async email => {
        try {
            await axios.delete(`${CONTACTS_URL}?email=${email}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            })
            fetchContacts()
        } catch (error) {
            console.error('Error unfriending contact: ', error)
        }
    }

    const handleFriend = async email => {
        try {
            await axios.post(
                `${CONTACTS_URL}`,
                { email: email },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            )
            fetchContacts()
        } catch (error) {
            console.error('Error friending contact: ', error)
        }
    }

    const sendFriendRequest = async () => {
        try {
            const response = await axios.post(
                `${CONTACT_REQUEST_URL}`,
                { email: searchTerm },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            )

            setRequestMessage(response.data.message)
            setRequestSuccess(true)
        } catch (error) {
            console.error('Error sending request: ', error)
            setRequestMessage(error.response.data.error)
            setRequestSuccess(false)
        }
    }

    const deleteRequest = async email => {
        try {
            await axios.delete(`${CONTACT_REQUEST_URL}?email=${email}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            })

            fetchContacts()
        } catch (error) {
            console.error('Error deleting request: ', error)
        }
    }

    const handleKeyDown = event => {
        if (event.key === 'Enter') {
            sendFriendRequest(searchTerm)
        }
    }

    const handleChange = event => {
        setSearchTerm(event.target.value)
    }

    return (
        <div className='contacts-content'>
            <NavBar />
            <div className='contact-navbar'>
                <button
                    className={isPendingPage ? 'friends' : 'active-page friends'}
                    onClick={() => {
                        setIsPendingPage(false)
                        setIsSearch(false)
                    }}
                >
                    Friends
                </button>
                <button
                    className={isPendingPage && !isSearch ? 'active-page pending' : 'pending'}
                    onClick={() => {
                        setIsPendingPage(true)
                        setIsSearch(false)
                    }}
                >
                    Pending
                </button>
                <button
                    onClick={() => {
                        setIsSearch(true)
                        setIsPendingPage(false)
                    }}
                    className={isSearch ? 'active-page add-friend' : 'add-friend'} 
                >
                    Add Friend
                </button>
            </div>
            <hr />
            <div className='contacts'>
                {isSearch ? (
                    <div className='wrapper-div'>
                        <div className='search-title'>
                            Search For a New Contact!
                        </div>
                        <div className='search-container'>
                            <div className='search'>
                                <input
                                    type='text'
                                    placeholder='Enter email...'
                                    value={searchTerm}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            
                        </div>
                        <button className='button-primary request-button' onClick={sendFriendRequest}>
                                Send Request
                        </button>
                        <div
                            className='request-message'
                            style={{ color: requestSuccess ? 'green' : 'red' }}
                        >
                            {requestMessage}
                        </div>
                    </div>
                ) : (
                    contacts.map((item, index) => (
                        <div className='wrapper-div' key={index}>
                            <div className='contact'>
                                <div className='profile'>
                                    <div className='initial-pic'>
                                        {item.name
                                            .split(' ')
                                            .map(word => word[0])
                                            .join('')}
                                    </div>
                                    <div className='name-email'>
                                        <div className='name'>{item.name}</div>
                                        <div className='email'>
                                            {item.email}
                                        </div>
                                    </div>
                                </div>

                                {!isPendingPage ? (
                                    <button
                                        className='unfriend'
                                        onClick={() =>
                                            handleUnfriend(item.email)
                                        }
                                    >
                                        Unfriend
                                    </button>
                                ) : (
                                    <div className='contact-buttons'>
                                        <button
                                            className='add'
                                            onClick={() =>
                                                handleFriend(item.email)
                                            }
                                        >
                                            Add
                                        </button>

                                        <button
                                            className='delete'
                                            onClick={() =>
                                                deleteRequest(item.email)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                            {index !== contacts.length - 1 && <hr />}
                        </div>
                    ))
                )}
            </div>
            <div className='contacts-footer'>
                <Footer/>
            </div>
            
        </div>
    )
}

export default Contacts
