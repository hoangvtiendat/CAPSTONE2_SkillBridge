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

function App() {
  return (
    <>
      <Header />
      <nav className="fixed top-[72px] left-0 right-0 bg-gray-800 text-white p-2 z-50 flex gap-4 text-sm">
          <Link title="Về trang chủ" to="/" className="hover:text-blue-400">Home</Link>
          <Link title="Xem hệ thống log" to="/admin/logs" className="hover:text-blue-400">System Logs</Link>
        </nav>
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
          {/* Thêm routes khác ở đây */}
        </Routes>
      </div>
    </>
  );
}

export default App;
