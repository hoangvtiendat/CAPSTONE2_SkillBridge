import React, { useEffect, useMemo, useState } from 'react';
import JobCard from './JobCard';
// import { jobsCardsMockData } from '../../data/jobsCardsMockData';
import './JobGrid.css';

const JobGrid = () => {

  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6; // Display 9 jobs (3 rows of 3)

  const get_API_data = async()=> {
    try{
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/Jobs', 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },  
        }
      ); 
      const data = await response.json();
      if(response.ok){
        setJobs(data);
        console.log("Fetched jobs:", data);
      }

    }catch(err){
      console.error("Error fetching jobs:", err);
    }
    finally{
      setIsLoading(false);
    }
  } 
    useEffect(() => {
      get_API_data();
    } , []);
 
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const currentJobs = filteredJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Optional: Scroll to top of grid
      const element = document.getElementById('job-grid');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="job-grid-section" id="job-grid">
      <div className="job-grid-header">
        <h2>Featured & Latest Jobs</h2>
        {/* Search Bar kept as is, removed simplified SVG icon for brevity in replacement if wished, but keeping structure */}
        <div className="search-filter">
          {/* Kept existing Search UI */}
          <div className="search-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#666666"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" /></svg>
            <input
              type="search"
              className="job-search"
              placeholder="Search for jobs, companies, keywords..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
              aria-label="Search jobs"
            />
          </div>
        </div>
      </div>

      <div className="job-grid">

        {currentJobs.map((job) => (
          <JobCard key={job.id} job={job} featured={job.featured} />
        ))}
        {currentJobs.length === 0 && <p>No jobs found.</p>}
      </div>

      {totalPages > 1 && (
        <div className="job-pagination">
          <button
            className="job-page-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`job-page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="job-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            &gt;
          </button>
        </div>
      )}
    </section>
  );
};

export default JobGrid;
