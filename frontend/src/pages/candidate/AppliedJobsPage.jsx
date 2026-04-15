import React, { useEffect, useState } from 'react';
import jobService from '../../services/api/jobService';
import { MapPin, DollarSign, Calendar, Building2, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AppliedJobsPage.css';
import { API_BASE_URL } from '../../config/appConfig';

const AppliedJobsPage = () => {
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const API_IMAGE_BASE = API_BASE_URL;

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await jobService.getAppliedJobs();
                setAppliedJobs(data);
            } catch (err) {
                console.error("Lỗi lấy danh sách:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const getStatusClass = (status) => {
        if (status === 'PENDING') return 'status-pending';
        if (status === 'HIRED') return 'status-hired';
        if (status === 'REJECTED') return 'status-rejected';
        return '';
    };

    const getLogoUrl = (logoPath) => {
        if (!logoPath) return 'https://via.placeholder.com/150?text=No+Logo';
        return logoPath.startsWith('http') ? logoPath : `${API_IMAGE_BASE}${logoPath}`;
    };

    const handleGoToBooking = (e, jobId) => {
        e.stopPropagation();
        navigate(`/interviews/book/${jobId}`);
    };

    if (loading) return (
        <div className="applied-loading">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
        </div>
    );

    return (
        <div className="applied-container">
            <div className="applied-header">
                <h1 className="applied-title">Việc làm đã ứng tuyển</h1>
                <p className="applied-subtitle">Bạn đã nộp <strong>{appliedJobs.length}</strong> hồ sơ</p>
            </div>

            <div className="job-grid">
                {appliedJobs.map((item) => (
                    <div
                        key={item.applicationId}
                        className="job-card-item"
                        onClick={() => navigate(`/jobs/${item.jobId}`)}
                    >
                        {/* Nhóm Badge và Nút ở góc phải */}
                        <div className="card-top-right">
                            <span className={`status-badge-v2 ${getStatusClass(item.status)}`}>
                                {item.status}
                            </span>

                            <button
                                className="btn-book-icon-v3"
                                onClick={(e) => handleGoToBooking(e, item.jobId)}
                                title="Đặt lịch phỏng vấn"
                            >
                                <Video size={14} />
                            </button>
                        </div>

                        <div className="job-logo-v2">
                            <img
                                src={getLogoUrl(item.companyLogo)}
                                alt={item.companyName}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                            />
                        </div>

                        <div className="job-content-v2">
                            <h3 className="job-position-v2" title={item.jobPosition}>
                                {item.jobPosition}
                            </h3>

                            <div className="job-company-v2 text-truncate">
                                <Building2 size={14} />
                                <span>{item.companyName}</span>
                            </div>

                            <div className="job-meta-v2">
                                <div className="meta-row">
                                    <MapPin size={14} /> <span>{item.location}</span>
                                </div>
                                <div className="meta-row salary">
                                    <DollarSign size={14} />
                                    <span>{item.salaryMin.toLocaleString()} - {item.salaryMax.toLocaleString()}</span>
                                </div>
                                <div className="meta-row date">
                                    <Calendar size={14} />
                                    <span>{new Date(item.appliedAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppliedJobsPage;