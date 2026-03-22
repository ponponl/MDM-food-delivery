import { Routes, Route } from 'react-router-dom';
import Homepage from './modules/home/Homepage.jsx';
import CategorizedPage from './modules/menu/CategorizedPage.jsx';
import AuthPage from './modules/auth/AuthPage.jsx';
import RestaurantPage from './modules/restaurant/RestaurantPage.jsx';
import { AddressProvider } from './context/AddressContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AddressProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/category/:categoryName" element={<CategorizedPage />} />
          <Route path="/restaurant/:id" element={<RestaurantPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>

      </AddressProvider>
    </AuthProvider>
  );
}

export default App;