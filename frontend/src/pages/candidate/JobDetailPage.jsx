import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    MapPin, Banknote, Tag, Clock,
    ChevronLeft, Building2, Send, Sparkles, AlertCircle, X, FileText, CheckCircle2
} from 'lucide-react';
import './JobDetail.css';
import { toast, Toaster } from 'sonner';

// CHỈNH LẠI DÒNG NÀY: Import useAuth thay vì AuthContext
import { useAuth } from '../../context/AuthContext';

const formatSalary = (amount) => {
    if (!amount && amount !== 0) return "Thỏa thuận";
    return new Intl.NumberFormat('vi-VN').format(amount) + " VND";
};

const JobDetailPage = () => {
    const { user } = useAuth(); // Bây giờ dòng này chạy ngon lành
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cvFile, setCvFile] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        numberPhone: '',
        recommendationLetter: ''
    });

    // Đồng bộ dữ liệu từ Auth vào Form
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.fullName || user.name || '',
                email: user.email || '',
                numberPhone: user.phoneNumber || ''
            }));
        }
    }, [user]);

    const fetchJobDetail = useCallback(async () => {
        try {
            const data = await jobService.getJobDetailByCandidate(jobId);
            setJob(data);
            if (data.title) {
                let rawTitle = data.title;
                try {
                    rawTitle = typeof rawTitle === 'string' ? JSON.parse(rawTitle) : rawTitle;
                } catch (e) { rawTitle = []; }
                setParsedData(Array.isArray(rawTitle) ? rawTitle : []);
            }
        } catch (error) {
            toast.error("Không thể tải chi tiết công việc");
        } finally {
            setLoading(false);
        }
    }, [jobId]);
    const handleApplyClick = () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để ứng tuyển!");
            navigate('/login'); // Hoặc lưu lại trang hiện tại để sau khi login thì quay lại đây
            return;
        }
        setShowApplyModal(true);
    };
    useEffect(() => {
        fetchJobDetail();
    }, [fetchJobDetail]);

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!cvFile) return toast.error("Vui lòng tải lên bản CV (PDF)");

        setSubmitting(true);
        const data = new FormData();

        const jsonRequest = {
            name: formData.name,
            email: formData.email,
            numberPhone: formData.numberPhone,
            recommendationLetter: formData.recommendationLetter
        };
        const jsonBlob = new Blob([JSON.stringify(jsonRequest)], { type: 'application/json' });
        data.append('request', jsonBlob);
        data.append('cv', cvFile);

        try {
            // ĐỔI LẠI THÀNH accessToken cho khớp với AuthContext của ông
            const token = localStorage.getItem('accessToken');

            const response = await axios.post(
                `http://localhost:8081/identity/jobs/${jobId}/apply`,
                data,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.code === 8001) {
                toast.warning(response.data.message);
            } else {
                toast.success("Nộp hồ sơ thành công!");
                setShowApplyModal(false);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi hệ thống khi nộp hồ sơ";
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

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
                            <img src={job.companyImageUrl || '/default-logo.png'} alt="logo" className="company-logo-large" />
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

                        <div className="candidate-action-panel side-panel">
                            <button
                                className={`btn-apply-primary ${isClosed ? 'btn-disabled' : ''}`}
                                disabled={isClosed}
                                onClick={handleApplyClick}
                            >
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

                <div className="detail-grid">
                    {contentSections.map((section, index) => (
                        <div key={index} className="detail-card section animate-in" style={{animationDelay: `${(index + 1) * 0.1}s`}}>
                            <h3>{section.name}</h3>
                            <ul className="check-list">
                                {(section.decription || section.Decription)?.map((item, idx) => (
                                    <li key={idx}><span>{item}</span></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MODAL FORM ỨNG TUYỂN --- */}
            {showApplyModal && (
                <div className="apply-modal-overlay">
                    <div className="apply-modal-content animate-in">
                        <div className="apply-modal-header">
                            <div className="header-title">
                                <CheckCircle2 className="text-blue-600" size={24} />
                                <h2>Nộp hồ sơ ứng tuyển</h2>
                            </div>
                            <button className="close-x" onClick={() => setShowApplyModal(false)}><X /></button>
                        </div>

                        <p className="modal-subtitle">Bạn đang ứng tuyển vị trí <strong>{headerInfo.name}</strong> tại <strong>{job.companyName}</strong></p>

                        <form onSubmit={handleApplySubmit} className="apply-form-body">
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Họ và tên *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        readOnly // Không cho sửa
                                        className="input-readonly" // Thêm style xám nhẹ ở CSS
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Email liên hệ *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        readOnly // Không cho sửa
                                        className="input-readonly"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Số điện thoại *</label>
                                    <input
                                        type="text"
                                        placeholder="Nhập số điện thoại..."
                                        value={formData.numberPhone}
                                        onChange={(e) => setFormData({...formData, numberPhone: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>CV ứng tuyển (PDF) *</label>
                                    <div className="file-drop-zone">
                                        <input
                                            type="file"
                                            id="cv-file"
                                            accept=".pdf"
                                            onChange={(e) => setCvFile(e.target.files[0])}
                                            hidden
                                        />
                                        <label htmlFor="cv-file" className="file-upload-label">
                                            <FileText className={cvFile ? "text-green-500" : "text-gray-400"}/>
                                            <span>{cvFile ? cvFile.name : "Nhấn để chọn file CV của bạn"}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="input-group full-width">
                                <label>Thư giới thiệu (Không bắt buộc)</label>
                                <textarea
                                    rows="4"
                                    placeholder="Chia sẻ thêm về kinh nghiệm hoặc lý do bạn phù hợp..."
                                    value={formData.recommendationLetter}
                                    onChange={(e) => setFormData({...formData, recommendationLetter: e.target.value})}
                                ></textarea>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowApplyModal(false)}>
                                    HỦY BỎ
                                </button>
                                <button type="submit" className="btn-submit-apply" disabled={submitting}>
                                    {submitting ? "ĐANG GỬI..." : "GỬI HỒ SƠ NGAY"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetailPage;