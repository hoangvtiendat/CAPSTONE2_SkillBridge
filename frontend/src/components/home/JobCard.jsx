import React from 'react';
import { Link } from 'react-router-dom';
import './JobCard.css';

const JobCard = ({ job, featured = false }) => {
  const { id, position, company, location, salary, tags, logo } = job;

  return (
    <div className={`job-card ${featured ? 'featured' : ''}`}>
      {featured && <div className="featured-badge">Featured</div>}
      
      <div className="job-card-header">
        <div className="company-logo">{logo}</div>
        <div className="job-info">
          <h3 className="job-position">{position}</h3>
          <p className="job-company">{company}</p>
          <p className="job-location">{location}</p>
        </div>
      </div>

      <div className="job-salary">
        ${salary.min}k - ${salary.max}k
      </div>

      <div className="job-tags">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))
        ) : (
          <span className="tag-placeholder">None</span>
        )}
      </div>

      <div className="job-actions">
        <Link to={`/jobs/${id}`} className="btn-apply">
          Apply Now
        </Link>
        <button className="btn-check">Self-Check</button>
      </div>
    </div>
  );
};

export default JobCard;
