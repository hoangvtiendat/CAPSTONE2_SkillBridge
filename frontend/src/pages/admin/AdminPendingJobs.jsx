import React, { useState, useEffect, useCallback } from 'react';
import jobService from '../../services/api/jobService';
import './AdminJobPending.css';
import '../../components/admin/Admin.css';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import confirmAction from '../../utils/confirmAction';
import AppPagination from '../../components/common/AppPagination';
import TableActionBar from '../../components/common/TableActionBar';
import FilterResetButton from '../../components/common/FilterResetButton';
import ManagementFilterBar from '../../components/common/ManagementFilterBar';
import {
    MapPin,
    ShieldAlert,
    CheckCircle,
    Building2,
    Filter,
    AlertTriangle,
} from 'lucide-react';

const AdminJobPending = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modFilter, setModFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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
        setSearchTerm('');
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
        const confirmed = await confirmAction({
            title: 'Từ chối bài đăng?',
            text: 'Bài đăng sẽ bị khóa và không còn hiển thị công khai.',
            confirmText: 'Từ chối',
            icon: 'warning',
            confirmButtonColor: '#ef4444'
        });
        if (!confirmed) return;

        const toastId = toast.loading("Đang xử lý...");
        try {
            await jobService.responseJobPending(id, "LOCK");
            setJobs(prev => prev.filter(j => j.jobId !== id));
            toast.success("Đã từ chối tin đăng!", { id: toastId });
        } catch (err) {
            toast.error("Thao tác thất bại", { id: toastId });
        }
    };

    const formatSubmittedAt = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const filteredJobs = jobs.filter((job) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return true;
        return (
            (job?.description || '').toLowerCase().includes(q) ||
            (job?.companyName || '').toLowerCase().includes(q) ||
            (job?.location || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="admin-pending-container">
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

                <div className="header-right"></div>
            </div>

            <div className="pending-content-card">
                <ManagementFilterBar
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm theo công ty, nội dung, địa điểm..."
                >
                    <div className="filter-item">
                        <Filter size={14} className="filter-icon" />
                        <select
                            className="modern-select"
                            value={modFilter}
                            onChange={(e) => setModFilter(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Tất cả mức độ</option>
                            <option value="YELLOW">Nghi ngờ (Yellow)</option>
                            <option value="RED">Nguy hiểm (Red)</option>
                        </select>
                    </div>
                    <FilterResetButton onClick={handleReset} disabled={loading} spinning={loading} />
                </ManagementFilterBar>
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
                            {filteredJobs.length > 0 &&
                                filteredJobs.map((job) => (
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

                                        <td className="center timestamp">{formatSubmittedAt(job.createdAt)}</td>

                                        <td
                                            className="center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <TableActionBar
                                                actions={[
                                                    {
                                                        key: 'approve',
                                                        label: 'Duyệt',
                                                        title: 'Duyệt bài đăng',
                                                        icon: CheckCircle,
                                                        variant: 'solid',
                                                        tone: 'approve',
                                                        onClick: (e) => handleApprove(e, job.jobId)
                                                    },
                                                    {
                                                        key: 'reject',
                                                        label: 'Từ chối',
                                                        title: 'Từ chối bài đăng',
                                                        variant: 'solid',
                                                        tone: 'reject',
                                                        onClick: (e) => handleBan(e, job.jobId)
                                                    }
                                                ]}
                                            />
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

                    <AppPagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(page) => fetchData(page, modFilter)}
                        zeroBased
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminJobPending;