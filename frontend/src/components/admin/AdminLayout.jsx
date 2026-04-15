import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import './Admin.css';
import AppImage from '../common/AppImage';
import { DEFAULT_AVATAR_IMAGE } from '../../utils/imageUtils';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        toast.success("Đăng xuất thành công");
        navigate('/login');
    };

    const getHeaderTitle = () => {
        if (location.pathname.includes('/management/users')) return 'Quản lý người dùng';
        if (location.pathname.includes('/management/companies')) return 'Quản lý doanh nghiệp';
        if (location.pathname.includes('/approve-companies')) return 'Duyệt doanh nghiệp';
        if (location.pathname.includes('/approve-jobs')) return 'Duyệt tin đăng';
        if (location.pathname.includes('/management/industries')) return 'Quản lý ngành nghề';
        if (location.pathname.includes('/management/skills')) return 'Quản lý kỹ năng';
        if (location.pathname.includes('/subscriptions')) return 'Quản lý gói dịch vụ';
        if (location.pathname.includes('/logs')) return 'System Logs';
        return 'Dashboard';
    };

    return (
        <div className="admin-layout">
            {/* Sidebar with fixed width */}
            <aside className="admin-sidebar">
                <Sidebar />
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Topbar/Header for Admin */}
                <header className="admin-header">
                    <div className="flex-between gap-2">
                        <span className="admin-header-title">{getHeaderTitle()}</span>
                    </div>
                    <div className="flex-between gap-4">
                        <div className="admin-header-divider"></div>
                        <div className="flex-between gap-3">
                            <div className="admin-avatar-container">
                                <div className="admin-user-pill">
                                    <div className="admin-avatar">
                                        <AppImage
                                            src={user?.avatar}
                                            fallbackSrc={DEFAULT_AVATAR_IMAGE}
                                            alt={user?.firstName || "Admin"}
                                            className="admin-avatar-image"
                                        />
                                    </div>
                                    <div className="admin-user-info">
                                        <p className="admin-user-name">{user?.firstName || 'Admin'}</p>
                                        <p className="admin-user-role">{user?.role === 'ADMIN' ? 'Super Admin' : user?.role}</p>
                                    </div>
                                    <ChevronDown size={14} className="admin-chevron-down" />
                                </div>
                                <div className="admin-dropdown-menu">
                                    <button onClick={() => navigate('/admin/profile')} className="logout-btn profile-btn">
                                        <User size={16} />
                                        <span>Hồ sơ cá nhân</span>
                                    </button>
                                    <button onClick={handleLogout} className="logout-btn">
                                        <LogOut size={16} />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
