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
    User,
    Building2,
    Briefcase,
    Star,
    CreditCard,
    Search,
    Bell,
    ChevronDown,
    UserCog
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import './Recruiter.css';
import AppImage from '../common/AppImage';
import { DEFAULT_AVATAR_IMAGE } from '../../utils/imageUtils';

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
        { icon: <UserCog size={20} />, label: 'Quản lý nhân viên', path: '/company/member' },
        { icon: <Users size={20} />, label: 'Ứng viên', path: '/recruiter/candidates', badge: 12 },
        { icon: <FileText size={20} />, label: 'Tin tuyển dụng', path: '/company/jd-list' },
        { icon: <CreditCard size={20} />, label: 'Gói dịch vụ', path: '/company/subscriptions' },
        { icon: <Settings size={20} />, label: 'Cài đặt công ty', path: '/recruiter/settings' },
        { icon: <BarChart3 size={20} />, label: 'Phân tích', path: '/recruiter/analytics' },
    ];

    const currentLabel = menuItems.find(i => i.path === location.pathname)?.label || 'Tổng quan';

    return (
        <div className="recruiter-layout">
            {/* --- SIDEBAR (Mini-to-Full) --- */}
            <aside className="recruiter-sidebar">
                <div className="sidebar-section">
                    <h4 className="sidebar-section-header">Danh Mục</h4>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span className="nav-label">{item.label}</span>
                            {item.badge && <span className="nav-badge">{item.badge}</span>}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* --- MAIN AREA --- */}
            <div className="recruiter-main">
                {/* --- HEADER FIXED SYSTEM --- */}
                <header className="recruiter-header-fixed">
                    <div className="header-left">
                        <h2 className="header-title">{currentLabel}</h2>
                    </div>

                    <div className="header-right">
                        <div className="header-search-bar">
                            <Search size={18} className="search-icon" />
                            <input type="text" placeholder="Tìm nhanh hồ sơ..." />
                        </div>

                        <button className="header-icon-btn">
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </button>

                        <div className="header-divider"></div>

                        {/* Thông tin người dùng di chuyển lên đây */}
                        <div className="header-user-profile">
                            <div className="user-avatar-mini">
                                <AppImage
                                    src={user?.avatar}
                                    fallbackSrc={DEFAULT_AVATAR_IMAGE}
                                    alt={user?.name || "User Avatar"}
                                    className="recruiter-avatar-img"
                                />
                            </div>
                            <div className="user-details-mini">
                                <span className="u-name">{user?.name || 'Recruiter'}</span>
                                <span className="u-role">Nhà tuyển dụng</span>
                            </div>
                            <ChevronDown size={14} color="#86868b" />

                            {/* Dropdown Logout (Ẩn hiện khi hover hoặc click) */}
                            <div className="user-dropdown-glass">
                                <button onClick={() => navigate('/recruiter/profile')} className="dropdown-item-logout" style={{ marginBottom: '8px', background: 'rgba(0, 122, 255, 0.1)', color: 'var(--sf-blue)', fontSize: '13px' }}>
                                    <User size={16} />
                                    <span>Quản lý hồ sơ</span>
                                </button>
                                <button onClick={handleLogout} className="dropdown-item-logout">
                                    <LogOut size={16} />
                                    <span>Đăng xuất</span>
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn-create-job-pill"
                            onClick={() => navigate('/create-jd')}
                        >
                            <Plus size={18} />
                            <span>Tạo tin</span>
                        </button>
                    </div>
                </header>

                {/* --- CONTENT PAGE --- */}
                <main className="recruiter-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default RecruiterLayout;