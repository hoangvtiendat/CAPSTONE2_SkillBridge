import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Toaster, toast } from 'sonner';

import './App.css';

// Context
import { useAuth } from './context/AuthContext';

// Components
import Header from './components/home/Header';
import NotificationCard from './components/notifications/NotificationCard';
import AdminLayout from './components/admin/AdminLayout';
import AdminRoute from './components/admin/AdminRoute';
import RecruiterLayout from './components/recruiter/RecruiterLayout';
import RecruiterRoute from './components/recruiter/RecruiterRoute';
import { OTPVerification } from './components/auth/OTPVerification';
import { SetPass } from './components/auth/SetPass';

// Pages: Auth & General
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ProfilePage from './pages/profile/ProfilePage';
import UpdateProfileDetail from './pages/auth/Update_profile_of_register';
import OAuthSuccess from './pages/auth/OAuthSuccess';

// Pages: Candidate & Public
import JobDetailPage from './pages/candidate/JobDetailPage';
import CompanyDetailPage from './pages/candidate/CompanyDetailPage';
import TaxLookup from './pages/company/TaxLookup';

// Pages: Recruiter
import RecruiterDashboardPage from './pages/recruiter/RecruiterDashboardPage';
import RecruiterApplications from './pages/recruiter/RecruiterApplications';
import ApplicationDetailPage from './pages/recruiter/ApplicationDetailPage';
import MyJobsPage from './pages/recruiter/MyJobsPage';
import BusinessIdentity from './pages/recruiter/BusinessIdentity';
import CompanySettings from './pages/recruiter/CompanySettings';
import AdminMemberManager from './pages/recruiter/AdminMemberManager';
import ListJdOfCompany from './pages/JD/list_jd_of_company';
import CreateJd from './pages/JD/PostJDPage';
import DetailJD_Page from './pages/JD/detailJD';
import SubscriptionOfCompanyPage from './pages/Subscription.jsx/SubscriftionOfCompany';
import RegisterSubscriptionPage from './pages/Subscription.jsx/RegisterSubscriptionPage';

