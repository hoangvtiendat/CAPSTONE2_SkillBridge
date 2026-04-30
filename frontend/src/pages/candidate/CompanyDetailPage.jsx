import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    Building2,
    MapPin,
    Globe,
    Calendar,
    Loader2,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    CheckCircle2
} from 'lucide-react';
import companyService from '../../services/api/companyService';
import jobService from '../../services/api/jobService';
import categoryJDService from '../../services/api/categoryJD';
import JobCard from '../../components/home/JobCard';
import './CompanyDetailPage.css';
import Sidebar from "../../components/home/Sidebar";

const API_BASE_URL = "http://localhost:8081/identity";

const CompanyDetailPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [loadingJobs, setLoadingJobs] = useState(true);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        console.log("aaa: ", `${baseUrl}${cleanPath}`)
        return `${baseUrl}${cleanPath}`;
    };
    const [pagination, setPagination] = useState({
        page: 0,
        size: 6,
        totalPages: 0,
        totalElements: 0
    });

    useEffect(() => {
        const fetchCompanyDetails = async () => {
            setLoadingCompany(true);
            try {
                const response = await companyService.getCompanyById(id);
                if (response.data && response.data.result) {
                    setCompany(response.data.result);
                }
            } catch (error) {
                console.error("Failed to fetch company details:", error);
            } finally {
                setLoadingCompany(false);
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await categoryJDService.getListCategories();
                const data = response?.data?.data || response?.data || response || [];
                setCategories(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };

        if (id) {
            fetchCompanyDetails();
            fetchCategories();
            fetchCompanyJobs(0, []);
        }
    }, [id]);

    const fetchCompanyJobs = async (page = 0, currentSelectedCategories = selectedCategories) => {
        setLoadingJobs(true);
        try {
            const data = await jobService.getJobsByCompany(id, {
                page,
                limit: pagination.size,
                categoryIds: currentSelectedCategories
            });
            if (data) {
                setJobs(data.jobs || []);
                setPagination(prev => ({
                    ...prev,
                    page: data.currentPage,
                    totalPages: data.totalPages,
                    totalElements: data.totalElements
                }));
            }
        } catch (error) {
            console.error("Failed to fetch jobs by company:", error);
        } finally {
            setLoadingJobs(false);
        }
    };

    const handleCategoryToggle = (categoryId) => {
        const newSelected = selectedCategories.includes(categoryId)
            ? selectedCategories.filter(id => id !== categoryId)
            : [...selectedCategories, categoryId];

        setSelectedCategories(newSelected);
        fetchCompanyJobs(0, newSelected);
    };

    const handlePageChange = (newPage) => {
        fetchCompanyJobs(newPage);
        const element = document.getElementById('company-jobs-section');
        if (element) {
            element.scrollIntoView({behavior: 'smooth'});
        }
    };

    if (loadingCompany) {
        return (
            <div className="company-detail-loading">
                <Loader2 className="animate-spin" size={48}/>
                <p>Đang tải thông tin công ty...</p>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="company-detail-error">
                <Building2 size={64} style={{opacity: 0.5, marginBottom: '16px'}}/>
                <h3>Không tìm thấy công ty</h3>
                <p>Công ty này có thể không tồn tại hoặc đã bị xóa.</p>
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ChevronLeft size={20}/>
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="company-detail-page animate-fade-in">

            <div className="company-header-banner">
                <div className="company-banner-inner">
                    <button onClick={() => navigate(-1)} className="btn-banner-back">
                        <ChevronLeft size={16}/> Quay lại
                    </button>

                    <div className="company-banner-content">
                        <div className="company-banner-logo">
                            {company.imageUrl ? (
                                <img src={getImageUrl(company.imageUrl)} alt="logo"/>
                            ) : (
                                <span>{company.name ? company.name.charAt(0).toUpperCase() : 'C'}</span>
                            )}
                        </div>


                        <div className="company-banner-text">
                            <h1 className="company-banner-title">
                                {company.name}
                                {company.status === 'ACTIVE' && (
                                    <CheckCircle2 size={24} className="company-verified-icon-white"/>
                                )}
                            </h1>
                            <div className="company-banner-tags">
                                <span className="banner-tag">Tập đoàn đa ngành</span>
                                <span className="banner-tag"><Calendar size={14}/> Thành lập 1993</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="company-detail-container">
                <div className="company-info-cards-row">
                    <div className="info-card-modern">
                        <div className="info-card-header"><MapPin size={16} className="info-icon blue"/> Địa điểm</div>
                        <div className="info-card-value">{company.address || "Chưa cập nhật"}</div>
                    </div>

                    <div className="info-card-modern">
                        <div className="info-card-header"><Building2 size={16} className="info-icon blue"/> Quy mô</div>
                        <div className="info-card-value">50,000+ nhân viên</div>
                    </div>

                    <div className="info-card-modern">
                        <div className="info-card-header"><Globe size={16} className="info-icon blue"/> Website</div>
                        {company.websiteUrl ? (
                            <a href={company.websiteUrl.startsWith('http') ? company.websiteUrl : `https://${company.websiteUrl}`}
                               target="_blank" rel="noopener noreferrer" className="info-card-value link">
                                {company.websiteUrl.replace(/^https?:\/\//, '')}
                            </a>
                        ) : (
                            <div className="info-card-value">Chưa cập nhật</div>
                        )}
                    </div>
                </div>

                <div className="company-content-grid">
                    <div className="company-main-content">
                        <div className="company-section">
                            <h2 className="section-title">Giới thiệu công ty</h2>
                            <div className="company-description-html">
                                {company.description ? (
                                    <div dangerouslySetInnerHTML={{__html: company.description}}/>
                                ) : (
                                    <p className="empty-text">Chưa có thông tin giới thiệu.</p>
                                )}
                            </div>
                        </div>

                        <div className="company-section" id="company-jobs-section">
                            <h2 className="section-title">
                                <Briefcase size={20} className="section-icon blue"/> Vị trí đang tuyển
                                ({pagination.totalElements})
                            </h2>

                            <div className="company-jobs-layout">
                                <div className="company-jobs-sidebar">
                                    <div className="filter-card">
                                        <h3 className="filter-title">Ngành nghề</h3>
                                        <div className="filter-checkbox-list">
                                            {categories.map(cat => {
                                                const catId = cat.id || cat._id || cat.categoryId;
                                                const catName = cat.name || cat.categoryName;
                                                return (
                                                    <label key={catId} className="filter-checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategories.includes(catId)}
                                                            onChange={() => handleCategoryToggle(catId)}
                                                            className="filter-checkbox"
                                                        />
                                                        <span className="filter-checkbox-text">{catName}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="company-jobs-content">
                                    {loadingJobs ? (
                                        <div className="jobs-loading">
                                            <Loader2 className="animate-spin" size={32}/>
                                            <p>Đang tải danh sách việc làm...</p>
                                        </div>
                                    ) : jobs.length > 0 ? (
                                        <>
                                            <div className="company-jobs-grid">
                                                {jobs.map(job => (
                                                    <JobCard key={job.id} job={job}/>
                                                ))}
                                            </div>

                                            {pagination.totalPages > 1 && (
                                                <div className="job-pagination">
                                                    <button
                                                        disabled={pagination.page === 0}
                                                        onClick={() => handlePageChange(pagination.page - 1)}
                                                        className="job-page-btn"
                                                    >
                                                        <ChevronLeft size={20}/>
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
                                                            return <span key={index}
                                                                         className="pagination-ellipsis">...</span>;
                                                        }
                                                        return null;
                                                    })}

                                                    <button
                                                        disabled={pagination.page >= pagination.totalPages - 1}
                                                        onClick={() => handlePageChange(pagination.page + 1)}
                                                        className="job-page-btn"
                                                    >
                                                        <ChevronRight size={20}/>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="empty-state">
                                            <Briefcase size={48} className="empty-icon"/>
                                            <p>Công ty hiện chưa có việc làm nào đang mở.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetailPage;
