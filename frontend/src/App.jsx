import React from 'react';
import {Routes, Route, useNavigate, useLocation, Link} from 'react-router-dom';
import './App.css';
import Header from './components/home/Header';

// Pages
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ProfilePage from './pages/profile/ProfilePage';
import {OTPVerification} from './components/auth/OTPVerification';
import {SetPass} from './components/auth/SetPass';
import UpdateProfileDetail from './pages/auth/Update_profile_of_register';
import OAuthSuccess from './pages/auth/OAuthSuccess';
import SystemLogs from './pages/SystemLogs/SystemLogs';
import TaxLookup from './pages/company/TaxLookup';
import AdminJobPage from './pages/admin/AdminJobPage';
import AdminJobDetailPage from './pages/admin/AdminJobDetailPage';
import JobDetailPage from './pages/candidate/JobDetailPage';
import SubscriptionOfCompanyPage from './pages/Subscription.jsx/SubscriftionOfCompany';
import RegisterSubscriptionPage from './pages/Subscription.jsx/RegisterSubscriptionPage'
import {Toaster} from 'sonner';
import BusinessIdentity from './pages/recruiter/BusinessIdentity'
// Admin Components & Pages
import AdminLayout from './components/admin/AdminLayout';
import UserManagementPage from './pages/admin/UserManagementPage';
import CompanyManagementPage from './pages/admin/CompanyManagementPage';
import IndustryManagementPage from './pages/admin/IndustryManagementPage';
import SkillManagementPage from './pages/admin/SkillManagementPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

import {useAuth} from './context/AuthContext';
import {useEffect} from 'react';
import SkillPageContainer from './pages/Skill/SkillPage';
import ListJdOfCompany from './pages/JD/list_jd_of_company';
import CreateJd from './pages/JD/PostJDPage';
import DetailJD_Page from './pages/JD/detailJD';
import SubscriptionManagerPage from './pages/Subscription.jsx/SubscriptionManager';

import AdminRoute from './components/admin/AdminRoute';

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const {user} = useAuth();
    const isAdminPath = location.pathname.startsWith('/admin');

    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') {
                if (!isAdminPath && (location.pathname === '/' || location.pathname === '/login')) {
                    navigate('/admin/dashboard', {replace: true});
                }
            } else {
                if (location.pathname === '/login') {
                    navigate('/', {replace: true});
                }
            }
        }
    }, [user, isAdminPath, location.pathname, navigate]);

    return (<>
            <Toaster position="top-right" richColors visibleToasts={1} expand={false}/>
            {!isAdminPath && <Header/>}
            <div
                className={!isAdminPath ? "content-with-header" : ""}> 
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path='/forgot-password' element={<ForgotPasswordPage/>}/>
                    <Route path="/otp-verification" element={<OTPVerification/>}/>
                    <Route path="/profile" element={<ProfilePage/>}/>
                    <Route path="/oauth-success" element={<OAuthSuccess/>}/>
                    <Route path='/set-password' element={<SetPass/>}/>
                    <Route path='/auth/complete-profile' element={<UpdateProfileDetail/>}/>
                    <Route path="recruiter/identity" element={<BusinessIdentity/>}/>
                    <Route path="/admin/logs" element={<SystemLogs/>}/>
                    <Route path="/company/TaxLookup" element={<TaxLookup/>}/>
                    <Route path="/admin/jobs" element={<AdminJobPage/>}/>
                    <Route path="/admin/jobs/:jobId" element={<AdminJobDetailPage/>}/>
                    <Route path="/jobs/:jobId" element={<JobDetailPage/>}/>
                    <Route path='/create-jd' element={<CreateJd/>}/>
                    <Route path='/detail-jd/:id' element={<DetailJD_Page/>}/>
                    <Route path='/company/jd-list' element={<ListJdOfCompany/>}/>
                    <Route path='/company/subscriptions' element={<SubscriptionOfCompanyPage/>}/>
                    <Route path='/company/subscriptions/register' element={<RegisterSubscriptionPage/>}/>
                    
                    <Route path="/admin" element={<AdminLayout/>}>
                        <Route index element={<AdminDashboardPage/>}/>
                        <Route path="dashboard" element={<AdminDashboardPage/>}/>
                        <Route path="logs" element={<SystemLogs/>}/>
                        <Route path="jobs" element={<AdminJobPage/>}/>
                        <Route path="jobs/:jobId" element={<AdminJobDetailPage/>}/>

                        <Route path="management/users" element={<UserManagementPage/>}/>
                        <Route path="management/companies" element={<CompanyManagementPage/>}/>
                        <Route path="management/industries" element={<IndustryManagementPage/>}/>
                        <Route path="management/skills" element={<SkillManagementPage/>}/>

                        <Route path="category/:categoryId/skills" element={<AdminRoute><SkillPageContainer/></AdminRoute>}/>
                        <Route path='subscriptions' element={<AdminRoute><SubscriptionManagerPage/></AdminRoute>}/>

                        <Route path="*" element={<div style={{padding: '32px', textAlign: 'center', color: '#64748b'}}>Feature Coming Soon</div>}/>
                    </Route>
                </Routes>
            </div>
        </>);
}

export default App;
