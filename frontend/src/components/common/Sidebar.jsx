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
    ClipboardList,
    Search,
    PlaneIcon,
    LoaderCircle,
    LocateIcon,
    LocationEdit
} from 'lucide-react';
import './AdminSidebar.css';
import { useEffect } from 'react';
import axios from 'axios';


const AdminSidebar = () => {
    useEffect(() => {
        const fetchPendingCompanies = async () => {
            try {
                const res = await axios.get('/api/admin/companies/pending-count');
                setPendingCompanies(res.data); // giả sử API trả về số
            } catch (error) {
                console.error('Lỗi khi lấy số lượng pending:', error);
            }
        };

        fetchPendingCompanies();
    }, []);

    const location = useLocation();
    const [isManagementOpen, setIsManagementOpen] = useState(false);

    const [pendingCompanies, setPendingCompanies] = useState(0);

    const menuItems = [
        {
            title: 'Bảng điều khiển',
            path: '/admin/dashboard',
            icon: <LayoutDashboard />
        },
        {
            title: 'Duyệt Doanh Nghiệp',
            path: '/admin/approve-companies',
            icon: <Building2 />,
            badge: pendingCompanies
        },
        {
            title: 'Duyệt Tin Đăng (AI)',
            path: '/admin/approve-jobs',
            icon: <FileText />
        },
        {
            title: 'System Logs',
            path: '/admin/logs',
            icon: <ClipboardList />
        }
    ];

    const managementSubItems = [
        { title: 'Quản lí người dùng', path: '/admin/management/users', icon: <Users size={18} /> },
        { title: 'Quản lí công ty', path: '/admin/management/companies', icon: <Building2 size={18} /> },
        { title: 'Quản lí ngành nghề', path: '/admin/management/industries', icon: <Briefcase size={18} /> },
        { title: 'Quản lí gói cước', path: '/admin/management/subscriptions', icon: <CreditCard size={18} /> },
        { title: 'Quản lí tin đăng', path: '/admin/jobs', icon: <FileText size={18} /> },
        { title: 'Tra cứu mã số thuế', path: '/admin/tax-lookup', icon: <Search size={18} /> },
        {title: 'Quản lí địa phương', path: '/admin/management/locations', icon: <LocationEdit size={18} /> }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="sidebar">

            <nav className="sidebar-nav">
                {/* Section 1: Danh mục chính */}
                <div className="sidebar-section">
                    <h4>DANH MỤC</h4>
                    <ul>
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                    {/* Badge xử lý thủ công vì CSS không có badge */}
                                    {item.badge > 0 && (
                                        <div className="sidebar-badge-custom" style={{
                                            marginLeft: 'auto',
                                            backgroundColor: isActive(item.path) ? '#fff' : '#ff3b30',
                                            color: isActive(item.path) ? '#007aff' : '#fff',
                                            borderRadius: '10px',
                                            padding: '2px 8px',
                                            fontSize: '10px',
                                            fontWeight: 800
                                        }}>
                                            <div className="sidebar-badge">
                                                {item.badge}
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Section 2: Quản lý (Collapsible) */}
                <div className="sidebar-section">
                    <h4>QUẢN TRỊ</h4>
                    <div
                        className="management-collapsible"
                        onMouseEnter={() => setIsManagementOpen(true)}
                        onMouseLeave={() => setIsManagementOpen(false)}
                    >
                        {/* Nút Toggle Quản Lý - Thừa kế style sidebar-link */}
                        <div className={`sidebar-link ${isManagementOpen ? 'active-hover' : ''}`} style={{ cursor: 'pointer' }}>
                            <Settings />
                            <span>Quản Lý</span>
                            <div style={{ marginLeft: 'auto' }}>
                                {isManagementOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </div>

                        {/* Sub-menu items */}
                        <ul style={{
                            maxHeight: isManagementOpen ? '400px' : '0',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            paddingLeft: isManagementOpen ? '10px' : '0',
                            marginTop: '4px'
                        }}>
                            {managementSubItems.map((subItem) => (
                                <li key={subItem.path}>
                                    <Link
                                        to={subItem.path}
                                        className={`sidebar-link ${isActive(subItem.path) ? 'active' : ''}`}
                                        style={{ minHeight: '40px', fontSize: '13px' }}
                                    >
                                        {subItem.icon}
                                        <span>{subItem.title}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </nav>
        </aside>
    );
};

export default AdminSidebar;