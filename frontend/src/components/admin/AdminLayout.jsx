import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import './Admin.css';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success("Đăng xuất thành công");
        navigate('/login');
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
                        <div style={{ height: '32px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
                        <div className="flex-between gap-3">
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '12px', fontWeight: '800', margin: 0, color: '#0f172a' }}>{user?.firstName || 'Admin'}</p>
                                <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>{user?.role === 'ADMIN' ? 'Super Admin' : user?.role}</p>
                            </div>
                            <div className="admin-avatar-container" style={{ position: 'relative', cursor: 'pointer' }}>
                                <div
                                    className="admin-avatar"
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '800' }}
                                >
                                    {user?.firstName?.substring(0, 2).toUpperCase() || 'AD'}
                                </div>
                                <div className="admin-dropdown-menu">
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
