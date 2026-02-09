import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import JD_of_companyPage from './pages/company/JD_of_campany';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/jobs/:id' element={<JD_of_companyPage />} />
      <Route path='/reset-password' element={<ResetPasswordPage />} />
    </Routes>
  );
}

export default App;
