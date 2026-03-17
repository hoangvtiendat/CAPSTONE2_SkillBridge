import React from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
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
import CompanyDetailPage from './pages/candidate/CompanyDetailPage';
import SubscriptionOfCompanyPage from './pages/subscription/SubscriftionOfCompany';
import { Toaster } from 'sonner';
import BusinessIdentity from './pages/recruiter/BusinessIdentity'
// Admin Components & Pages
import AdminLayout from './components/admin/AdminLayout';
import UserManagementPage from './pages/admin/UserManagementPage';
import CompanyManagementPage from './pages/admin/CompanyManagementPage';
import IndustryManagementPage from './pages/admin/IndustryManagementPage';
import SkillManagementPage from './pages/admin/SkillManagementPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import SkillPageContainer from './pages/Skill/SkillPage';
import ListJdOfCompany from './pages/JD/list_jd_of_company';
import CreateJd from './pages/JD/PostJDPage';
import DetailJD_Page from './pages/JD/detailJD';
import SubscriptionManagerPage from './pages/subscription/SubscriptionManager';

import AdminRoute from './components/admin/AdminRoute';
import RecruiterLayout from './components/recruiter/RecruiterLayout';
import RecruiterRoute from './components/recruiter/RecruiterRoute';
import RecruiterDashboardPage from './pages/recruiter/RecruiterDashboardPage';
import CompanySettings from './pages/recruiter/CompanySettings';

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdminPath = location.pathname.startsWith('/admin');
    const isRecruiterPath = location.pathname.startsWith('/recruiter') ||
        location.pathname === '/create-jd' ||
        location.pathname.startsWith('/detail-jd') ||
        location.pathname.startsWith('/company/jd-list') ||
        location.pathname.startsWith('/company/subscriptions');

    const isDashboardLayout = isAdminPath || isRecruiterPath;

    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') {
                if (!isAdminPath && (location.pathname === '/' || location.pathname === '/login')) {
                    navigate('/admin/dashboard', { replace: true });
                }
            } else if (user.role === 'RECRUITER') {
                if (!location.pathname.startsWith('/recruiter') && (location.pathname === '/' || location.pathname === '/login')) {
                    navigate('/recruiter/dashboard', { replace: true });
                }
            } else {
                if (location.pathname === '/login') {
                    navigate('/', { replace: true });
                }
            }
        }
    }, [user, isAdminPath, location.pathname, navigate]);

    return (<>
        <Toaster position="top-right" richColors visibleToasts={1} expand={false} />
        {!isDashboardLayout && <Header />}
        <div
            className={!isDashboardLayout ? "content-with-header" : ""}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path='/forgot-password' element={<ForgotPasswordPage />} />
                <Route path="/otp-verification" element={<OTPVerification />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/oauth-success" element={<OAuthSuccess />} />
                <Route path='/set-password' element={<SetPass />} />
                <Route path='/auth/complete-profile' element={<UpdateProfileDetail />} />
                <Route path="recruiter/identity" element={<BusinessIdentity />} />
                <Route path="/jobs/:jobId" element={<JobDetailPage />} />
                <Route path="/companies/:id" element={<CompanyDetailPage />} />

                <Route element={<RecruiterRoute><RecruiterLayout /></RecruiterRoute>}>
                    <Route path='/create-jd' element={<CreateJd />} />
                    <Route path='/detail-jd/:id' element={<DetailJD_Page />} />
                    <Route path='/company/jd-list' element={<ListJdOfCompany />} />
                    <Route path='/company/subscriptions' element={<SubscriptionOfCompanyPage />} />

                    <Route path="/recruiter" >
                        <Route index element={<RecruiterDashboardPage />} />
                        <Route path="dashboard" element={<RecruiterDashboardPage />} />
                        <Route path="settings" element={<CompanySettings />} />
                        <Route path="candidates" element={<div className="p-8 text-center text-slate-500">Quản lý ứng viên - Tính năng đang phát triển</div>} />
                        <Route path="analytics" element={<div className="p-8 text-center text-slate-500">Bảng phân tích - Tính năng đang phát triển</div>} />
                        <Route path="*" element={<div className="p-8 text-center text-slate-500">Tính năng đang phát triển</div>} />
                    </Route>
                </Route>

                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="logs" element={<SystemLogs />} />
                    <Route path="jobs" element={<AdminJobPage />} />
                    <Route path="jobs/:jobId" element={<AdminJobDetailPage />} />
                    <Route path="tax-lookup" element={<TaxLookup />} />
                    <Route path="management/users" element={<UserManagementPage />} />
                    <Route path="management/companies" element={<CompanyManagementPage />} />
                    <Route path="management/industries" element={<IndustryManagementPage />} />


                    <Route path="category/:categoryId/skills" element={<AdminRoute><SkillPageContainer /></AdminRoute>} />
                    <Route path="management/subscriptions" element={<AdminRoute><SubscriptionManagerPage /></AdminRoute>} />

                    <Route path="*" element={<div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Feature Coming Soon</div>} />
                </Route>
            </Routes>
        </div>
    </>);
}

export default App;