// Pages: Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SystemLogs from './pages/SystemLogs/SystemLogs';
import AdminJobPage from './pages/admin/AdminJobPage';
import AdminJobDetailPage from './pages/admin/AdminJobDetailPage';
import AdminPendingJobs from './pages/admin/AdminPendingJobs';
import AdminCompanyPending from './pages/admin/AdminCompanyPending';
import UserManagementPage from './pages/admin/UserManagementPage';
import CompanyManagementPage from './pages/admin/CompanyManagementPage';
import IndustryManagementPage from './pages/admin/IndustryManagementPage';
import SkillManagementPage from './pages/admin/SkillManagementPage';
import SkillPageContainer from './pages/Skill/SkillPage';
import SubscriptionManagerPage from './pages/Subscription.jsx/SubscriptionManager';

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Xác định layout dựa trên path
    const isAdminPath = location.pathname.startsWith('/admin');
    const isRecruiterPath = location.pathname.startsWith('/recruiter') ||
        location.pathname === '/create-jd' ||
        location.pathname.startsWith('/detail-jd') ||
        location.pathname.startsWith('/company/jd-list') ||
        location.pathname.startsWith('/company/subscriptions') ||
        location.pathname.startsWith('/company/member');

    const isDashboardLayout = isAdminPath || isRecruiterPath;

    // 1. Quản lý WebSocket cho Thông báo
    useEffect(() => {
        let stompClient = null;

        if (user) {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            stompClient = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8081/identity/ws-log'),
                connectHeaders: { Authorization: `Bearer ${token}` },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            stompClient.onConnect = (frame) => {
                console.log('Connected to WebSocket');
                stompClient.subscribe('/user/queue/notifications', (message) => {
                    const notification = JSON.parse(message.body);
                    toast.custom((t) => (
                        <NotificationCard
                            t={t}
                            title={notification.title}
                            content={notification.content}
                            link={notification.link}
                            navigate={navigate}
                        />
                    ), { duration: 10000 });
                });
            };

            stompClient.onStompError = (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            };

            stompClient.activate();
        }

        return () => {
            if (stompClient) stompClient.deactivate();
        };
    }, [user, navigate]);

    // 2. Điều hướng dựa trên Role
    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') {
                if (!isAdminPath && (location.pathname === '/' || location.pathname === '/login')) {
                    navigate('/admin/dashboard', { replace: true });
                }
            } else if (user.role === 'RECRUITER') {
                if (!isRecruiterPath && (location.pathname === '/' || location.pathname === '/login')) {
                    navigate('/recruiter/dashboard', { replace: true });
                }
            } else {
                if (location.pathname === '/login') {
                    navigate('/', { replace: true });
                }
            }
        }
    }, [user, isAdminPath, isRecruiterPath, location.pathname, navigate]);

    return (
        <>
            <Toaster
                position="top-right"
                richColors
                visibleToasts={5}
                expand={true}
                closeButton
                toastOptions={{
                    style: { padding: '16px', fontSize: '15px' }
                }}
            />

            {!isDashboardLayout && <Header />}

            <div className={!isDashboardLayout ? "content-with-header" : ""}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path='/forgot-password' element={<ForgotPasswordPage />} />
                    <Route path="/otp-verification" element={<OTPVerification />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/oauth-success" element={<OAuthSuccess />} />
                    <Route path='/set-password' element={<SetPass />} />
                    <Route path='/auth/complete-profile' element={<UpdateProfileDetail />} />
                    <Route path="/jobs/:jobId" element={<JobDetailPage />} />
                    <Route path="/companies/:id" element={<CompanyDetailPage />} />
                    <Route path="/company/TaxLookup" element={<TaxLookup />} />

                    {/* Recruiter Routes (Wrapped in Layout & Guard) */}
                    <Route element={<RecruiterRoute><RecruiterLayout /></RecruiterRoute>}>
                        <Route path="/recruiter">
                            <Route index element={<RecruiterDashboardPage />} />
                            <Route path="dashboard" element={<RecruiterDashboardPage />} />
                            <Route path="identity" element={<BusinessIdentity />} />
                            <Route path="my-jobs" element={<MyJobsPage />} />
                            <Route path="jobs/:jobId/applications" element={<RecruiterApplications />} />
                            <Route path="applications/:id" element={<ApplicationDetailPage />} />
                            <Route path="settings" element={<CompanySettings />} />
                            <Route path="candidates" element={<div className="p-8 text-center text-slate-500">Quản lý ứng viên - Sắp ra mắt</div>} />
                        </Route>

                        {/* Các route công ty bổ sung */}
                        <Route path='/create-jd' element={<CreateJd />} />
                        <Route path='/detail-jd/:id' element={<DetailJD_Page />} />
                        <Route path='/company/jd-list' element={<ListJdOfCompany />} />
                        <Route path='company/member' element={<AdminMemberManager />} />
                        <Route path='/company/subscriptions' element={<SubscriptionOfCompanyPage />} />
                        <Route path='/company/subscriptions/register' element={<RegisterSubscriptionPage />} />
                    </Route>

                    {/* Admin Routes (Wrapped in Layout) */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboardPage />} />
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="logs" element={<SystemLogs />} />
                        <Route path="jobs" element={<AdminJobPage />} />
                        <Route path="jobs/:jobId" element={<AdminJobDetailPage />} />
                        <Route path="approve-jobs" element={<AdminPendingJobs />} />
                        <Route path="tax-lookup" element={<TaxLookup />} />

                        <Route path="management/users" element={<UserManagementPage />} />
                        <Route path="management/companies" element={<CompanyManagementPage />} />
                        <Route path="approve-companies" element={<AdminCompanyPending />} />
                        <Route path="management/industries" element={<IndustryManagementPage />} />
                        <Route path="management/skills" element={<SkillManagementPage />} />

                        <Route path="category/:categoryId/skills" element={<AdminRoute><SkillPageContainer /></AdminRoute>} />
                        <Route path="subscriptions" element={<AdminRoute><SubscriptionManagerPage /></AdminRoute>} />
                        <Route path="management/subscriptions" element={<AdminRoute><SubscriptionManagerPage /></AdminRoute>} />

                        <Route path="*" element={<div className="p-8 text-center text-slate-500">Feature Coming Soon</div>} />
                    </Route>

                    {/* 404 hoặc Mặc định */}
                    <Route path="*" element={<div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Trang không tồn tại</div>} />
                </Routes>
            </div>
        </>
    );
}

export default App;