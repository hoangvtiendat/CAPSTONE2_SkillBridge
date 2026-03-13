import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import companyService from '../../services/api/companyService';
import './CompanyGrid.css';

const CompanyGrid = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 6,
        totalElements: 0,
        totalPages: 0
    });

    const fetchCompanies = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const data = await companyService.getFeed({ page, limit: pagination.size });
            if (data) {
                setCompanies(data.companies || []);
                setPagination(prev => ({
                    ...prev,
                    page: data.currentPage,
                    totalElements: data.totalElements,
                    totalPages: data.totalPages
                }));
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.size]);

    useEffect(() => {
        fetchCompanies(0);
    }, [fetchCompanies]);

    const handlePageChange = (page) => {
        fetchCompanies(page);
        const element = document.getElementById('company-grid');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="company-grid-section" id="company-grid">
            <div className="company-grid-header">
                <h2>Các công ty hàng đầu</h2>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>Loading companies...</div>
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
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>No companies found.</p>
                    )}
                </div>
            )}

            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        disabled={pagination.page === 0}
                        onClick={() => handlePageChange(pagination.page - 1)}
                        title="Trang trước"
                    >
                        <ChevronLeft size={18} />
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
                                    className={`page-btn ${pagination.page === index ? 'active' : ''}`}
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
                        className="page-btn"
                        disabled={pagination.page >= pagination.totalPages - 1}
                        onClick={() => handlePageChange(pagination.page + 1)}
                        title="Trang sau"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </section>
    );
};

export default CompanyGrid;
