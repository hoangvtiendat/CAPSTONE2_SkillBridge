import React, { useState, useEffect, useCallback, useRef } from 'react';
import jobService from '../../services/api/jobService';
import './AdminJobPending.css';
import '../../components/admin/Admin.css';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from "sonner";
import {
    MapPin,
    RotateCcw,
    ShieldAlert,
    CheckCircle,
    Building2,
    ChevronDown,
    Filter,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const AdminJobPending = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modFilter, setModFilter] = useState('');

    const [pagination, setPagination] = useState({
        page: 0,
        totalPages: 0,
        totalElements: 0
    });

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

    useEffect(() => {
        // Reset whenever filter changes
        fetchData(0, modFilter);
    }, [modFilter, fetchData]);

    const handleReset = () => {
        if (loading) return;
        setModFilter('');
    };

    const handleApprove = async (e, id) => {
        e.stopPropagation();
        const toastId = toast.loading("Đang duyệt tin đăng...");
        try {
            await jobService.responseJobPending(id, "OPEN");
            setJobs(prev => prev.filter(j => j.jobId !== id));
            toast.success("Bài đăng được kích hoạt!", { id: toastId });
        } catch (err) {
            toast.error("Thao tác thất bại", { id: toastId });
        }
    };

    const handleBan = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Bạn chắc chắn muốn từ chối bài đăng này?")) return;

        const toastId = toast.loading("Đang xử lý...");
        try {
            await jobService.responseJobPending(id, "CLOCK");
            setJobs(prev => prev.filter(j => j.jobId !== id));
            toast.success("Đã từ chối tin đăng!", { id: toastId });
        } catch (err) {
            toast.error("Thao tác thất bại", { id: toastId });
        }
    };

    return (
        <div className="admin-pending-container">
            <Toaster position="top-right" richColors />

            <div className="admin-pending-header">
                <div className="header-left">
                    <div className="header-icon-box">
                        <ShieldAlert size={24} />
                    </div>
                    <div className="title-group">
                        <h1>Phê duyệt Tin đăng</h1>
                        <p>
                            Xử lý tin đăng có dấu hiệu vi phạm{' '}
                            <span>({jobs.length} tin cần xử lý)</span>
                        </p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="filter-wrapper">
                        <div className="custom-select-box">
                            <Filter size={16} />
                            <select
                                value={modFilter}
                                onChange={(e) => setModFilter(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">Tất cả mức độ</option>
                                <option value="YELLOW">Nghi ngờ (Yellow)</option>
                                <option value="RED">Nguy hiểm (Red)</option>
                            </select>
                            <ChevronDown size={16} className="arrow" />
                        </div>

                        <button
                            className={`btn-refresh ${loading ? 'spinning' : ''}`}
                            onClick={handleReset}
                            disabled={loading}
                            title="Làm mới"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="pending-content-card">
                <div className="table-scroll-container">
                    <table className="pending-table-core">
                        <thead>
                            <tr>
                                <th style={{ width: '200px' }} className="center">Đánh giá AI</th>
                                <th>THÔNG TIN TIN ĐĂNG</th>
                                <th style={{ width: '300' }}>DOANH NGHIỆP</th>
                                <th style={{ width: '230px' }} className="center">THỜI GIAN GỬI</th>
                                <th style={{ width: '220px' }} className="center">THAO TÁC</th>
                            </tr>
                        </thead>

                        <tbody>
                            {jobs.length > 0 &&
                                jobs.map((job) => (
                                    <tr
                                        key={job.requestId || job.id}
                                        className="job-row-item"
                                        onClick={() => navigate(`/admin/jobs/${job.jobId || job.id}`)}
                                    >
                                        <td className="center">
                                            <div className={`status-pill pill-${job.moderationStatus || 'YELLOW'}`}>
                                                {job.moderationStatus === 'RED' ? (
                                                    <AlertTriangle size={12} />
                                                ) : (
                                                    <div className="dot" />
                                                )}
                                                {job.moderationStatus === 'RED' ? 'Nguy hiểm' : 'Nghi ngờ'}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="job-detail-box">
                                                <span className="job-name">
                                                    {job.description || "Chưa có nội dung"}
                                                </span>
                                                <div className="job-loc">
                                                    <MapPin size={12} />
                                                    <span>{job.location}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="comp-box">
                                                <Building2 size={16} />
                                                <span>{job.companyName || "SkillBridge Partner"}</span>
                                            </div>
                                        </td>

                                        <td className="center timestamp">12/03/2026</td>

                                        <td
                                            className="center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="action-btns-group">
                                                <button
                                                    className="btn-action-approve"
                                                    onClick={(e) => handleApprove(e, job.jobId)}
                                                >
                                                    <CheckCircle size={14} /> Duyệt
                                                </button>
                                                <button
                                                    className="btn-action-reject"
                                                    onClick={(e) => handleBan(e, job.jobId)}
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                    {!loading && jobs.length === 0 && (
                        <div className="empty-overlay">
                            <div className="empty-box">
                                <CheckCircle size={44} />
                                <p>Không còn tin đăng nào cần phê duyệt.</p>
                            </div>
                        </div>
                    )}

                    {/* Page based pagination UI */}
                    {pagination.totalPages > 1 && (
                        <div className="modern-pagination">
                            <div className="pagination-info">
                                Đang xem trang <b>{pagination.page + 1} / {pagination.totalPages}</b>
                            </div>
                            <div className="pagination-controls">
                                <button
                                    disabled={pagination.page === 0}
                                    onClick={() => fetchData(pagination.page - 1, modFilter)}
                                    className="pagination-btn"
                                    title="Trang trước"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                {[...Array(pagination.totalPages)].map((_, index) => {
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => fetchData(index, modFilter)}
                                            className={`pagination-btn ${pagination.page === index ? 'active' : ''}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}

                                <button
                                    disabled={pagination.page >= pagination.totalPages - 1}
                                    onClick={() => fetchData(pagination.page + 1, modFilter)}
                                    className="pagination-btn"
                                    title="Trang sau"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminJobPending;