import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, MapPin, Calendar, X } from "lucide-react"; // Đã xoá Mail
import './Header.css';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell'; // Đã xoá import InvitationsPortal

const API_BASE_URL = "http://localhost:8081/identity";
const DEFAULT_AVATAR = `${API_BASE_URL}/avatars/default.jpg`;

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Đã xoá state isPortalOpen

  const getImageUrl = (path) => {
    if (!path || path === "" || path === "null") return DEFAULT_AVATAR;
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE_URL;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}?t=${new Date().getTime()}`;
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
      <header className="header">
        <div className="header-container">
          {/* Logo */}
          <Link to="/" className="logo">
            <img src="/logo.png" alt="SkillBridge logo" className="logo-img" />
            <span className="logo-text">SkillBridge</span>
          </Link>

          {/* Navigation */}
          <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <Link to="/" className="nav-link">Trang Chủ</Link>
            <a href="#job-grid" className="nav-link" onClick={(e) => handleNavClick(e, 'job-grid')}>Tìm Việc Làm</a>
            <a href="#company-grid" className="nav-link" onClick={(e) => handleNavClick(e, 'company-grid')}>Công Ty</a>
            <Link to="/about" className="nav-link">Về Chúng Tôi</Link>
          </nav>

          {/* Auth Buttons */}
          <div className="header-actions">
            {user ? (
                <div className="user-menu-container" ref={dropdownRef}>
                  <div className="user-profile-wrapper">
                    <div className="user-profile-link" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                      <img src={getImageUrl(user.avatar)} alt="Avatar" className="user-avatar" />
                    </div>
                    {/* Đã xoá nút invitation-btn ở đây */}
                  </div>

                  {isUserMenuOpen && (
                      <div className="user-dropdown">
                        <div className="user-info-mini">
                          <span className="user-name">{user.name || "User"}</span>
                          <span className="user-email">{user.email || ""}</span>
                        </div>
                        <div className="dropdown-divider"></div>
                        <Link to="/profile" className="user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          Quản lý hồ sơ cá nhân
                        </Link>
                        <button className="user-dropdown-item logout-btn" onClick={handleLogout}>
                          Đăng xuất
                        </button>
                      </div>
                  )}
                </div>
            ) : (
                <Link to="/login" className="btn-login">Tham gia</Link>
            )}
          </div>

          <button
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
  );
};

export default Header;