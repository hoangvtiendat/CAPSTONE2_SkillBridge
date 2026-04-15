import React from 'react';
import { Link } from 'react-router-dom';
import './JobCard.css';
import AppImage from '../common/AppImage';
import { DEFAULT_COMPANY_IMAGE } from '../../utils/imageUtils';

const JobCard = ({ job, featured = false }) => {
    const { id, position, company, location, salary, tags, logo } = job;

    const formatSalary = (value) => {
        if (!value) return '0';
        return new Intl.NumberFormat('vi-VN').format(Number(value));
    };

    return (
        <div className={`compact-job-card ${featured ? 'is-featured' : ''}`}>
            {featured && (
                <div className="mini-premium-badge">
                    <span className="material-symbols-outlined">verified</span>
                    <span>Nổi bật</span>
                </div>
            )}

            <div className="card-inner">
                {/* Logo tách biệt trên cùng */}
                <div className="logo-box">
                    <div className = "logo-content">
                        {typeof logo === 'string' ? (
                            <AppImage src={logo} fallbackSrc={DEFAULT_COMPANY_IMAGE} alt={company} />
                        ) : (
                            logo
                        )}
                    </div>
                </div>

                {/* Title & Location xếp dọc chuẩn xác */}
                <div className="main-info">
                    <h3 className="job-name" title={position}>{position}</h3>
                    <div className="loc-info">
                        <span className="material-symbols-outlined">location_on</span>
                        <span>{location}</span>
                    </div>
                </div>

                {/* Salary: Gọn gàng hơn */}
                <div className="budget-tag">
                    <p className="budget-label">Ngân sách</p>
                    <p className="budget-value">
                        {formatSalary(salary.min)} - {formatSalary(salary.max)}
                        <span className="unit"> VND</span>
                    </p>
                </div>

                {/* Tags: Giới hạn dòng */}
                <div className="skill-wrapper">
                    {tags?.slice(0, 2).map((tag, index) => (
                        <span key={index} className="skill-item">{tag}</span>
                    ))}
                    {tags?.length > 2 && <span className="skill-more">+{tags.length - 2}</span>}
                </div>

                {/* Action: Nút thu gọn tinh tế */}
                <Link to={`/jobs/${id}`} className="cta-button">
                    <span>Ứng tuyển ngay</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
            </div>
        </div>
    );
};

export default JobCard;