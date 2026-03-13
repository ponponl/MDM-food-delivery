import Homepage from './modules/home/Homepage.jsx'
import CategorizedPage from './modules/menu/CategorizedPage.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import {AddressProvider} from './components/context/AddressContext.jsx'

function App() {
  return (
    <>
      <AddressProvider>
        <Routes>
          <Route path="/" element={<Homepage />}/>
          <Route path="/category/:categoryName" element={<CategorizedPage />}/>
        </Routes>    
      </AddressProvider>  
    </>
  )
}

export default App
