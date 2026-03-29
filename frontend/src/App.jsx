import { Routes, Route } from 'react-router-dom';
import Homepage from './modules/home/Homepage.jsx';
import CategoryPage from './modules/category/categoryPage.jsx';
import SearchResultPage from './modules/search/SearchResultPage.jsx';
import AuthPage from './modules/auth/AuthPage.jsx';
import RestaurantPage from './modules/restaurant/RestaurantPage.jsx';
import ClientLayout from './layouts/ClientLayout/ClientLayout.jsx';
import FoodReviewPage from './modules/review/foodreview/FoodReviewPage.jsx';
import RestaurantReviewPage from './modules/review/restaurantreview/RestaurantReviewPage.jsx';
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
          <Route element={<ClientLayout />}>
            <Route path="/category/:categoryName" element={<CategoryPage />} />
            <Route path="/search/:keyword" element={<SearchResultPage />} />
            <Route path="/restaurant/:slugAndId" element={<RestaurantPage />} />
            <Route path="/food/:id" element={<FoodReviewPage />} />
            <Route path="/restaurant/:id/reviews" element={<RestaurantReviewPage />} />
          </Route>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>

      </AddressProvider>
    </AuthProvider>
  );
}

export default App;