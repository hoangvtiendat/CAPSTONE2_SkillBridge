import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import JobCard from './JobCard';
import jobService from '../../services/api/jobService';
import './JobGrid.css';

const JobGrid = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 6,
    totalElements: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchJobs = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const data = await jobService.getFeed({
        page,
        limit: pagination.size,
        // search: searchTerm // Add search if backend supports it in feed
      });

      if (data) {
        setJobs(data.jobs || []);
        setPagination(prev => ({
          ...prev,
          page: data.currentPage,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        }));
      }
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.size]);

  useEffect(() => {
    fetchJobs(0);
  }, [fetchJobs]);

  const handlePageChange = (page) => {
    fetchJobs(page);
    // Scroll to top of grid
    const element = document.getElementById('job-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) => {
      const inTitle = job.position?.toLowerCase().includes(q);
      const inCompany = job.company?.toLowerCase().includes(q);
      const inLocation = job.location?.toLowerCase().includes(q);
      return inTitle || inCompany || inLocation;
    });
  }, [jobs, searchTerm]);

  return (
    <section className="job-grid-section" id="job-grid">
      <div className="job-grid-header">
        <h2>Việc Làm Mới Nhất & Nổi Bật</h2>
        <div className="search-filter">
          <div className="search-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#666666"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" /></svg>
            <input
              type="search"
              className="job-search"
              placeholder="Tìm kiếm việc làm, công ty tại đây"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Tìm kiếm việc làm"
            />
          </div>
        </div>
      </div>

      <div className="job-grid">
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
            <p>Đang tải việc làm...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} featured={job.featured} />
          ))
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
            <p>Không tìm thấy việc làm nào.</p>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="job-pagination">
          <button
            disabled={pagination.page === 0}
            onClick={() => handlePageChange(pagination.page - 1)}
            className="job-page-btn"
            title="Previous"
          >
            <ChevronLeft size={20} />
          </button>

          {[...Array(pagination.totalPages)].map((_, index) => {
            if (
              index === 0 ||
              index === pagination.totalPages - 1 ||
              (index >= pagination.page - 1 && index <= pagination.page + 1)
            ) {
              return (
                <button
                  key={index}
                  onClick={() => handlePageChange(index)}
                  className={`job-page-btn ${pagination.page === index ? 'active' : ''}`}
                >
                  {index + 1}
                </button>
              );
            } else if (
              index === pagination.page - 2 ||
              index === pagination.page + 2
            ) {
              return <span key={index} className="pagination-ellipsis">...</span>;
            }
            return null;
          })}

          <button
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => handlePageChange(pagination.page + 1)}
            className="job-page-btn"
            title="Next"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
};

export default JobGrid;
