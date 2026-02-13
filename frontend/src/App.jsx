import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/home/Header';

// Pages
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ProfilePage from './pages/profile/ProfilePage';
import { OTPVerification } from './components/auth/OTPVerification';
import { SetPass } from './components/auth/SetPass';
import UpdateProfileDetail from './pages/auth/Update_profile_of_register';
import OAuthSuccess from './pages/auth/OAuthSuccess';
function App() {
  return (
    <>
      <Header />
      <div className="pt-[72px]"> {/* Add padding for fixed header */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path='/set-password' element={<SetPass />} />
          <Route path='/auth/complete-profile' element={<UpdateProfileDetail />} />

          {/* Thêm routes khác ở đây */}
        </Routes>
      </div>
    </>
  );
}

export default App;
