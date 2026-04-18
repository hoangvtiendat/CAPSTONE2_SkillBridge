import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'; // Thêm axios để gọi API
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
import NotificationBell from '../common/NotificationBell';

const API_BASE_URL = "http://localhost:8081/identity";

const RecruiterLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. State lưu số lượng ứng viên
    const [candidateCount, setCandidateCount] = useState(0);

    // 2. Gọi API đếm số lượng ứng viên
    useEffect(() => {
        const fetchCandidateCount = async () => {
            if (user) {
                try {
                    // Lấy token từ nơi bạn đang lưu trữ (localStorage, cookie, v.v.)
                    const token = localStorage.getItem('accessToken');

                    // TODO: THAY ĐỔI URL DƯỚI ĐÂY THÀNH API THẬT CỦA BẠN
                    const response = await axios.get(`http://localhost:8081/identity/applications/company/${user.companyId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    // Kiểm tra và đếm độ dài mảng
                    if (Array.isArray(response.data)) {
                        setCandidateCount(response.data.length);
                    } else if (response.data.result && Array.isArray(response.data.result)) {
                        setCandidateCount(response.data.result.length);
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy danh sách ứng viên:", error);
                }
            }
        };

        fetchCandidateCount();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        toast.success("Đăng xuất thành công");
        navigate('/login');
    };

    // 3. Cập nhật menuItems, thay số cứng bằng state candidateCount
    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Bảng điều khiển', path: '/recruiter/dashboard' },
        { icon: <UserCog size={20} />, label: 'Quản lý nhân viên', path: '/company/member' },
        {
            icon: <Users size={20} />,
            label: 'Ứng viên',
            path: '/recruiter/candidates',
            badge: candidateCount // Truyền state vào đây
        },
        { icon: <FileText size={20} />, label: 'Tin tuyển dụng', path: '/company/jd-list' },
        { icon: <CreditCard size={20} />, label: 'Gói dịch vụ', path: '/company/subscriptions' },
        { icon: <Settings size={20} />, label: 'Cài đặt công ty', path: '/recruiter/settings' },
        { icon: <BarChart3 size={20} />, label: 'Phân tích', path: '/recruiter/analytics' },
    ];

    const currentLabel = menuItems.find(i => i.path === location.pathname)?.label || 'Tổng quan';

    const DEFAULT_AVATAR = `${API_BASE_URL}/avatars/default.jpg`;

    const getImageUrl = (path) => {
        if (!path || path === "" || path === "null") return DEFAULT_AVATAR;
        if (path.startsWith('http')) return path;
        const baseUrl = API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${baseUrl}/${cleanPath}?t=${new Date().getTime()}`;
    };

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

                            {/* Chỉ hiển thị badge nếu số lượng > 0 */}
                            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
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

                        <NotificationBell />

                        <div className="header-divider"></div>

                        <div className="header-user-profile">
                            <div className="user-avatar-mini">
                                <img
                                    src={getImageUrl(user?.avatar)}
                                    alt={user?.name || "User Avatar"}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            </div>
                            <div className="user-details-mini">
                                <span className="u-name">{user?.name || 'Recruiter'}</span>
                                <span className="u-role">Nhà tuyển dụng</span>
                            </div>
                            <ChevronDown size={14} color="#86868b" />

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