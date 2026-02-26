import React, { useState, useEffect, useCallback, useRef } from 'react';
import jobService from '../../services/api/jobService';
import './AdminJob.css';
import ReactDOM from 'react-dom';

const AdminJobPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [filters, setFilters] = useState({ status: '', modStatus: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);

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
        try {
            if (type === 'moderate') {
                await jobService.changeModerationStatus(id, value);
                setJobs(prev => prev.map(j => j.id === id ? { ...j, moderationStatus: value } : j));
            } else if (type === 'status') {
                await jobService.changeStatus(id, value);
                setJobs(prev => prev.map(j => j.id === id ? { ...j, status: value } : j));
            }
        } catch (err) {
            alert("Cập nhật thất bại!");
        }
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;
        try {
            await jobService.deleteJob(jobToDelete);
            setJobs(prev => prev.filter(j => j.id !== jobToDelete));
            setShowDeleteModal(false);
            setJobToDelete(null);
        } catch (err) {
            alert("Xóa thất bại!");
        }
    };

    return (
        <div className="admin-container">
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
                                <td>
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

                                <td>
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

            {showDeleteModal && ReactDOM.createPortal(
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3>Xác nhận xóa</h3>
                        <p>Hành động này không thể hoàn tác.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Hủy</button>
                            <button className="btn-confirm-delete" onClick={confirmDelete}>Xóa ngay</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminJobPage;