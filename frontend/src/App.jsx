import React, { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import useStompSubscription from './hooks/useStompSubscription';

import './App.css';

// Context
import { useAuth } from './context/AuthContext';

// Components
import Header from './components/home/Header';
import Sidebar from './components/home/Sidebar';
import NotificationCard from './components/notifications/NotificationCard';
import AdminLayout from './components/admin/AdminLayout';
import AdminRoute from './components/admin/AdminRoute';
import RecruiterLayout from './components/recruiter/RecruiterLayout';
import RecruiterRoute from './components/recruiter/RecruiterRoute';
import { OTPVerification } from './components/auth/OTPVerification';
import { SetPass } from './components/auth/SetPass';
import CandidateList from './components/recruiter/CandidateList';

// Pages: Auth & General
import HomePage from './pages/home/HomePage';
import AboutUsPage from './pages/home/AboutUsPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ProfilePage from './pages/profile/ProfilePage';
import UpdateProfileDetail from './pages/auth/Update_profile_of_register';
import OAuthSuccess from './pages/auth/OAuthSuccess';

// Pages: Candidate & Public
import JobDetailPage from './pages/candidate/JobDetailPage';
import CompanyDetailPage from './pages/candidate/CompanyDetailPage';
import TaxLookup from './pages/company/TaxLookup';
import AppliedJobsPage from './pages/candidate/AppliedJobsPage';
import InterviewBookingPage from './pages/candidate/InterviewBookingPage';

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
import DetailJDPage from './pages/JD/detailJD';
import SubscriptionOfCompany from "./pages/subscription/SubscriptionOfCompany";
import RegisterSubscriptionPage from "./pages/subscription/RegisterSubscriptionPage";
import PotentialCandidates from './pages/recruiter/PotentialCandidates';
import BatchSlotCreate from './pages/recruiter/BatchSlotCreate';
import RecruiterAnalyticsPage from './pages/recruiter/RecruiterAnalyticsPage';

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
import SubscriptionManager from "./pages/subscription/SubscriptionManager";
import ChatWidget from './components/chat/ChatWidget';
import safeJsonParse from './utils/safeJsonParse';

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const recentNotificationKeysRef = useRef(new Map());

    // 1. Logic xác định Layout
    const isAdminPath = location.pathname.startsWith('/admin');

    // Kiểm tra Recruiter Path nhưng LOẠI TRỪ trang Identity để hiện Header Public
    const isRecruiterPath = (
        location.pathname.startsWith('/recruiter') ||
        location.pathname === '/create-jd' ||
        location.pathname.startsWith('/detail-jd') ||
        location.pathname.startsWith('/company/jd-list') ||
        location.pathname.startsWith('/company/subscriptions') ||
        location.pathname.startsWith('/company/member')
    );

    // Trang Identity sẽ hiển thị Header Public nên ta set false cho DashboardLayout tại đây
    const isDashboardLayout = (isAdminPath || isRecruiterPath) && location.pathname !== '/recruiter/business';

    useStompSubscription({
        destination: '/user/queue/notifications',
        enabled: Boolean(user),
        onMessage: (message) => {
            const notification = safeJsonParse(message.body, null);
            if (!notification) return;
            const dedupeKey = `${notification?.id || ''}-${notification?.title || ''}-${notification?.content || ''}-${notification?.link || ''}`;
            const now = Date.now();
            const lastShownAt = recentNotificationKeysRef.current.get(dedupeKey);
            if (lastShownAt && now - lastShownAt < 3000) return;

            recentNotificationKeysRef.current.set(dedupeKey, now);
            if (recentNotificationKeysRef.current.size > 100) {
                for (const [key, timestamp] of recentNotificationKeysRef.current.entries()) {
                    if (now - timestamp > 60000) {
                        recentNotificationKeysRef.current.delete(key);
                    }
                }
            }

            toast.custom((t) => (
                <NotificationCard
                    t={t}
                    title={notification.title}
                    content={notification.content}
                    link={notification.link}
                    navigate={navigate}
                />
            ), { duration: 10000 });
        }
    });

    // 3. Điều hướng dựa trên Role
    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') {
                if (!isAdminPath && (location.pathname === '/' || location.pathname === '/login')) {
                    navigate('/admin/dashboard', { replace: true });
                }
            } else if (user.role === 'RECRUITER') {
                // Cho phép Recruiter ở lại trang identity nếu họ muốn cập nhật lại thông tin
                if (!isRecruiterPath && location.pathname !== '/recruiter/business' && (location.pathname === '/' || location.pathname === '/login')) {
                    navigate('/recruiter/dashboard', { replace: true });
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
                toastOptions={{ style: { padding: '16px', fontSize: '15px' } }}
            />

            {/* Hiển thị Header Public nếu không phải Dashboard Layout */}
            {!isDashboardLayout && <Header />}

            <div className={!isDashboardLayout ? "content-with-header" : ""}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/about"
                        element={
                            <div className="home-page">
                                <div className="home-container">
                                    <Sidebar />
                                    <main className="home-main">
                                        <AboutUsPage />
                                    </main>
                                </div>
                            </div>
                        }
                    />
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

                    {/* ROUTE ĐỊNH DANH: Cấu trúc Sidebar + Header Public + BusinessIdentity */}
                    <Route
                        path="/recruiter/business"
                        element={
                            user ? (
                                <div className="home-page">
                                    <div className="home-container">
                                        <Sidebar />
                                        <main className="home-main">
                                            <BusinessIdentity />
                                        </main>
                                    </div>
                                </div>
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    <Route
                        path="/my-applied-jobs"
                        element={
                            user ? (
                                <div className="home-page">
                                    <div className="home-container">
                                        <Sidebar />
                                        <main className="home-main">
                                            <AppliedJobsPage />
                                        </main>
                                    </div>
                                </div>
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/interviews/book/:jobId"
                        element={
                            user ? (
                                <div className="home-page">
                                    <div className="home-container">
                                        <Sidebar />
                                        <main className="home-main">
                                            <InterviewBookingPage />
                                        </main>
                                    </div>
                                </div>
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    {/* Recruiter Routes (Wrapped in Layout & Guard) */}
                    <Route element={<RecruiterRoute><RecruiterLayout /></RecruiterRoute>}>
                        <Route path="/recruiter">
                            <Route index element={<RecruiterDashboardPage />} />
                            <Route path="dashboard" element={<RecruiterDashboardPage />} />
                            <Route path="my-jobs" element={<MyJobsPage />} />
                            <Route path="jobs/:jobId/applications" element={<RecruiterApplications />} />
                            <Route path="applications/:id" element={<ApplicationDetailPage />} />
                            <Route path="settings" element={<CompanySettings />} />
                            <Route path="candidates" element={<CandidateList />} />
                            <Route path="jobs/:jobId/potential" element={<PotentialCandidates />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="jobs/:jobId/batch-slots" element={<BatchSlotCreate />} />
                            <Route path="analytics" element={<RecruiterAnalyticsPage />} />
                        </Route>

                        <Route path='/create-jd' element={<CreateJd />} />
                        <Route path='/detail-jd/:id' element={<DetailJDPage />} />

                        <Route path='/company/jd-list' element={<ListJdOfCompany />} />
                        <Route path='company/member' element={<AdminMemberManager />} />
                        <Route path='/company/subscriptions' element={<SubscriptionOfCompany />} />
                        <Route path='/company/subscriptions/register' element={<RegisterSubscriptionPage />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboardPage />} />
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="logs" element={<SystemLogs />} />
                        <Route path="jobs" element={<AdminJobPage />} />
                        <Route path="jobs/:jobId" element={<AdminJobDetailPage />} />
                        <Route path="approve-jobs" element={<AdminPendingJobs />} />
                        <Route path="tax-lookup" element={<TaxLookup />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="management/users" element={<UserManagementPage />} />
                        <Route path="management/companies" element={<CompanyManagementPage />} />
                        <Route path="approve-companies" element={<AdminCompanyPending />} />
                        <Route path="management/industries" element={<IndustryManagementPage />} />
                        <Route path="management/skills" element={<SkillManagementPage />} />
                        <Route path="category/:categoryId/skills" element={<AdminRoute><SkillPageContainer /></AdminRoute>} />
                        <Route path="subscriptions" element={<AdminRoute><SubscriptionManager /></AdminRoute>} />
                        <Route path="management/subscriptions" element={<AdminRoute><SubscriptionManager /></AdminRoute>} />
                    </Route>

                    <Route path="*" element={<div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Trang không tồn tại</div>} />
                </Routes>
            </div>
            <ChatWidget />
        </>
    );
}

export default App;