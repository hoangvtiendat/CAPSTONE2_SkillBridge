import React from 'react';
import { Routes, Route,Link } from 'react-router-dom';
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
import SystemLogs from './pages/SystemLogs/SystemLogs';
import TaxLookup from './pages/company/TaxLookup';
import AdminJobPage from './pages/admin/AdminJobPage';
import AdminJobDetailPage from './pages/admin/AdminJobDetailPage';
import JobDetailPage from './pages/candidate/JobDetailPage';

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
          <Route path="/admin/logs" element={<SystemLogs />} />
          <Route path="/company/TaxLookup" element={<TaxLookup/>} />
          <Route path="/admin/jobs" element={<AdminJobPage />} />
          <Route path="/admin/jobs/:jobId" element={<AdminJobDetailPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          {/* Thêm routes khác ở đây */}

        </Routes>
      </div>
    </>
  );
}

export default App;
