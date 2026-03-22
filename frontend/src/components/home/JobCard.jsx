import React from 'react';
import {Link} from 'react-router-dom';
import './JobCard.css';

const JobCard = ({job, featured = false}) => {
    const {id, position, company, location, salary, tags, logo} = job;

    const formatSalary = (value) => {
        if (value === null || value === undefined) return '0';
        return new Intl.NumberFormat('vi-VN', {
            maximumFractionDigits: 0,
        }).format(Number(value));
    };

    return (
        <div className={`job-card ${featured ? 'featured' : ''}`}>
            {featured && <div className="featured-badge">Nổi bật</div>}

            <div className="job-card-header">
                <div className="company-logo">
                    {typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('/')) ? (
                        <img src={logo} alt={company} className="object-contain w-full h-full rounded"/>
                    ) : (
                        logo
                    )}
                </div>
                <div className="job-info">
                    <h3 className="job-position">{position}</h3>
                    <p className="job-company">{company}</p>
                    <p className="job-location">{location}</p>
                </div>
            </div>

            <div className="job-salary">
                {formatSalary(salary.min)} - {formatSalary(salary.max)} VND
            </div>

            <div className="job-tags">
                {tags.length > 0 ? (
                    tags.map((tag, index) => (
                        <span key={index} className="tag">
              {tag}
            </span>
                    ))
                ) : (
                    <span className="tag-placeholder">Không có</span>
                )}
            </div>

            <div className="job-actions">
                <Link to={`/jobs/${id}`} className="btn-apply">
                    Ứng tuyển ngay
                </Link>
            </div>
        </div>
    );
};

export default JobCard;
