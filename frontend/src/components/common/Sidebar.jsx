import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    Users,
    Building2,
    Briefcase,
    FileText,
    CreditCard,
    ShieldCheck,
    ChevronDown,
    ChevronRight,
    ClipboardList
} from 'lucide-react';
import '../admin/Admin.css';

const Sidebar = () => {
    const location = useLocation();
    const [isManagementOpen, setIsManagementOpen] = useState(false);

    const menuItems = [
        {
            title: 'Dashboard',
            path: '/admin/dashboard',
            icon: <LayoutDashboard size={20} />
        },
        {
            title: 'Duyệt Doanh Nghiệp',
            path: '/admin/approve-companies',
            icon: <Building2 size={20} />,
            badge: 3
        },
        {
            title: 'Duyệt Tin Đăng (AI)',
            path: '/admin/approve-jobs',
            icon: <FileText size={20} />
        },
        {
            title: 'Gói cước & Giá',
            path: '/admin/pricing',
            icon: <CreditCard size={20} />
        },
        {
            title: 'System Logs',
            path: '/admin/logs',
            icon: <ClipboardList size={20} />
        }
    ];

    const managementSubItems = [
        { title: 'Quản lí người dùng', path: '/admin/management/users', icon: <Users size={18} /> },
        { title: 'Quản lí công ty', path: '/admin/management/companies', icon: <Building2 size={18} /> },
        { title: 'Quản lí ngành nghề', path: '/admin/management/industries', icon: <Briefcase size={18} /> },
        { title: 'Quản lí Kĩ năng', path: '/admin/management/skills', icon: <Settings size={18} /> }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="admin-sidebar" style={{ height: '100%' }}>
            {/* Sidebar Header */}
            <div className="sidebar-header">
                <div className="sidebar-logo-container">
                    <div className="logo-icon-bg">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>SkillBridge</h1>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '1px' }}>Administrator</p>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="sidebar-nav">
                <p className="nav-section-label">Main Menu</p>
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <div className="nav-item-content">
                            {item.icon}
                            <span>{item.title}</span>
                        </div>
                        {item.badge && (
                            <span className={`nav-badge ${isActive(item.path) ? '' : 'urgent'}`}
                                style={{
                                    backgroundColor: isActive(item.path) ? 'white' : '#ef4444',
                                    color: isActive(item.path) ? '#4f46e5' : 'white',
                                    fontSize: '10px',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontWeight: '800'
                                }}>
                                {item.badge}
                            </span>
                        )}
                    </Link>
                ))}

                {/* Management Collapsible Section */}
                <div
                    onMouseEnter={() => setIsManagementOpen(true)}
                    onMouseLeave={() => setIsManagementOpen(false)}
                    style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}
                >
                    <p className="nav-section-label">System Control</p>
                    <div
                        className={`management-toggle`}
                        style={{
                            color: (isManagementOpen || managementSubItems.some(sub => isActive(sub.path))) ? '#4f46e5' : '#64748b',
                            backgroundColor: (isManagementOpen || managementSubItems.some(sub => isActive(sub.path))) ? '#f0f4ff' : 'transparent',
                            cursor: 'default'
                        }}
                    >
                        <div className="nav-item-content">
                            <Settings size={20} />
                            <span>Quản Lý</span>
                        </div>
                        {isManagementOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    {/* Sub Items */}
                    <div
                        className="sub-items-container"
                        style={{
                            maxHeight: isManagementOpen ? '500px' : '0',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease-in-out',
                            opacity: isManagementOpen ? 1 : 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            marginTop: '2px',
                            marginLeft: '12px',
                            paddingLeft: '12px',
                            borderLeft: '1px solid #f1f5f9'
                        }}
                    >
                        {managementSubItems.map((subItem) => (
                            <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`sub-item ${isActive(subItem.path) ? 'active' : ''}`}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '13px',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    color: isActive(subItem.path) ? '#4f46e5' : '#64748b',
                                    backgroundColor: isActive(subItem.path) ? '#f0f4ff' : 'transparent',
                                    fontWeight: isActive(subItem.path) ? '800' : '500'
                                }}
                            >
                                {subItem.title}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
