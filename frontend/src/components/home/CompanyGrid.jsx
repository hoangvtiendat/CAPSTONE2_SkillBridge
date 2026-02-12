import React, { useState, useEffect } from 'react';
import companyService from '../../services/api/companyService';
import './CompanyGrid.css';

const ITEMS_PER_PAGE = 6;

const CompanyGrid = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCompanies = async (page) => {
        setLoading(true);
        try {
            const data = await companyService.getFeed({ page, limit: ITEMS_PER_PAGE });
            // Assuming data structure: { result: { content: [...], totalPages: ... } } 
            // OR { result: [...] } if no pagination metadata
            // Adjust based on actual API response
            if (data && data.result) {
                if (Array.isArray(data.result)) {
                    setCompanies(data.result);
                    // If just a list, handle client-side calc if needed, or assume all returned?
                    // If backend implements pagination but just returns list for that page:
                    setCompanies(data.result);
                    // We might miss totalPages info if not provided
                    setTotalPages(Math.ceil(data.result.length / ITEMS_PER_PAGE) || 1); // Fallback
                } else if (data.result.content) {
                    setCompanies(data.result.content);
                    setTotalPages(data.result.totalPages || 1);
                }
            } else if (Array.isArray(data)) {
                setCompanies(data);
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies(currentPage);
    }, [currentPage]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <section className="company-grid-section" id="company-grid">
            <div className="company-grid-header">
                <h2>Top Companies Hiring</h2>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : (
                <div className="company-grid">
                    {companies.length > 0 ? companies.map(company => (
                        <div key={company.id} className="company-card">
                            <div className="company-grid-logo-wrapper">
                                <div className="company-grid-logo">
                                    {company.name ? company.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                            </div>
                            <h3 className="company-name">{company.name}</h3>
                            <p className="company-desc">{company.description || "No description available."}</p>
                            <span className="company-jobs-count">{company.jobCount || 0} Open Jobs</span>
                        </div>
                    )) : (
                        <p>No companies found.</p>
                    )}
                </div>
            )}

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => handlePageChange(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        className="page-btn"
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

export default CompanyGrid;
