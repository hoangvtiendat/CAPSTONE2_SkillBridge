import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth(); // Get user and logout from AuthContext
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
          <Link to="/job-search" className="nav-link">Tìm Việc Làm</Link>
          <Link to="/" className="nav-link">Công Ty</Link>
          <Link to="/" className="nav-link">Về Chúng Tôi</Link>
        </nav>

        {/* Auth Buttons */}
        <div className="header-actions">
          {user ? (
            <div className="user-menu-container" ref={dropdownRef}>
              <div
                className="user-profile-link"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <img
                  src={user.avatar || "https://ui-avatars.com/api/?name=User&background=random"}
                  alt={user.name || "User Avatar"}
                  className="user-avatar"
                />
              </div>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info-mini">
                    <span className="user-name">{user.name || "User"}</span>
                    <span className="user-email">{user.email || ""}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="user-dropdown-item admin-link"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Trang Quản trị
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Quản lý hồ sơ cá nhân
                  </Link>
                  <Link
                    to="/settings"
                    className="user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Cài đặt
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    className="user-dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              Tham gia
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
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
