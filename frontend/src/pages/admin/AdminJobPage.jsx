import React, { useState, useEffect, useCallback, useRef } from 'react';
import jobService from '../../services/api/jobService';
import './AdminJob.css';
import DeleteConfirmPage from '../../components/admin/DeleteConfirmPage';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from "sonner";

const AdminJobPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [filters, setFilters] = useState({ status: '', modStatus: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const navigate = useNavigate();

    const observerTarget = useRef(null);

    const loadJobs = useCallback(async (isMore = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const data = await jobService.getAdminJobs({
                cursor: isMore ? cursor : null,
                status: filters.status,
                modStatus: filters.modStatus
            });
            setJobs(prev => isMore ? [...prev, ...data.jobs] : data.jobs);
            setCursor(data.nextCursor);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    }, [cursor, filters, loading]);

    useEffect(() => {
        setCursor(null);
        loadJobs(false);
    }, [filters.status, filters.modStatus]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && cursor && !loading) {
                    loadJobs(true);
                }
            },
            { threshold: 1.0 }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [loadJobs, cursor, loading]);

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
                setJobs(prev => prev.map(j => j.id === id ? { ...j, moderationStatus: value } : j));
                toast.success("Đã cập nhật trạng thái kiểm duyệt", { id: toastId });
            } else if (type === 'status') {
                await jobService.changeStatus(id, value);
                setJobs(prev => prev.map(j => j.id === id ? { ...j, status: value } : j));
                toast.success("Đã cập nhật trạng thái bài đăng", { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error("Cập nhật thất bại. Vui lòng thử lại!", { id: toastId });
        }
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;
        const toastId = toast.loading("Đang xóa bài đăng...");
        try {
            await jobService.deleteJob(jobToDelete);
            setJobs(prev => prev.filter(j => j.id !== jobToDelete));
            setShowDeleteModal(false);
            setJobToDelete(null);
            toast.success("Xóa bài đăng thành công", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Xóa thất bại!", { id: toastId });
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
                            <option value="OPEN">OPEN</option>
                            <option value="CLOSED">CLOSED</option>
                            <option value="PENDING">PENDING</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>Kiểm duyệt:</label>
                        <select value={filters.modStatus} onChange={e => setFilters({...filters, modStatus: e.target.value})}>
                            <option value="">Tất cả</option>
                            <option value="GREEN">GREEN</option>
                            <option value="YELLOW">YELLOW</option>
                            <option value="RED">RED</option>
                        </select>
                    </div>
                </div>
            </header>

            <div className="table-card">
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
                                <td
                                    className="clickable-cell"
                                    onClick={() => navigate(`/admin/jobs/${job.id}`)}
                                >
                                    <div className="company-row">
                                        <span className="comp-name">{job.companyName}</span>
                                        {job.subscriptionPlanName && (
                                            <span className={`plan-badge-mini plan-${job.subscriptionPlanName.toLowerCase()}`}>
                                                {job.subscriptionPlanName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="job-desc">{job.description}</div>
                                    <div className="loc-tag">{job.location}</div>
                                </td>

                                <td
                                    className="clickable-cell"
                                    onClick={() => navigate(`/admin/jobs/${job.id}`)}
                                >
                                    <div className="skills-list">
                                        {job.skills && job.skills.length > 0 ? (
                                            job.skills.map((skill, index) => (
                                                <span key={index} className="skill-tag-mini">{skill}</span>
                                            ))
                                        ) : <span className="na-text">N/A</span>}
                                    </div>
                                </td>

                                <td><span className="cat-badge">{job.categoryName}</span></td>

                                <td>
                                    <select
                                        className={`select-status s-${job.status?.toLowerCase()}`}
                                        value={job.status}
                                        onChange={(e) => handleAction(job.id, 'status', e.target.value)}
                                    >
                                        <option value="OPEN">OPEN</option>
                                        <option value="CLOSED">CLOSED</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </td>

                                <td>
                                    <div className={`mod-indicator mod-${job.moderationStatus}`}>
                                        <select
                                            value={job.moderationStatus}
                                            onChange={(e) => handleAction(job.id, 'moderate', e.target.value)}
                                        >
                                            <option value="YELLOW">YELLOW</option>
                                            <option value="GREEN">GREEN</option>
                                            <option value="RED">RED</option>
                                        </select>
                                    </div>
                                </td>

                                <td className="action-cell">
                                    <button className="btn-action-delete" onClick={() => handleAction(job.id, 'delete')}>
                                        <span className="icon-trash">Xoá</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div ref={observerTarget} className="infinite-scroll-trigger">
                    {loading && <div className="loader-dots"><span>.</span><span>.</span><span>.</span></div>}
                </div>
            </div>

            {/* 2. Sử dụng component chung thay cho code Portal cũ */}
            <DeleteConfirmPage
                isOpen={showDeleteModal}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setJobToDelete(null);
                }}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default AdminJobPage;