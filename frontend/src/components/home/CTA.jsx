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
          <Link to="/signup?role=candidate" className="btn btn-primary btn-lg">
            Đăng Ký Là Ứng Viên
          </Link>
          <Link to="/signup?role=recruiter" className="btn btn-secondary btn-lg">
            Đăng Ký Là Nhà Tuyển Dụng
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
