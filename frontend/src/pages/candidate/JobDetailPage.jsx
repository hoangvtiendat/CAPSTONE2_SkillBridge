import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    MapPin, Banknote, Tag, Clock,
    ChevronLeft, Building2, Send, Sparkles, AlertCircle
} from 'lucide-react';
import './JobDetail.css';
import { toast, Toaster } from 'sonner';

const formatSalary = (amount) => {
    if (!amount && amount !== 0) return "Thỏa thuận";
    return new Intl.NumberFormat('vi-VN').format(amount) + " VND";
};

const JobDetailPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobDetail = useCallback(async () => {
        try {
            const data = await jobService.getJobDetailByCandidate(jobId);
            setJob(data);

            if (data.title) {
                let rawTitle = data.title;
                if (typeof rawTitle === 'string') {
                    try {
                        rawTitle = JSON.parse(rawTitle);
                    } catch (e) {
                        rawTitle = [];
                    }
                }
                setParsedData(Array.isArray(rawTitle) ? rawTitle : []);
            }
        } catch (error) {
            toast.error("Không thể tải chi tiết công việc");
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchJobDetail();
    }, [fetchJobDetail]);

    if (loading) return (
        <div className="candidate-loader-container">
            <div className="loader-spinner"></div>
            <p>Đang chuẩn bị cơ hội cho bạn...</p>
        </div>
    );

    if (!job) return <div className="candidate-error">Rất tiếc, công việc này không còn tồn tại.</div>;

    const headerInfo = parsedData[0] || {};
    const contentSections = parsedData.slice(1);
    const isClosed = job.status === 'CLOSED';

    return (
        <div className="candidate-job-detail-wrapper">
            <Toaster position="top-right" richColors />

            <div className="container">
                <button className="btn-back-nav" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Quay lại danh sách
                </button>
                <div className="detail-card header-combined animate-in">
                    <div className="header-main-content">
                        <div className="company-info-section">
                            <img
                                src={job.companyImageUrl || '/default-logo.png'}
                                alt="logo"
                                className="company-logo-large"
                            />
                            <div className="job-title-info">
                                <div className="title-status-row">
                                    <h1>{headerInfo.name || job.jobTitle}</h1>
                                    <span className={`status-badge ${isClosed ? 'status-closed' : 'status-open'}`}>
                                        {isClosed ? <AlertCircle size={14} /> : <Clock size={14} />}
                                        {isClosed ? 'Hết hạn' : 'Đang mở'}
                                    </span>
                                </div>

                                <div className="company-and-plan">
                                    <p className="company-name-text" onClick={() => navigate(`/companies/${job.companyId}`)}>
                                        <Building2 size={18} style={{marginRight: '6px'}}/>
                                        {job.companyName}
                                    </p>
                                </div>

                                <div className="job-meta-tags">
                                    <span><MapPin size={16} /> {job.location}</span>
                                    <span className="salary-tag">
                                        <Banknote size={16} />
                                        {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}
                                    </span>
                                    <span><Tag size={16} /> {job.categoryName}</span>
                                    <span className="time-tag">
                                        <Clock size={16} /> {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: vi })}
                                    </span>
                                </div>

                                <div className="skills-tags-container inline-skills">
                                    {job.skills?.map((s, index) => (
                                        <span key={index} className="skill-tag">{s.skillName || s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Panel - Giống Admin nhưng cho Candidate */}
                        <div className="candidate-action-panel side-panel">
                            <button className={`btn-apply-primary ${isClosed ? 'btn-disabled' : ''}`} disabled={isClosed}>
                                <Send size={18} /> {isClosed ? 'NGỪNG NHẬN HỒ SƠ' : 'ỨNG TUYỂN NGAY'}
                            </button>

                            <button className="btn-ai-sparkle">
                                <Sparkles size={18} /> ĐÁNH GIÁ PHÙ HỢP (AI)
                            </button>

                            <div className="safety-note">
                                <AlertCircle size={14} />
                                <span>Không nộp phí cho nhà tuyển dụng</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="detail-grid">
                    {contentSections.map((section, index) => (
                        <div key={index} className="detail-card section animate-in" style={{animationDelay: `${(index + 1) * 0.1}s`}}>
                            <h3>{section.name}</h3>
                            <ul className="check-list">
                                {(section.decription || section.Decription)?.map((item, idx) => (
                                    <li key={idx}>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default JobDetailPage;