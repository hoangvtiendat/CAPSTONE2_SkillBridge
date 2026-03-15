import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    BarChart3,
    Plus,
    LogOut,
    Settings,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import './Recruiter.css';

const RecruiterLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        toast.success("Đăng xuất thành công");
        navigate('/login');
    };

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Bảng điều khiển', path: '/recruiter/dashboard' },
        { icon: <Users size={20} />, label: 'Ứng viên', path: '/recruiter/candidates' },
        { icon: <FileText size={20} />, label: 'Tin tuyển dụng', path: '/company/jd-list' },
        { icon: <CreditCard size={20} />, label: 'Gói dịch vụ', path: '/company/subscriptions' },
        { icon: <Settings size={20} />, label: 'Cài đặt công ty', path: '/recruiter/settings' },
        { icon: <BarChart3 size={20} />, label: 'Phân tích', path: '/recruiter/analytics' },
    ];

    return (
        <div className="recruiter-layout">
            {/* Sidebar */}
            <aside className="recruiter-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">T</div>
                    <span className="brand-name">{user?.companyName || 'Nhà tuyển dụng'}</span>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.label === 'Ứng viên' && <span className="nav-badge">12</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'R'}
                        </div>
                        <div className="user-info">
                            <p className="user-name">{user?.name || 'Nhà tuyển dụng'}</p>
                            <p className="user-role">Nhà tuyển dụng</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        <LogOut size={18} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="recruiter-main">
                <header className="recruiter-header">
                    <h2 className="header-title">
                        {menuItems.find(i => i.path === location.pathname)?.label || 'Tổng quan'}
                    </h2>
                    <div className="header-actions">
                        <button
                            className="btn-create-job"
                            onClick={() => navigate('/create-jd')}
                        >
                            <Plus size={18} />
                            <span>Tạo tin tuyển dụng</span>
                        </button>
                    </div>
                </header>

                <div className="recruiter-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default RecruiterLayout;
