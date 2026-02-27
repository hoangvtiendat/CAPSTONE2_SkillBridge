import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    MapPin, Banknote, Tag, Clock,
    Trash2, ChevronLeft
} from 'lucide-react';
import './AdminJobDetail.css';
import DeleteConfirmPage from '../../components/admin/DeleteConfirmPage';
import { toast, Toaster } from 'sonner'

const AdminJobDetailPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(true);

    // State quản lý Modal xóa
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchJobDetail = useCallback(async () => {
        try {
            const data = await jobService.getJobDetail(jobId);
            setJob(data);

            if (data.title) {
                let rawTitle = data.title;
                if (typeof rawTitle === 'string') {
                    try {
                        rawTitle = JSON.parse(rawTitle);
                    } catch (e) {
                        toast.error("Lỗi parse chuỗi title");
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
        const toastId = toast.loading("Đang xoá công việc...");
        try {
            await jobService.deleteJob(jobId);
            toast.success("Xoá công việc thành công", { id: toastId });
            navigate('/admin/jobs');
        } catch (error) {
            toast.error("Xoá thất bại", { id: toastId });
        } finally {
            setShowDeleteModal(false);
        }
    };

    if (loading) return <div className="admin-loader">Đang tải...</div>;
    if (!job) return <div className="admin-error">Không tìm thấy công việc</div>;

    const headerInfo = parsedData[0] || {};
    const contentSections = parsedData.slice(1);

    return (
        <>
            <div className="admin-job-detail-container">
                <Toaster position="top-right" richColors closeButton />
                <button className="btn-back-nav" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Quay lại
                </button>

                <div className="detail-card header-combined">
                    <div className="header-main-content">
                        <div className="company-info-section">
                            <img
                                src={job.companyImageUrl || '/default-logo.png'}
                                alt="logo"
                                className="company-logo-large"
                            />
                            <div className="job-title-info">
                                <h1>{headerInfo.name || job.jobTitle}</h1>
                                <div className="company-and-plan">
                                    <p className="company-name-text">{job.companyName}</p>
                                    <span className={`plan-badge plan-${job.subscriptionPlanName?.toLowerCase()}`}>
                                        {job.subscriptionPlanName}
                                    </span>
                                </div>
                                <div className="job-meta-tags">
                                    <span><MapPin size={16} /> {job.location}</span>
                                    <span><Banknote size={16} /> {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()} VND</span>
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
                                    <option value="OPEN">OPEN</option>
                                    <option value="CLOSED">CLOSED</option>
                                    <option value="PENDING">PENDING</option>
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
                    {contentSections.map((section, index) => (
                        <div key={index} className="detail-card section">
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

            <DeleteConfirmPage
                isOpen={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
            />
        </>
    );
};

export default AdminJobDetailPage;