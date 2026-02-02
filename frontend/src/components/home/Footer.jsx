import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Về SkillBridge</h4>
          <ul>
            <li><a href="#about">Giới thiệu</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#press">Press</a></li>
            <li><a href="#careers">Tuyển dụng</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Cho Ứng Viên</h4>
          <ul>
            <li><a href="#job-search">Tìm Việc Làm</a></li>
            <li><a href="#resume">Hướng dẫn CV</a></li>
            <li><a href="#interview">Chuẩn bị Phỏng Vấn</a></li>
            <li><a href="#salary">Tra cứu Lương</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Cho Nhà Tuyển Dụng</h4>
          <ul>
            <li><a href="#post-job">Đăng Tin Tuyển Dụng</a></li>
            <li><a href="#recruiter-guide">Hướng dẫn Tuyển Dụng</a></li>
            <li><a href="#pricing">Bảng Giá</a></li>
            <li><a href="#contact">Liên Hệ</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Hỗ Trợ</h4>
          <ul>
            <li><a href="#help">Trung tâm Trợ giúp</a></li>
            <li><a href="#contact">Liên Hệ Chúng Tôi</a></li>
            <li><a href="#privacy">Chính sách Riêng tư</a></li>
            <li><a href="#terms">Điều khoản Dịch vụ</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 SkillBridge. All rights reserved.</p>
        <div className="social-links">
          <a href="#facebook">Facebook</a>
          <a href="#twitter">Twitter</a>
          <a href="#linkedin">LinkedIn</a>
          <a href="#instagram">Instagram</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
