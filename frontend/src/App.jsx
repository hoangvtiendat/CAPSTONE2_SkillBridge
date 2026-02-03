import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ProfilePage from './pages/candidate/ProfilePage';
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/candidate/profile' element={<ProfilePage />} />
      {/* Thêm routes khác ở đây */}
    </Routes>
  );
}

export default App;
