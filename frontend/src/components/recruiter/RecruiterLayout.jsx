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
    UserCog,
    Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import './Recruiter.css';
import NotificationBell from '../common/NotificationBell';
import companyMemberService from '../../services/api/companyMemberService';

const API_BASE_URL = "http://localhost:8081/identity";

const RecruiterLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. State lưu số lượng ứng viên và role công ty
    const [candidateCount, setCandidateCount] = useState(0);
    const [companyRole, setCompanyRole] = useState(null);

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

        const fetchRole = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    const role = await companyMemberService.getCompanyMembersRole(token);
                    setCompanyRole(role);
                }
            } catch (error) {
                console.error("Không xác định được role công ty:", error);
            }
        };

        fetchRole();
        fetchCandidateCount();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        toast.success("Đăng xuất thành công");
        navigate('/login');
    };

    // 3. Cập nhật menuItems, thay số cứng bằng state candidateCount
    // Check if company is deactivated
    const isCompanyDeactivated = user?.companyStatus === 'DEACTIVATED';

    // Menu items that are always accessible even when company is deactivated
    const alwaysAccessiblePaths = ['/recruiter/settings', '/recruiter/analytics'];

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Bảng điều khiển', path: '/recruiter/dashboard', disabled: isCompanyDeactivated },
        { icon: <UserCog size={20} />, label: 'Quản lý nhân viên', path: '/company/member', disabled: isCompanyDeactivated, lockedForMember: true },
        { icon: <Users size={20} />, label: 'Ứng viên', path: '/recruiter/candidates', badge: candidateCount, disabled: isCompanyDeactivated },
        { icon: <FileText size={20} />, label: 'Tin tuyển dụng', path: '/company/jd-list', disabled: isCompanyDeactivated },
        { icon: <CreditCard size={20} />, label: 'Gói dịch vụ', path: '/company/subscriptions', disabled: isCompanyDeactivated, lockedForMember: true },
        { icon: <Settings size={20} />, label: 'Cài đặt công ty', path: '/recruiter/settings', disabled: false, lockedForMember: true },
        { icon: <BarChart3 size={20} />, label: 'Phân tích', path: '/recruiter/analytics', disabled: isCompanyDeactivated },
    ];

    const handleMenuItemClick = (e, item) => {
        if (item.disabled) {
            e.preventDefault();
            toast.error('Danh mục này đã bị khóa vì công ty của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin.', {
                description: 'Bạn chỉ có thể truy cập "Cài đặt công ty" hoặc "Phân tích".'
            });
        } else if (item.lockedForMember && companyRole && companyRole !== 'ADMIN') {
            e.preventDefault();
            toast.error('Bạn không có quyền truy cập chức năng này', {
                description: 'Chức năng này chỉ dành cho Admin của công ty.'
            });
        }
    };

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
                    {menuItems.map((item) => {
                        const isLockedForMember = item.lockedForMember && companyRole && companyRole !== 'ADMIN';
                        const itemClass = `nav-item ${location.pathname === item.path ? 'active' : ''} ${item.disabled ? 'disabled' : ''} ${isLockedForMember ? 'locked' : ''}`;
                        let title = item.label;
                        if (item.disabled) title = 'Công ty của bạn đã bị vô hiệu hóa';
                        else if (isLockedForMember) title = 'Chức năng này chỉ dành cho Admin của công ty';

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={(e) => handleMenuItemClick(e, item)}
                                className={itemClass}
                                title={title}
                            >
                                {item.icon}
                                <span className="nav-label">{item.label}</span>
                                {(item.disabled || isLockedForMember) && <Lock size={16} className="nav-lock-icon" />}

                                {/* Chỉ hiển thị badge nếu số lượng > 0 và không bị khóa */}
                                {item.badge > 0 && !item.disabled && !isLockedForMember && <span className="nav-badge">{item.badge}</span>}
                            </Link>
                        );
                    })}
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
                            onClick={() => {
                                if (isCompanyDeactivated) {
                                    toast.error('Công ty của bạn đã bị vô hiệu hóa', {
                                        description: 'Bạn không thể tạo tin tuyển dụng mới. Vui lòng liên hệ admin.'
                                    });
                                    return;
                                }
                                navigate('/create-jd');
                            }}
                            disabled={isCompanyDeactivated}
                            style={{
                                opacity: isCompanyDeactivated ? 0.5 : 1,
                                cursor: isCompanyDeactivated ? 'not-allowed' : 'pointer'
                            }}
                            title={isCompanyDeactivated ? 'Không thể tạo tin vì công ty đã bị vô hiệu hóa' : 'Tạo bài đăng tuyển dụng mới'}
                        >
                            <Plus size={18} />
                            <span>Tạo tin</span>
                        </button>
                    </div>
                </header>

                {/* --- CONTENT PAGE --- */}
                <main className="recruiter-content">
                    {isCompanyDeactivated && (
                        <div className="deactivation-banner">
                            <div className="banner-content">
                                <Lock size={20} className="banner-icon" />
                                <div className="banner-text">
                                    <h4>Công ty của bạn đã bị vô hiệu hóa</h4>
                                    <p>Hầu hết các danh mục đã bị khóa. Bạn chỉ có thể truy cập "Cài đặt công ty" và "Phân tích". Vui lòng liên hệ quản trị viên để mở khóa.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default RecruiterLayout;