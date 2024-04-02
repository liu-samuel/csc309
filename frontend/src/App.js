import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Contacts from './pages/contacts/Contacts';
import NewMeeting from './pages/NewMeeting/NewMeeting';
import Register from './pages/register/Register';
import Login from './pages/login/Login';

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/contacts">
        <Route index element={<Contacts />}/>
      </Route>
      <Route path="/new_meeting">
        <Route index element={<NewMeeting />} />
      </Route>
      <Route path="/register">
        <Route index element={<Register />} />
      </Route>
      <Route path="/login">
        <Route index element={<Login />} />
      </Route>
    </Routes>  
  </BrowserRouter>
}

export default App;
