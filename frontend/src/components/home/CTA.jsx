import React from 'react';
import { Link } from 'react-router-dom';
import './CTA.css';

const CTA = () => {
  return (
    <section className="cta">
      <div className="cta-content">
        <h2>Sẵn Sàng Bắt Đầu?</h2>
        <p>Tham gia hàng nghìn ứng viên và nhà tuyển dụng đã tìm thấy công việc phù hợp</p>

        <div className="cta-buttons">
          <Link to="/login" className="btn-home btn-home-primary btn-home-lg">
            Đăng Ký Là Ứng Viên
          </Link>
          <Link to="/recruiter/business" className="btn-home btn-home-secondary btn-home-lg">
            Đăng Ký Là Nhà Tuyển Dụng
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
