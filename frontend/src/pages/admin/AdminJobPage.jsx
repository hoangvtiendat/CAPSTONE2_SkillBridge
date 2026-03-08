import React, { useState, useEffect, useCallback, useRef } from 'react';
import jobService from '../../services/api/jobService';
import './AdminJob.css';
import DeleteConfirmPage from '../../components/admin/DeleteConfirmPage';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from "sonner";
import { MapPin, RotateCcw } from 'lucide-react';

const AdminJobPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [filters, setFilters] = useState({ status: '', modStatus: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const navigate = useNavigate();

    const observerTarget = useRef(null);

    const loadJobs = useCallback(async (isMore = false, currentCursor = null) => {
        if (loading) return;
        setLoading(true);
        try {
            const data = await jobService.getAdminJobs({
                cursor: currentCursor,
                status: filters.status,
                modStatus: filters.modStatus
            });

            setJobs(prev => {
                const newJobs = data.jobs;
                if (!isMore) return newJobs;
                const existingIds = new Set(prev.map(j => j.id));
                const uniqueNewJobs = newJobs.filter(j => !existingIds.has(j.id));
                return [...prev, ...uniqueNewJobs];
            });

            setCursor(data.nextCursor);
        } catch (err) {
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.modStatus]);

    useEffect(() => {
        setCursor(null);
        loadJobs(false, null);
    }, [filters.status, filters.modStatus]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && cursor && !loading) {
                    loadJobs(true, cursor);
                }
            },
            { threshold: 0.1 }
        );
        const currentTarget = observerTarget.current;
        if (currentTarget) observer.observe(currentTarget);
        return () => { if (currentTarget) observer.disconnect(); };
    }, [loadJobs, cursor, loading]);

    const handleResetFilters = () => {
        setFilters({ status: '', modStatus: '' });
    };

    const handleAction = async (id, type, value) => {
        if (type === 'delete') {
            setJobToDelete(id);
            setShowDeleteModal(true);
            return;
        }
        const toastId = toast.loading("Đang cập nhật...");
        try {
            if (type === 'moderate') {
                await jobService.changeModerationStatus(id, value);
                const updated = await jobService.getJobDetail(id);
                setJobs(prev => prev.map(j => j.id === id ? {
                    ...j,
                    moderationStatus: updated.moderationStatus,
                    status: updated.status
                } : j));
                toast.success("Cập nhật kiểm duyệt thành công", { id: toastId });
            } else if (type === 'status') {
                await jobService.changeStatus(id, value);
                setJobs(prev => prev.map(j => j.id === id ? { ...j, status: value } : j));
                toast.success("Cập nhật trạng thái thành công", { id: toastId });
            }
        } catch (err) {
            toast.error("Thất bại!", { id: toastId });
        }
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;
        const toastId = toast.loading("Đang xóa...");
        try {
            await jobService.deleteJob(jobToDelete);
            setJobs(prev => prev.filter(j => j.id !== jobToDelete));
            setShowDeleteModal(false);
            setJobToDelete(null);
            toast.success("Xóa bài đăng thành công", { id: toastId });
        } catch (err) {
            toast.error("Xóa bài đăng thất bại!");
        }
    };

    return (
        <div className="admin-container">
            <Toaster position="top-right" richColors closeButton />
            <header className="admin-header">
                <div className="header-title">
                    <h2>Quản lý Tuyển dụng</h2>
                    <span className="count-tag">{jobs.length} hiển thị</span>
                </div>

                <div className="filter-shelf">
                    <div className="filter-item">
                        <label>Trạng thái bài đăng:</label>
                        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                            <option value="">Tất cả</option>
                            <option value="OPEN">Mở</option>
                            <option value="CLOSED">Đóng</option>
                            <option value="PENDING">Đang chờ</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>Kiểm duyệt:</label>
                        <select value={filters.modStatus} onChange={e => setFilters({...filters, modStatus: e.target.value})}>
                            <option value="">Tất cả</option>
                            <option value="GREEN">Duyệt</option>
                            <option value="YELLOW">Chờ</option>
                            <option value="RED">Vi phạm</option>
                        </select>
                    </div>

                    <button className="btn-reset-filter" onClick={handleResetFilters} title="Xóa bộ lọc">
                        <RotateCcw size={18} />
                        <span>Reset</span>
                    </button>
                </div>
            </header>

            <div className="table-card">
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Chi tiết Công việc</th>
                                <th>Kĩ năng</th>
                                <th>Phân loại</th>
                                <th>Trạng thái</th>
                                <th>Kiểm duyệt</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job.id} className="job-row-card">
                                    <td className="clickable-cell" onClick={() => navigate(`/admin/jobs/${job.id}`)}>
                                        <div className="company-row">
                                            <span className="comp-name">{job.companyName}</span>
                                            <span className={`plan-badge-mini plan-${(job.subscriptionPlanName && job.subscriptionPlanName !== 'N/A' ? job.subscriptionPlanName : 'FREE').toLowerCase()}`}>
                                                {job.subscriptionPlanName && job.subscriptionPlanName !== 'N/A' ? job.subscriptionPlanName : 'FREE'}
                                            </span>
                                        </div>
                                        <div className="job-desc">{job.description}</div>
                                        <div className="loc-tag"><MapPin size={14} />{job.location}</div>
                                    </td>

                                    <td onClick={() => navigate(`/admin/jobs/${job.id}`)}>
                                        <div className="skills-list">
                                            {job.skills && job.skills.length > 0 ? (
                                                job.skills.map((skill, index) => (
                                                    <span key={index} className="skill-tag-mini">{skill}</span>
                                                ))
                                            ) : <span className="na-text">Không có kĩ năng</span>}
                                        </div>
                                    </td>

                                    <td><span className="cat-badge">{job.categoryName}</span></td>

                                    <td>
                                        <select
                                            className={`select-status s-${job.status?.toLowerCase()}`}
                                            value={job.status}
                                            onChange={(e) => handleAction(job.id, 'status', e.target.value)}
                                        >
                                            <option value="OPEN">Mở</option>
                                            <option value="CLOSED">Đóng</option>
                                            <option value="PENDING">Chờ</option>
                                        </select>
                                    </td>

                                    <td>
                                        <div className={`mod-indicator mod-${(job.moderationStatus || 'GREEN').toUpperCase()}`}>
                                            <select
                                                value={job.moderationStatus}
                                                onChange={(e) => handleAction(job.id, 'moderate', e.target.value)}
                                            >
                                                <option value="YELLOW">Chờ</option>
                                                <option value="GREEN">Duyệt</option>
                                                <option value="RED">Vi phạm</option>
                                            </select>
                                        </div>
                                    </td>

                                    <td className="action-cell">
                                        <button className="btn-action-delete" onClick={() => handleAction(job.id, 'delete')}>
                                            Xoá
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div ref={observerTarget} className="infinite-scroll-trigger">
                        {loading && <div className="loader-dots">...</div>}
                    </div>
                </div>
            </div>
            <DeleteConfirmPage
                isOpen={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default AdminJobPage;