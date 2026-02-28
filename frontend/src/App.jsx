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
import SkillPageContainer from './pages/Skill/SkillPage';
import ListJdOfCompany from './pages/JD/list_jd_of_company';
import CreateJd from './pages/JD/PostJDPage';
import DetailJD_Page from './pages/JD/detailJD';
import SubscriptionManagerPage from './pages/Subscription.jsx/SubscriptionManager';
import { Toaster } from 'sonner';

import AdminRoute from './components/admin/AdminRoute';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Header />
      <div className="pt-[72px]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path='/set-password' element={<SetPass />} />
          <Route path='/auth/complete-profile' element={<UpdateProfileDetail />} />
          <Route path='/create-jd' element={<CreateJd />} />
          <Route path='/detail-jd/:id' element={<DetailJD_Page />} />
          <Route path='/company/jd-list' element={<ListJdOfCompany />} />
          <Route 
            path="/category/:categoryId/skills" 
            element={
              <AdminRoute>
                <SkillPageContainer />
              </AdminRoute>
            } 
          />  
          <Route 
            path='/subscriptions' 
            element={
              <AdminRoute>
                <SubscriptionManagerPage />
              </AdminRoute>
            } 
          />
        </Routes>
      </div>
    </>
  );
}

export default App;