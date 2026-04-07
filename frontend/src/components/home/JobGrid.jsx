import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Sparkles, X } from 'lucide-react';
import JobCard from './JobCard';
import { useAuth } from '../../context/AuthContext';
import jobService from '../../services/api/jobService';
import './JobGrid.css';
import aiService from '../../services/api/aiService';

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
  const [searchMode, setSearchMode] = useState('keyword');

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

  const handlePageChange = (page) => {
    fetchJobs(page);
    const element = document.getElementById('job-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (searchMode === 'semantic' && !token) {
      return;
    }

    const query = searchInput.trim();
    setSearchTerm(query);

    if (isAiSearchMode) {
      AIsemanticSearch(query);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setSearchMode('keyword');
  };

  const isAiSearchMode = searchMode === 'semantic';
  const isAiSearchLocked = isAiSearchMode && !token;
  const isAiModeSwitchLocked = !token && !isAiSearchMode;
  const searchPlaceholder = isAiSearchMode
    ? 'VD: Tìm công việc IT ở Đà Nẵng'
    : 'Tìm kiếm...';
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
        }
        catch (error) {
            console.error('Failed to perform AI semantic search', error);
        } finally {
          setLoading(false);
        }
      }, [fetchJobs]);
  const filteredJobs = useMemo(() => {
    if (isAiSearchMode) {
      return jobs;
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((job) => {
      const inTitle = job.position?.toLowerCase().includes(q);
      const inCompany = job.company?.toLowerCase().includes(q);
      const inLocation = job.location?.toLowerCase().includes(q);
      const inTags = Array.isArray(job.tags)
        ? job.tags.some((tag) => tag?.toLowerCase().includes(q))
        : false;

      return inTitle || inCompany || inLocation;
    });
  }, [jobs, isAiSearchMode, searchTerm]);

  return (
    <section className="job-grid-section" id="job-grid">
      <div className="job-grid-header">
        <div className="job-grid-title-copy">
          <h2>Việc Làm Mới Nhất & Nổi Bật</h2>
          <p>Tìm bằng từ khóa thường hoặc để AI hiểu ý định, kỹ năng và vị trí bạn muốn.</p>
        </div>

        <form className="search-filter" onSubmit={handleSearchSubmit}>
          <div className="search-wrap">
            <Search size={18} className="search-leading-icon" />
            <input
              type="search"
              className="job-search"
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Tìm kiếm việc làm"
            />
            {searchInput ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="search-actions">
            <button
              type="submit"
              className="search-submit-btn"
              disabled={isAiSearchLocked}
              title={
                isAiSearchLocked
                  ? 'Bạn cần đăng nhập để tìm kiếm AI'
                  : isAiSearchMode
                    ? 'Tìm kiếm AI'
                    : 'Tìm kiếm'
              }
            >
              {isAiSearchMode ? <Sparkles size={16} /> : <Search size={16} />}
              {isAiSearchMode ? 'AI Search' : 'Tìm kiếm'}
            </button>

            <button
              type="button"
              className={`search-mode-btn ${isAiSearchMode ? 'active' : ''}`}
              disabled={isAiModeSwitchLocked}
              title={
                isAiModeSwitchLocked
                  ? 'Bạn cần đăng nhập để chuyển sang AI Search'
                  : isAiSearchMode
                    ? 'Đang ở AI Search'
                    : 'Chuyển sang AI Search'
              }
              onClick={() => {
                if (isAiModeSwitchLocked) {
                  return;
                }

                setSearchMode((current) => (current === 'semantic' ? 'keyword' : 'semantic'));
              }}
            >
              {isAiSearchMode ? 'Đang ở AI Search' : 'Chuyển sang AI Search'}
            </button>
          </div>
        </form>
      </div>

      <div className="search-hint">
        <span className="search-hint-pill">AI</span>
        <span>Gợi ý: nhập mô tả tự nhiên như “tìm kiếm các công việc liên quan đến truyền thông”.</span>
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
            }

            if (index === pagination.page - 2 || index === pagination.page + 2) {
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
