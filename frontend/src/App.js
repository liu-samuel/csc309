import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Contacts from './pages/contacts/Contacts'
import NewMeeting from './pages/NewMeeting/NewMeeting'
import Register from './pages/register/Register'
import Login from './pages/login/Login'
import MeetingDetails from './pages/MeetingDetails/MeetingDetails'
import Landing from './pages/Landing/Landing'
import RequireAuth from './components/RequireAuth/RequireAuth'
import Home from './pages/Home/Home'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/'>
                    <Route index element={<Landing />} />
                </Route>
                <Route path='/home'>
                    <Route
                        index
                        element={
                            <RequireAuth>
                                <Home />
                            </RequireAuth>
                        }
                    />
                </Route>
                <Route path='/contacts'>
                    <Route
                        index
                        element={
                            <RequireAuth>
                                <Contacts />
                            </RequireAuth>
                        }
                    />
                </Route>
                <Route path='/new_meeting'>
                    <Route
                        index
                        element={
                            <RequireAuth>
                                <NewMeeting />
                            </RequireAuth>
                        }
                    />
                </Route>
                <Route path='/register'>
                    <Route index element={<Register />} />
                </Route>
                <Route path='/login'>
                    <Route index element={<Login />} />
                </Route>
                <Route path='/meeting_details/:event_id'>
                    <Route
                        index
                        element={
                            <RequireAuth>
                                <MeetingDetails />
                            </RequireAuth>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
