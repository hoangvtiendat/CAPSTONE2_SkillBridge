import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { Toaster } from 'sonner';

// Admin Components & Pages
import AdminLayout from './components/admin/AdminLayout';
import UserManagementPage from './pages/admin/UserManagementPage';
import CompanyManagementPage from './pages/admin/CompanyManagementPage';
import IndustryManagementPage from './pages/admin/IndustryManagementPage';
import SkillManagementPage from './pages/admin/SkillManagementPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminPath = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        if (!isAdminPath && (location.pathname === '/' || location.pathname === '/login')) {
          navigate('/admin/dashboard', { replace: true });
        }
      } else {
        if (location.pathname === '/login') {
          navigate('/', { replace: true });
        }
      }
    }
  }, [user, isAdminPath, location.pathname, navigate]);

  return (
    <>
      <Toaster position="top-right" richColors visibleToasts={1} expand={false} />
      {!isAdminPath && <Header />}
      <div className={!isAdminPath ? "content-with-header" : ""}> {/* Add padding only for fixed header on non-admin pages */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path='/set-password' element={<SetPass />} />
          <Route path='/auth/complete-profile' element={<UpdateProfileDetail />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="management/users" element={<UserManagementPage />} />
            <Route path="management/companies" element={<CompanyManagementPage />} />
            <Route path="management/industries" element={<IndustryManagementPage />} />
            <Route path="management/skills" element={<SkillManagementPage />} />

            {/* Fallback internal admin routes can be added here */}
            <Route path="*" element={<div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Feature Coming Soon</div>} />
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
