import React from 'react';
import { Link } from 'react-router-dom';
import './JobCard.css';

const API_BASE_URL = "http://localhost:8081/identity";

const JobCard = ({ job, featured = false }) => {
    const { id, position, company, location, salary, tags, logo } = job;

    const getImageUrl = (path) => {
        if (!path || path === "null") return null;
        if (path.startsWith('http')) return path;
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    };

    const formatSalary = (value) => {
        if (!value) return '0';
        return new Intl.NumberFormat('vi-VN').format(Number(value));
    };

    const imageUrl = getImageUrl(logo);

    return (
        <div className={`job-card-compact ${featured ? 'featured' : ''}`}>
            {featured && <div className="featured-badge-mini">Nổi bật</div>}

            <div className="job-card-header-mini">
                <div className={`company-logo-box-mini ${imageUrl ? 'has-image' : 'has-gradient'}`}>
                    {imageUrl ? (
                        <img src={imageUrl} alt={company} />
                    ) : (
                        <span>{company?.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <div className="job-title-group-mini">
                    <h3 className="job-position-mini" title={position}>{position}</h3>
                </div>
            </div>

            {/* Khối Địa chỉ thu nhỏ */}
            <div className="job-meta-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>{location}</span>
            </div>

            {/* Ngân sách dùng Icon Google (Payments/Money icon) */}
            <div className="job-salary-mini">
                <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#2563eb">
                    <path d="M441-120v-86q-53-12-91.5-46T293-348l74-30q15 47 46.5 72.5T490-280q44 0 77-20t33-57q0-42-26-67t-107-59q-91-32-132-76t-41-111q0-61 38-106t106-65v-89h85v90q46 12 78 41.5t48 83.5l-72 32q-14-38-38-56.5T480-720q-35 0-62.5 17.5T390-652q0 33 21.5 52.5T507-543q96 34 140.5 80.5T692-351q0 73-45 120t-121 61v90h-85Z"/>
                </svg>
                <span className="salary-amount-mini">{formatSalary(salary.min)} - {formatSalary(salary.max)}</span>
                <span className="salary-unit-mini"> VND</span>
            </div>

            <div className="job-tags-mini">
                {tags && tags.length > 0 ? (
                    tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="tag-mini">{tag}</span>
                    ))
                ) : (
                    <span className="tag-placeholder-mini">General</span>
                )}
            </div>

            <div className="job-actions-mini">
                <Link to={`/jobs/${id}`} className="btn-apply-compact">
                    Ứng tuyển ngay
                </Link>
            </div>
        </div>
    );
};

export default JobCard;