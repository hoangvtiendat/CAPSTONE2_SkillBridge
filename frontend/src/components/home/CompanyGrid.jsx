import React, {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {ChevronLeft, ChevronRight, Search} from 'lucide-react';
import companyService from '../../services/api/companyService';
import './CompanyGrid.css';

const API_BASE_URL = "http://localhost:8081/identity";
const CompanyGrid = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 6,
        totalElements: 0,
        totalPages: 0
    });
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        console.log("aaa: ", `${baseUrl}${cleanPath}`)
        return `${baseUrl}${cleanPath}`;
    };


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

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCompanies(0);
    };

    const handlePageChange = (page) => {
        fetchCompanies(page);
        const element = document.getElementById('company-grid');
        if (element) {
            element.scrollIntoView({behavior: 'smooth'});
        }
    };

    const handleCompanyClick = (companyId) => {
        navigate(`/companies/${companyId}`);
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
                                d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
                        </svg>
                        <input
                            type="search"
                            className="company-search-input"
                            placeholder="Tìm kiếm công ty theo tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{textAlign: 'center', padding: '100px 0'}}>Đang tải danh sách công ty...</div>
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
                                    {company.imageUrl ? (<img src={getImageUrl(company.imageUrl)} alt="logo"/>
                                    ) : 'C'}
                                </div>
                            </div>
                            <h3 className="company-name">{company.name}</h3>
                            <p className="company-desc">{company.description || "Chưa có mô tả."}</p>
                            <span className="company-jobs-count">{company.jobCount || 0} việc làm đang tuyển</span>
                        </div>
                    )) : (
                        <p style={{gridColumn: '1/-1', textAlign: 'center', padding: '100px 0'}}>Không tìm thấy công ty
                            nào.</p>
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
                        <ChevronLeft size={18}/>
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
                        <ChevronRight size={18}/>
                    </button>
                </div>
            )}
        </section>
    );
};

export default CompanyGrid;
