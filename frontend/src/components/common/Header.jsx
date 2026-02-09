import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Settings, LogOut } from 'lucide-react';
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setShowDropdown(false);
    };

    return (
        <header className="global-header">
            <div className="header-inner">
                {/* Logo */}
                <Link to="/" className="logo-link">
                    <div className="logo-icon">
                        <img src="/logo.png" alt="logo" />
                    </div>
                    <span className="logo-text">SkillBridge</span>
                </Link>

                {/* Navigation */}
                <nav className="nav-links">
                    <Link to="/jobs" className="nav-item">Việc làm</Link>
                    <Link to="/companies" className="nav-item">Công ty</Link>
                    <Link to="/about" className="nav-item">Về chúng tôi</Link>
                </nav>

                {/* Auth Buttons / User Menu */}
                <div className="auth-actions">
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="user-menu-btn"
                            >
                                <div className="user-info-text">
                                    <p className="user-name">{user.name}</p>
                                    <p className="user-role">Ứng viên</p>
                                </div>
                                <div className="user-avatar">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="avatar-img" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header">
                                        <p className="user-name">{user.name}</p>
                                        <p className="user-role" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        className="dropdown-item"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <User size={18} />
                                        <span>Quản lý hồ sơ</span>
                                    </Link>

                                    <Link
                                        to="/settings"
                                        className="dropdown-item"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <Settings size={18} />
                                        <span>Cài đặt</span>
                                    </Link>

                                    <div className="dropdown-divider"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="dropdown-item logout-btn"
                                    >
                                        <LogOut size={18} />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-actions">
                            <Link to="/login" className="login-link">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="register-link">
                                Tham gia ngay
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
