import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <Link to="/login" className="btn-login">
            Tham gia
          </Link>
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
