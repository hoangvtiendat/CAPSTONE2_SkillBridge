import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    MapPin, Banknote, Tag, Clock,
    Trash2, ChevronLeft, Sparkles
} from 'lucide-react';
import './AdminJobDetail.css';
import DeleteConfirmPage from '../../components/admin/DeleteConfirmPage';
import { toast } from 'sonner';

const formatSalary = (amount) => {
    if (!amount && amount !== 0) return "Thỏa thuận";
    return new Intl.NumberFormat('vi-VN').format(amount) + " VND";
};
const API_BASE_URL = "http://localhost:8081/identity";

const AdminJobDetailPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        console.log("aaa: ", `${baseUrl}${cleanPath}`)
        return `${baseUrl}${cleanPath}`;
    };

    const fetchJobDetail = useCallback(async () => {
        try {
            const data = await jobService.getJobDetailByCandidate(jobId);
            setJob(data);
            const titleMap = data.title;

            if (titleMap && typeof titleMap === 'object') {
                const formatted = Object.entries(titleMap).map(([key, value]) => {
                    let itemsArray = [];
                    if (typeof value === 'string') {
                        itemsArray = value.split('\n')
                            .map(i => i.trim())
                            .filter(i => i !== "");
                    } else if (Array.isArray(value)) {
                        itemsArray = value;
                    }
                    return {
                        name: key,
                        items: itemsArray
                    };
                });
                setSections(formatted);
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

    const onUpdateStatus = async (e, newStatus) => {
        e.stopPropagation();
        const toastId = toast.loading("Đang cập nhật trạng thái...");
        try {
            await jobService.changeStatus(jobId, newStatus);
            await fetchJobDetail();
            toast.success("Cập nhật trạng thái bài đăng thành công", { id: toastId });
        } catch (error) {
            toast.error("Cập nhật trạng thái thất bại", { id: toastId });
        }
    };

    const onUpdateMod = async (e, newMod) => {
        e.stopPropagation();
        const toastId = toast.loading("Đang cập nhật kiểm duyệt...");
        try {
            await jobService.changeModerationStatus(jobId, newMod);
            await fetchJobDetail();
            toast.success("Cập nhật trạng thái kiểm duyệt thành công", { id: toastId });
        } catch (error) {
            toast.error("Cập nhật kiểm duyệt thất bại", { id: toastId });
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        const toastId = toast.loading("Đang xoá bài đăng...");
        try {
            await jobService.deleteJob(jobId);
            toast.success("Xoá bài đăng thành công", { id: toastId });
            navigate('/admin/jobs');
        } catch (error) {
            toast.error("Xoá thất bại", { id: toastId });
        } finally {
            setShowDeleteModal(false);
        }
    };

    if (loading) return <div className="admin-loader">Đang tải...</div>;
    if (!job) return <div className="admin-error">Không tìm thấy công việc</div>;

    return (
        <>
            <div className="admin-job-detail-container">
                <button className="btn-back-nav" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Quay lại
                </button>

                <div className="detail-card header-combined">
                    <div className="header-main-content">
                        <div className="company-info-section">
                            <img src={getImageUrl(job.companyImageUrl)} alt="logo" className="company-logo-large" />
                            <div className="job-title-info">
                                <h1>{job.jobTitle || "Chi tiết công việc"}</h1>
                                <div className="company-and-plan">
                                    <p className="company-name-text">{job.companyName}</p>
                                    <span className={`plan-badge plan-${(job.subscriptionPlanName || 'free').toLowerCase()}`}>
                                        {job.subscriptionPlanName || 'FREE'}
                                    </span>
                                </div>
                                <div className="job-meta-tags">
                                    <span><MapPin size={16} /> {job.location}</span>
                                    <span>
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

                        <div className="admin-action-bar side-panel">
                            <div className="control-item">
                                <label>Trạng thái</label>
                                <select
                                    value={job.status}
                                    onChange={(e) => onUpdateStatus(e, e.target.value)}
                                    className={`select-status s-${job.status?.toLowerCase()}`}
                                >
                                    <option value="OPEN">OPEN (Mở)</option>
                                    <option value="CLOSED">CLOSED (Đóng)</option>
                                    <option value="PENDING">PENDING (Đang chờ)</option>
                                </select>
                            </div>

                            <div className="control-item">
                                <label>Kiểm duyệt</label>
                                <div className={`mod-indicator mod-${job.moderationStatus}`}>
                                    <select
                                        value={job.moderationStatus}
                                        onChange={(e) => onUpdateMod(e, e.target.value)}
                                    >
                                        <option value="GREEN">GREEN (Duyệt)</option>
                                        <option value="YELLOW">YELLOW (Chờ)</option>
                                        <option value="RED">RED (Vi phạm)</option>
                                    </select>
                                </div>
                            </div>

                            <button onClick={handleDeleteClick} className="btn-delete-job">
                                <Trash2 size={18} /> XOÁ CÔNG VIỆC
                            </button>
                        </div>
                    </div>
                </div>

                <div className="detail-grid">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className="detail-card section animate-in"
                            style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                        >
                            <h3 className="section-title">
                                {section.name}
                            </h3>
                            <ul >
                                {section.items.map((item, idx) => (
                                    <li key={idx}>
                                        <div className="list-dot"></div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <DeleteConfirmPage
                isOpen={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
            />
        </>
    );
};

export default AdminJobDetailPage;