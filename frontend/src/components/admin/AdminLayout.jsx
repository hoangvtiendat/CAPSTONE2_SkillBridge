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
                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </button>
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
