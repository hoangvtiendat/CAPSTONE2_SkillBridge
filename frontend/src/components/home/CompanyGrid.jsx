import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import companyService from '../../services/api/companyService';
import './CompanyGrid.css';
import AppImage from '../common/AppImage';
import { DEFAULT_COMPANY_IMAGE } from '../../utils/imageUtils';
import AppPagination from '../common/AppPagination';
import FilterResetButton from '../common/FilterResetButton';
import '../../components/admin/Admin.css';
const CompanyGrid = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 8,
        totalElements: 0,
        totalPages: 0
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCompanies = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const data = await companyService.getFeed({
                page,
                limit: pagination.size,
                keyword: searchTerm
            });
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
    }, [pagination.size, searchTerm]);

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

    const handleCompanyClick = (companyId) => {
        navigate(`/companies/${companyId}`);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        fetchCompanies(0);
    };

    return (
        <section className="company-grid-section" id="company-grid">
            <div className="company-grid-header">
                <h2>Các Công Ty Hàng Đầu</h2>
                <div className="company-search-filter">
                    <div className="company-search-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                            fill="#666666">
                            <path
                                d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                        </svg>
                        <input
                            type="search"
                            className="company-search-input"
                            placeholder="Tìm kiếm công ty theo tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <FilterResetButton onClick={handleResetFilters} disabled={loading} />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>Đang tải danh sách công ty...</div>
            ) : (
                <div className="company-grid">
                    {companies.length > 0 ? companies.map(company => (
                        <div
                            key={company.id}
                            className="company-card"
                            onClick={() => handleCompanyClick(company.id)}
                        >
                            <div className="company-grid-logo-wrapper">
                                <div className="company-grid-logo">
                                    <AppImage
                                        src={company.imageUrl}
                                        fallbackSrc={DEFAULT_COMPANY_IMAGE}
                                        alt={company.name || 'Company'}
                                    />
                                </div>
                            </div>
                            <h3 className="company-name">{company.name}</h3>
                            <p className="company-desc">{company.description || "Chưa có mô tả."}</p>
                            <span className="company-jobs-count">{company.jobCount || 0} việc làm đang tuyển</span>
                        </div>
                    )) : (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>Không tìm thấy công ty
                            nào.</p>
                    )}
                </div>
            )}

            <AppPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                zeroBased
                summary={<>Tổng <b>{pagination.totalElements}</b> công ty</>}
            />
        </section>
    );
};

export default CompanyGrid;
