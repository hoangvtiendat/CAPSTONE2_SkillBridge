import React, { useMemo, useState, useEffect } from 'react';
import JobCard from './JobCard';
import jobService from '../../services/api/jobService';
import './JobGrid.css';

const JobGrid = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchJobs = async (cursor = null) => {
    setLoading(true);
    try {
      const data = await jobService.getFeed({ cursor, limit: 6 });
      if (data && data.jobs) {
        setJobs(prev => cursor ? [...prev, ...data.jobs] : data.jobs);
        setNextCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      }
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchJobs(nextCursor);
    }
  };

  // Client-side filtering on the fetched jobs (optional, can be removed if backend search is preferred)
  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) => {
      const inTitle = job.position?.toLowerCase().includes(q);
      const inCompany = job.company?.toLowerCase().includes(q);
      const inLocation = job.location?.toLowerCase().includes(q);
      // const inTags = (job.tags || []).some((t) => t.toLowerCase().includes(q)); // Assuming tags might not be in API response yet
      return inTitle || inCompany || inLocation;
    });
  }, [jobs, searchTerm]);

  return (
    <section className="job-grid-section" id="job-grid">
      <div className="job-grid-header">
        <h2>Featured & Latest Jobs</h2>
        <div className="search-filter">
          <div className="search-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#666666"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" /></svg>
            <input
              type="search"
              className="job-search"
              placeholder="Search for jobs, companies..."
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
        {!loading && filteredJobs.length === 0 && <p>No jobs found.</p>}
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p>}

      {!loading && hasMore && (
        <div className="job-pagination" style={{ justifyContent: 'center' }}>
          <button
            className="job-page-btn"
            style={{ width: 'auto', padding: '0 20px', borderRadius: '8px' }}
            onClick={handleLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
};

export default JobGrid;
