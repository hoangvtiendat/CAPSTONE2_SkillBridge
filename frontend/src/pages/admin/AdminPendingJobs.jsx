import React, { useState, useEffect, useCallback } from 'react';
import jobService from '../../services/api/jobService';
import './AdminJobPending.css';
import '../../components/admin/Admin.css';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from "sonner";
import {
    MapPin, RotateCcw, ShieldAlert, CheckCircle,
    Building2, ChevronDown, Filter, AlertTriangle,
    ChevronLeft, ChevronRight
} from 'lucide-react';

const AdminJobPending = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modFilter, setModFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
    const navigate = useNavigate();

    const fetchData = useCallback(async (pageIdx, filterValue) => {
        setLoading(true);
        try {
            const response = await jobService.getPendingJobs({
                modStatus: filterValue || null,
                page: pageIdx,
                limit: 6
            });
            const data = response || {};
            setJobs(Array.isArray(data.result) ? data.result : []);
            setPagination({
                page: data.currentPage || 0,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0
            });
        } catch (err) {
            setJobs([]);
            toast.error("Lỗi kết nối API");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(0, modFilter); }, [modFilter, fetchData]);

    const handleReset = () => { if (!loading) setModFilter(''); };

    const handleApprove = async (e, id) => {
        e.stopPropagation();
        const toastId = toast.loading("Đang duyệt...");
        try {
            await jobService.responseJobPending(id, "OPEN");
            setJobs(prev => prev.filter(j => (j.jobId || j.id) !== id));
            toast.success("Đã duyệt tin đăng", { id: toastId });
        } catch (err) { toast.error("Thao tác thất bại", { id: toastId }); }
    };

    const handleReject = async (e, id) => {
        e.stopPropagation();
        const toastId = toast.loading("Đang xử lý...");
        try {
            await jobService.responseJobPending(id, "LOCK");
            setJobs(prev => prev.filter(j => (j.jobId || j.id) !== id));
            toast.success("Đã từ chối tin đăng", { id: toastId });
        } catch (err) { toast.error("Thao tác thất bại", { id: toastId }); }
    };

    return (
        <div className="admin-pending-container animate-fade-in">
            <Toaster position="top-right" richColors />

            <div className="admin-pending-header">
                <div className="header-left">
                    <div className="header-icon-box red">
                        <ShieldAlert size={28} />
                    </div>
                    <div className="title-group">
                        <h1>Phê duyệt tin đăng</h1>
                        <p>Kiểm soát nội dung nghi ngờ <span className="count-tag">{pagination.totalElements}</span></p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="filter-wrapper">
                        <div className="custom-select-box">
                            <Filter size={16} />
                            <select value={modFilter} onChange={(e) => setModFilter(e.target.value)}>
                                <option value="">Tất cả mức độ</option>
                                <option value="YELLOW">Nghi ngờ (Vàng)</option>
                                <option value="RED">Nguy hiểm (Đỏ)</option>
                            </select>
                            <ChevronDown size={14} className="arrow-down" />
                        </div>
                        <button className={`btn-refresh ${loading ? 'spinning' : ''}`} onClick={handleReset}>
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="pending-content-card">
                <table className="pending-table-core">
                    <thead>
                        <tr>
                            <th style={{ width: '150px' }}>Phân loại AI</th>
                            <th>Nội dung tin tuyển dụng</th>
                            <th>Công ty</th>
                            <th>Ngày gửi</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job.jobId || job.id} className="job-row-item" onClick={() => navigate(`/admin/jobs/${job.jobId || job.id}`)}>
                                <td>
                                    <div className={`status-pill pill-${job.moderationStatus || 'YELLOW'}`}>
                                        {job.moderationStatus === 'RED' ? <AlertTriangle size={12} /> : <div className="dot" />}
                                        <span>{job.moderationStatus === 'RED' ? 'Vi phạm' : 'Nghi ngờ'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="job-info-cell">
                                        <p className="job-description-text">{job.description}</p>
                                        <div className="job-location-tag">
                                            <MapPin size={12} />
                                            <span>{job.location}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="company-info-cell">
                                        <Building2 size={16} />
                                        <span>{job.companyName}</span>
                                    </div>
                                </td>
                                <td><span className="timestamp-text">12/03/2026</span></td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="action-btns-group">
                                        <button className="btn-action-approve" onClick={(e) => handleApprove(e, job.jobId || job.id)}>
                                            <CheckCircle size={14} /> Duyệt
                                        </button>
                                        <button className="btn-action-reject" onClick={(e) => handleReject(e, job.jobId || job.id)}>
                                            Từ chối
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!loading && jobs.length === 0 && (
                    <div className="empty-state">
                        <CheckCircle size={48} className="text-green-500" />
                        <p>Danh sách phê duyệt trống!</p>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="modern-pagination">
                        <div className="pagination-info">Trang <b>{pagination.page + 1} / {pagination.totalPages}</b></div>
                        <div className="pagination-controls">
                            <button disabled={pagination.page === 0} onClick={() => fetchData(pagination.page - 1, modFilter)} className="pagination-btn">
                                <ChevronLeft size={18} />
                            </button>
                            <button disabled={pagination.page >= pagination.totalPages - 1} onClick={() => fetchData(pagination.page + 1, modFilter)} className="pagination-btn">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminJobPending;