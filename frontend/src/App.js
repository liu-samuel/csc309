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
                <Route path='/' element={<Landing />} />

                <Route
                    path='/home'
                    element={
                        <RequireAuth>
                            <Home />
                        </RequireAuth>
                    }
                />
                <Route
                    path='/contacts'
                    element={
                        <RequireAuth>
                            <Contacts />
                        </RequireAuth>
                    }
                />
                <Route
                    path='/new_meeting'
                    element={
                        <RequireAuth>
                            <NewMeeting />
                        </RequireAuth>
                    }
                />

                <Route path='/register' element={<Register />} />
                <Route path='/login' element={<Login />} />
                <Route
                    path='/meeting_details/:event_id'
                    element={
                        <RequireAuth>
                            <MeetingDetails />
                        </RequireAuth>
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}

export default App
