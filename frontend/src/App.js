import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Contacts from './pages/contacts/Contacts'
import NewMeeting from './pages/NewMeeting/NewMeeting'
import Landing from './pages/Landing/Landing'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/contacts'>
                    <Route index element={<Contacts />} />
                </Route>
                <Route path='/new_meeting'>
                    <Route index element={<NewMeeting />} />
                </Route>
                <Route path='/'>
                    <Route index element={<Landing />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
