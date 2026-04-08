import React, { useState, useEffect, useCallback, useRef } from 'react';
import jobService from '../../services/api/jobService';
import '../../components/admin/Admin.css';
import './AdminJob.css';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import Swal from 'sweetalert2';
import {
    MapPin,
    RotateCcw,
    Search,
    Briefcase,
    Filter,
    CheckCircle2,
    AlertCircle,
    Clock,
    Trash2,
    Eye,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const AdminJobPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ status: '', modStatus: '' });

    const [pagination, setPagination] = useState({
        page: 0,
        totalPages: 0,
        totalElements: 0
    });

    const navigate = useNavigate();

    const loadJobs = useCallback(async (pageIdx) => {
        setLoading(true);
        try {
            const data = await jobService.getAdminJobs({
                page: pageIdx,
                limit: 6,
                status: filters.status,
                modStatus: filters.modStatus
            });
            setJobs(data.jobs || []);
            setPagination({
                page: data.currentPage || 0,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0
            });
        } catch (err) {
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.modStatus]);

    useEffect(() => {
        loadJobs(0);
    }, [filters.status, filters.modStatus, loadJobs]);

    const handleResetFilters = () => {
        setFilters({ status: '', modStatus: '' });
    };

    const handleAction = async (id, type, value) => {
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
            toast.error("Thao tác thất bại", { id: toastId });
        }
    };

    const handleDelete = async (id, companyName) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa?',
            text: `Bạn có chắc chắn muốn xóa tin tuyển dụng của "${companyName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Có, xóa ngay',
            cancelButtonText: 'Hủy',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang xóa...");
            try {
                await jobService.deleteJob(id);
                setJobs(prev => prev.filter(j => j.id !== id));
                toast.success("Xóa bài đăng thành công", { id: toastId });
            } catch (error) {
                toast.error("Xóa bài đăng thất bại", { id: toastId });
            }
        }
    };

    return (
        <div className="admin-job-management animate-fade-in">

            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Quản lý tin đăng tuyển dụng</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Duyệt và kiểm soát các bài tuyển dụng từ doanh nghiệp.</p>
                </div>
            </div>

            <div className="modern-card">
                <div className="filters-bar">
                    <div className="filters-group" style={{ flex: 1 }}>
                        <div className="filter-item" style={{ minWidth: '200px' }}>
                            <Filter size={14} className="filter-icon" />
                            <select
                                className="modern-select"
                                value={filters.status}
                                onChange={e => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">Tất cả trạng thái bài đăng</option>
                                <option value="OPEN">Mở</option>
                                <option value="CLOSED">Đóng</option>
                                <option value="PENDING">Đang chờ</option>
                            </select>
                        </div>

                        <div className="filter-item" style={{ minWidth: '200px' }}>
                            <CheckCircle2 size={14} className="filter-icon" />
                            <select
                                className="modern-select"
                                value={filters.modStatus}
                                onChange={e => setFilters({ ...filters, modStatus: e.target.value })}
                            >
                                <option value="">Tất cả mức kiểm duyệt</option>
                                <option value="GREEN">Đã duyệt</option>
                                <option value="YELLOW">Chờ duyệt</option>
                                <option value="RED">Vi phạm</option>
                            </select>
                        </div>

                        <button
                            className="action-btn info-btn"
                            onClick={handleResetFilters}
                            title="Xóa bộ lọc"
                            style={{ width: '40px', height: '40px' }}
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    {loading && jobs.length === 0 && (
                        <div className="table-loader-overlay">
                            <Loader2 className="spinning-icon" size={40} />
                        </div>
                    )}

                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '35%' }}>Tin tuyển dụng</th>
                                <th>Chi tiết</th>
                                <th>Trạng thái</th>
                                <th>Kiểm duyệt</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.length > 0 ? (
                                jobs.map(job => (
                                    <tr key={job.id} className="table-row-hover">
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-avatar-wrapper" style={{ width: '44px', height: '44px', borderRadius: '12px' }}>
                                                    <div className="user-avatar-placeholder" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                        <Briefcase size={20} />
                                                    </div>
                                                </div>
                                                <div className="user-details" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/jobs/${job.id}`)}>
                                                    <p className="user-name" style={{ color: 'var(--admin-primary)', textDecoration: 'none' }}>
                                                        {job.companyName}
                                                        <span className={`plan-badge-mini plan-${(job.subscriptionPlanName && job.subscriptionPlanName !== 'N/A' ? job.subscriptionPlanName : 'FREE').toLowerCase()}`} style={{ marginLeft: '8px' }}>
                                                            {job.subscriptionPlanName && job.subscriptionPlanName !== 'N/A' ? job.subscriptionPlanName : 'FREE'}
                                                        </span>
                                                    </p>
                                                    <p className="user-email" style={{
                                                        maxWidth: '300px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        display: 'block'
                                                    }}>
                                                        {job.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div className="date-cell">
                                                    <MapPin size={14} />
                                                    <span>{job.location}</span>
                                                </div>
                                                <div className="date-cell">
                                                    <AlertCircle size={14} />
                                                    <span className="cat-badge" style={{ padding: '2px 8px', fontSize: '11px' }}>{job.categoryName}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <select
                                                className="modern-select"
                                                style={{
                                                    padding: '6px 30px 6px 12px',
                                                    fontSize: '13px',
                                                    height: '36px',
                                                    width: 'auto',
                                                    borderColor: job.status === 'OPEN' ? '#10b981' : job.status === 'CLOSED' ? '#ef4444' : '#f59e0b',
                                                    color: job.status === 'OPEN' ? '#059669' : job.status === 'CLOSED' ? '#dc2626' : '#d97706',
                                                    backgroundColor: job.status === 'OPEN' ? '#ecfdf5' : job.status === 'CLOSED' ? '#fef2f2' : '#fffbeb'
                                                }}
                                                value={job.status}
                                                onChange={(e) => handleAction(job.id, 'status', e.target.value)}
                                            >
                                                <option value="OPEN">Mở</option>
                                                <option value="CLOSED">Đóng</option>
                                                <option value="PENDING">Chờ</option>
                                            </select>
                                        </td>

                                        <td>
                                            <select
                                                className="modern-select"
                                                style={{
                                                    padding: '6px 30px 6px 12px',
                                                    fontSize: '13px',
                                                    height: '36px',
                                                    width: 'auto',
                                                    borderColor: (job.moderationStatus || 'YELLOW') === 'GREEN' ? '#10b981' : (job.moderationStatus || 'YELLOW') === 'RED' ? '#ef4444' : '#f59e0b',
                                                    color: (job.moderationStatus || 'YELLOW') === 'GREEN' ? '#059669' : (job.moderationStatus || 'YELLOW') === 'RED' ? '#dc2626' : '#d97706',
                                                    backgroundColor: (job.moderationStatus || 'YELLOW') === 'GREEN' ? '#ecfdf5' : (job.moderationStatus || 'YELLOW') === 'RED' ? '#fef2f2' : '#fffbeb'
                                                }}
                                                value={job.moderationStatus || 'YELLOW'}
                                                onChange={(e) => handleAction(job.id, 'moderate', e.target.value)}
                                            >
                                                <option value="YELLOW">Chờ duyệt</option>
                                                <option value="GREEN">Đã duyệt</option>
                                                <option value="RED">Vi phạm</option>
                                            </select>
                                        </td>

                                        <td style={{ textAlign: 'right' }}>
                                            <div className="actions-wrapper">
                                                <button
                                                    onClick={() => navigate(`/admin/jobs/${job.id}`)}
                                                    className="action-btn info-btn"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(job.id, job.companyName)}
                                                    className="action-btn ban-btn"
                                                    title="Xoá bài đăng"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : !loading && (
                                <tr>
                                    <td colSpan="5" className="empty-table-state">
                                        <div className="empty-content">
                                            <Briefcase size={48} />
                                            <p>Không tìm thấy tin tuyển dụng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Page based pagination control */}
                    {pagination.totalPages > 1 && (
                        <div className="modern-pagination">
                            <div className="pagination-info">
                                Đang xem trang <b>{pagination.page + 1} / {pagination.totalPages}</b>
                            </div>
                            <div className="pagination-controls">
                                <button
                                    disabled={pagination.page === 0}
                                    onClick={() => loadJobs(pagination.page - 1)}
                                    className="pagination-btn"
                                    title="Trang trước"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                {[...Array(pagination.totalPages)].map((_, index) => {
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => loadJobs(index)}
                                            className={`pagination-btn ${pagination.page === index ? 'active' : ''}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}

                                <button
                                    disabled={pagination.page >= pagination.totalPages - 1}
                                    onClick={() => loadJobs(pagination.page + 1)}
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

export default AdminJobPage;