import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import './Admin.css';
import NotificationBell from '../common/NotificationBell';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success("Đăng xuất thành công");
        navigate('/login');
    };

    const API_BASE_URL = "http://localhost:8081/identity";
    const DEFAULT_AVATAR = `${API_BASE_URL}/avatars/default.jpg`;

    const getImageUrl = (path) => {
        if (!path || path === "" || path === "null") return DEFAULT_AVATAR;
        if (path.startsWith('http')) return path;
        const baseUrl = API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${baseUrl}/${cleanPath}?t=${new Date().getTime()}`;
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
                        <span className="text-slate-900 text-sm font-semibold capitalize" style={{ fontWeight: '700', fontSize: '25px', color: '#424242ff' }}>Dashboard</span>
                    </div>
                    <div className="flex-between gap-4">
                        <NotificationBell />
                        <div style={{ height: '32px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
                        <div className="flex-between gap-3">
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '12px', fontWeight: '800', margin: 0, color: '#0f172a' }}>{user?.firstName || 'Admin'}</p>
                                <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>{user?.role === 'ADMIN' ? 'Admin' : user?.role}</p>
                            </div>
                            <div className="admin-avatar-container" style={{ position: 'relative', cursor: 'pointer' }}>
                                <div
                                    className="admin-avatar"
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <img
                                        src={getImageUrl(user?.avatar)}
                                        alt={user?.firstName || "Admin"}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="admin-dropdown-menu">
                                    <button onClick={() => navigate('/admin/profile')} className="logout-btn" style={{ borderBottom: '1px solid #eee', borderRadius: '8px 8px 0 0', color: '#000' }}>
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
