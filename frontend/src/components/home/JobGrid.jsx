import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import JobCard from './JobCard';
import { useAuth } from '../../context/AuthContext';
import jobService from '../../services/api/jobService';
import aiService from '../../services/api/aiService';
import './JobGrid.css';
import AppPagination from '../common/AppPagination';
import FilterResetButton from '../common/FilterResetButton';
import '../../components/admin/Admin.css';

const JobGrid = () => {
  const { token } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    size: 6,
    totalElements: 0,
    totalPages: 0
  });

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('keyword'); // keyword | semantic

  /* ================= FETCH JOB ================= */
  const fetchJobs = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const data = await jobService.getFeed({
        page,
        limit: pagination.size
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
      console.error('Failed to fetch jobs', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.size]);

  useEffect(() => {
    fetchJobs(0);
  }, [fetchJobs]);

  /* ================= PAGINATION ================= */
  const handlePageChange = (page) => {
    fetchJobs(page);
    const element = document.getElementById('job-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /* ================= AI SEARCH ================= */
  const AIsemanticSearch = useCallback(async (query) => {
    if (!query) {
      fetchJobs(0);
      return;
    }

    setLoading(true);
    try {
      const data = await aiService.semanticSearch(query);

      if (data) {
        setJobs(data);
        setPagination(prev => ({
          ...prev,
          page: 0,
          totalElements: data.length,
          totalPages: 1
        }));
      }
    } catch (error) {
      console.error('Failed to perform AI semantic search', error);
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  /* ================= SEARCH ================= */
  const isAiSearchMode = searchMode === 'semantic';
  const isAiSearchLocked = isAiSearchMode && !token;
  const isAiModeSwitchLocked = !token && !isAiSearchMode;

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = searchInput.trim();
    setSearchTerm(query);

    if (isAiSearchMode) {
      if (!token) return;
      AIsemanticSearch(query);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setSearchMode('keyword');
    fetchJobs(0);
  };

  /* ================= FILTER ================= */
  const filteredJobs = useMemo(() => {
    if (isAiSearchMode) return jobs;

    const q = searchTerm.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((job) => {
      const inTitle = job.position?.toLowerCase().includes(q);
      const inCompany = job.company?.toLowerCase().includes(q);
      const inLocation = job.location?.toLowerCase().includes(q);
      const inTags = Array.isArray(job.tags)
          ? job.tags.some(tag => tag?.toLowerCase().includes(q))
          : false;

      return inTitle || inCompany || inLocation || inTags;
    });
  }, [jobs, searchTerm, isAiSearchMode]);

  const searchPlaceholder = isAiSearchMode
      ? 'VD: Tìm công việc IT ở Đà Nẵng'
      : 'Tìm kiếm việc làm';

  return (
      <section className="job-grid-section" id="job-grid">

        {/* ================= HEADER ================= */}
        <div className="job-grid-header">
          <div className="job-grid-title-copy">
            <h2>Việc Làm Mới Nhất & Nổi Bật</h2>
            <p>Tìm bằng từ khóa hoặc để AI hiểu nhu cầu của bạn.</p>
          </div>

          <form className="search-filter" onSubmit={handleSearchSubmit}>
            <div className="search-wrap">
              <Search size={18} />
              <input
                  type="search"
                  className="job-search"
                  placeholder={searchPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
              />

              {searchInput && (
                  <button type="button" onClick={handleClearSearch}>
                    <X size={16} />
                  </button>
              )}
            </div>

            <div className="search-actions">
              <button
                  type="submit"
                  disabled={isAiSearchLocked}
                  className="search-submit-btn"
              >
                {isAiSearchMode ? <Sparkles size={16} /> : <Search size={16} />}
                {isAiSearchMode ? 'AI Search' : 'Tìm kiếm'}
              </button>

              <button
                  type="button"
                  className={`search-mode-btn ${isAiSearchMode ? 'active' : ''}`}
                  disabled={isAiModeSwitchLocked}
                  onClick={() =>
                      setSearchMode(prev => prev === 'semantic' ? 'keyword' : 'semantic')
                  }
              >
                {isAiSearchMode ? 'Đang AI Search' : 'Bật AI Search'}
              </button>

              <FilterResetButton onClick={handleClearSearch} disabled={loading} />
            </div>
          </form>
        </div>

        {/* ================= HINT ================= */}
        <div className="search-hint">
          <span className="search-hint-pill">AI</span>
          <span>Gợi ý: “tìm việc frontend React ở Đà Nẵng lương cao”</span>
        </div>

        {/* ================= JOB LIST ================= */}
        <div className="job-grid">
          {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
                <p>Đang tải việc làm...</p>
              </div>
          ) : filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                  <JobCard key={job.id} job={job} featured={job.featured} />
              ))
          ) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
                <p>Không tìm thấy việc làm nào.</p>
              </div>
          )}
        </div>

        {/* ================= PAGINATION ================= */}
        {!isAiSearchMode && (
            <AppPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                zeroBased
                summary={<>Tổng <b>{pagination.totalElements}</b> việc làm</>}
            />
        )}
      </section>
  );
};

export default JobGrid;