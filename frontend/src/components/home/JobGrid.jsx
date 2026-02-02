import React, { useMemo, useState } from 'react';
import JobCard from './JobCard';
import { jobsCardsMockData } from '../../data/jobsCardsMockData';
import './JobGrid.css';

const JobGrid = () => {
  const [jobs] = useState(jobsCardsMockData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) => {
      const inTitle = job.position.toLowerCase().includes(q);
      const inCompany = job.company.toLowerCase().includes(q);
      const inLocation = job.location.toLowerCase().includes(q);
      const inTags = (job.tags || []).some((t) => t.toLowerCase().includes(q));
      return inTitle || inCompany || inLocation || inTags;
    });
  }, [jobs, searchTerm]);

  return (
    <section className="job-grid-section">
      <div className="job-grid-header">
        <h2>Featured & Latest Jobs</h2>

        <div className="search-filter">
            <svg xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="35px" fill="#434343"><path d="M400-240v-66.67h160V-240H400ZM240-446.67v-66.66h480v66.66H240ZM120-653.33V-720h720v66.67H120Z"/></svg>
          <div className="search-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#666666"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
            <input
              type="search"
              className="job-search"
              placeholder="Search for jobs, companies, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search jobs"
            />
          </div>


        </div>
      </div>

      <div className="job-grid">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} featured={job.featured} />
        ))}
      </div>

      <div className="view-all">
        <button className="btn-view-all">View All Jobs</button>
      </div>
    </section>
  );
};

export default JobGrid;
