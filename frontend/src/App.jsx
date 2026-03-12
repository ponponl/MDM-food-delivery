import Homepage from './modules/home/Homepage.jsx'
import CategorizedPage from './modules/menu/CategorizedPage.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/home" element={<Homepage />}/>
        <Route path="/category/:categoryName" element={<CategorizedPage />}/>
      </Routes>      
    </>
  )
}

export default App
