import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Contacts from './pages/contacts/Contacts';

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/contacts">
        <Route index element={<Contacts />}/>
      </Route>
    </Routes>  
  </BrowserRouter>
}

export default App;
