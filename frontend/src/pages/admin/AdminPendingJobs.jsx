import React, {useState, useEffect, useCallback} from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import jobService from '../../services/api/jobService';
import './AdminJobPending.css';
import '../../components/admin/Admin.css';
import {useNavigate} from 'react-router-dom';
import {toast} from "sonner";
import {
    MapPin, RotateCcw, ShieldAlert, CheckCircle,
    Building2, ChevronDown, Filter, AlertTriangle,
    ChevronLeft, ChevronRight, XCircle, Sparkles
} from 'lucide-react';

const formatSalary = (amount) => {
    if (!amount && amount !== 0) return 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
};

const buildSpamRows = (compareData) => {
    if (!compareData?.targetJD || !compareData?.jdSpam) return [];

    const targetJD = compareData.targetJD;
    const spamJD = compareData.jdSpam;

    return [
        {label: 'Vị trí', target: targetJD.position, spam: spamJD.position},
        {label: 'Công ty', target: targetJD.company?.name, spam: spamJD.company?.name},
        {label: 'Danh mục', target: targetJD.category?.name, spam: spamJD.category?.name},
        {label: 'Địa điểm', target: targetJD.location, spam: spamJD.location},
        {label: 'Mức lương', target: `${formatSalary(targetJD.salaryMin)} - ${formatSalary(targetJD.salaryMax)}`, spam: `${formatSalary(spamJD.salaryMin)} - ${formatSalary(spamJD.salaryMax)}`},
        {
            label: 'Kỹ năng',
            target: (targetJD.skills || []).map(skill => skill.name || skill.skillName || skill).join(', ') || 'Không có dữ liệu',
            spam: (spamJD.skills || []).map(skill => skill.name || skill.skillName || skill).join(', ') || 'Không có dữ liệu'
        },
        {label: 'Mô tả', target: targetJD.description || 'Không có dữ liệu', spam: spamJD.description || 'Không có dữ liệu'},
        {
            label: 'Các thông tin khác',
            target: Object.entries(targetJD.title || {}).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'Không có dữ liệu',
            spam: Object.entries(spamJD.title || {}).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'Không có dữ liệu'
        }
    ];
};

const AdminJobPending = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modFilter, setModFilter] = useState('');
    const [pagination, setPagination] = useState({page: 0, totalPages: 0, totalElements: 0});
    const [spamCompare, setSpamCompare] = useState(null);
    const [spamLoading, setSpamLoading] = useState(false);
    const [showSpamTable, setShowSpamTable] = useState(false);
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
        fetchData(0, modFilter);
    }, [modFilter, fetchData]);

    const handleReset = () => {
        if (!loading) setModFilter('');
    };

    const handleApprove = async (e, id) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Xác nhận duyệt tin?',
            text: 'Bạn có chắc muốn duyệt tin đăng này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f85757',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Duyệt ngay',
            cancelButtonText: 'Hủy',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang duyệt...");
            try {
                await jobService.responseJobPending(id, "OPEN");
                setJobs(prev => prev.filter(j => (j.jobId || j.id) !== id));
                toast.success("Đã duyệt tin đăng", {id: toastId});
            } catch (err) {
                toast.error("Thao tác thất bại", {id: toastId});
            }
        }
    };

    const handleReject = async (e, id) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Xác nhận từ chối tin?',
            text: 'Bạn có chắc muốn từ chối tin đăng này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f85757',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Từ chối ngay',
            cancelButtonText: 'Hủy',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang xử lý...");
            try {
                await jobService.responseJobPending(id, "LOCK");
                setJobs(prev => prev.filter(j => (j.jobId || j.id) !== id));
                toast.success("Đã từ chối tin đăng", {id: toastId});
            } catch (err) {
                toast.error("Thao tác thất bại", {id: toastId});
            }
        }
    };

    const getSpamIdFromJob = (job) => {
        if (!job || typeof job !== 'object') return null;
        const candidates = [
            job.source_jd_id && (job.source_jd_id.id || job.source_jd_id),
            job.sourceJdId,
            job.source_jd,
            job.target_jd_id && (job.target_jd_id.id || job.target_jd_id),
            job.targetJdId,
            job.jobId,
            job.id
        ];
        for (const c of candidates) {
            if (c !== undefined && c !== null && String(c).trim() !== '') return String(c);
        }
        return null;
    };

    const handleSpamReason = async (e, job) => {
        e.stopPropagation();
        const toastId = toast.loading('Đang tải lý do spam...');
        setSpamLoading(true);
        try {
            const idToQuery = getSpamIdFromJob(job);
            if (!idToQuery) {
                toast.error('Không tìm thấy ID bài đăng', {id: toastId});
                setSpamLoading(false);
                return;
            }
            const data = await jobService.jdSpam(idToQuery);
            setSpamCompare(data || null);
            setShowSpamTable(true);
            toast.success('Đã tải lý do spam', {id: toastId});
        } catch (err) {
            toast.error('Không thể tải lý do spam', {id: toastId});
        } finally {
            setSpamLoading(false);
        }
    };

    const spamRows = buildSpamRows(spamCompare);

    const SpamCompareModal = ({show, compare, onClose, loading}) => {
        if (!show || !compare) return null;
        const rows = buildSpamRows(compare);
        return ReactDOM.createPortal(
            <div className="spam-modal-overlay">
                <div className="spam-white-table-wrap spam-modal-window">
                    <div className="spam-white-table-header">
                        <div>
                            <h3>Lý do spam</h3>
                            <p>Bảng so sánh bài hiện tại với Bài có nội dung tương tự từ sự kiện `jdSpam`.</p>
                        </div>
                        <button className="spam-white-table-close" onClick={onClose}>
                            Đóng
                        </button>
                    </div>

                    <div className="spam-white-table-shell">
                        <table className="spam-white-table">
                            <colgroup>
                                <col className="spam-col-label" />
                                <col className="spam-col-target" />
                                <col className="spam-col-spam" />
                            </colgroup>
                            <thead>
                            <tr>
                                <th>Trường</th>
                                <th>Bài có nội dung tương tự</th>
                                <th>Bài spam</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((row) => (
                                <tr key={row.label}>
                                    <td className="spam-field-name">{row.label}</td>
                                    <td>{row.target}</td>
                                    <td>{row.spam}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className="admin-pending-container animate-fade-in">
            <div className="admin-pending-header">
                <div className="header-left">
                    <div className="header-icon-box red">
                        <ShieldAlert size={28}/>
                    </div>
                    <div className="title-group">
                        <h1>Phê duyệt tin đăng</h1>
                        <p>Kiểm soát nội dung nghi ngờ <span className="count-tag">{pagination.totalElements}</span></p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="filter-wrapper">
                        <div className="custom-select-box">
                            <Filter size={16}/>
                            <select value={modFilter} onChange={(e) => setModFilter(e.target.value)}>
                                <option value="">Tất cả mức độ</option>
                                <option value="YELLOW">Nghi ngờ (Vàng)</option>
                                <option value="RED">Nguy hiểm (Đỏ)</option>
                            </select>
                            <ChevronDown size={14} className="arrow-down"/>
                        </div>
                        <button className={`btn-refresh ${loading ? 'spinning' : ''}`} onClick={handleReset}>
                            <RotateCcw size={18}/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="pending-content-card">
                <table className="pending-table-core">
                    <thead>
                    <tr>
                        <th style={{width: '150px'}}>Phân loại AI</th>
                        <th>Nội dung tin tuyển dụng</th>
                        <th>Công ty</th>
                        <th>Ngày gửi</th>
                        <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {jobs.map((job) => (
                        <tr key={job.jobId || job.id} className="job-row-item"
                            onClick={() => navigate(`/admin/jobs/${job.jobId || job.id}`)}>
                            <td>
                                <div className={`status-pill pill-${job.moderationStatus || 'YELLOW'}`}>
                                    {job.moderationStatus === 'RED' ? <AlertTriangle size={12}/> :
                                        <div className="dot"/>}
                                    <span>{job.moderationStatus === 'RED' ? 'Vi phạm' : 'Nghi ngờ'}</span>
                                </div>
                            </td>
                            <td>
                                <div className="job-info-cell">
                                    <p className="job-description-text">{job.description}</p>
                                    <div className="job-location-tag">
                                        <MapPin size={12}/>
                                        <span>{job.location}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="company-info-cell">
                                    <Building2 size={16}/>
                                    <span>{job.companyName}</span>
                                </div>
                            </td>
                            <td><span className="timestamp-text">12/03/2026</span></td>
                            <td>
                                <div className="action-btns-group action-btns-vertical">
                                        <button className="btn-action-spam"
                                            onClick={(e) => handleSpamReason(e, job)}>
                                        <Sparkles size={14}/>
                                        <span>{spamLoading ? 'Đang tải...' : 'Lý do spam'}</span>
                                    </button>
                                    <button className="btn-action-approve"
                                            onClick={(e) => handleApprove(e, job.jobId || job.id)}>
                                        <CheckCircle size={14}/>
                                        <span>Duyệt</span>
                                    </button>
                                    <button className="btn-action-reject"
                                            onClick={(e) => handleReject(e, job.jobId || job.id)}>
                                        <XCircle size={20}/>
                                        <span>Từ chối</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <SpamCompareModal show={showSpamTable} compare={spamCompare} onClose={() => setShowSpamTable(false)} loading={spamLoading} />

                {!loading && jobs.length === 0 && (
                    <div className="empty-state">
                        <CheckCircle size={48} className="text-green-500"/>
                        <p>Danh sách phê duyệt trống!</p>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="modern-pagination">
                        <div className="pagination-info">Trang <b>{pagination.page + 1} / {pagination.totalPages}</b>
                        </div>
                        <div className="pagination-controls">
                            <button disabled={pagination.page === 0}
                                    onClick={() => fetchData(pagination.page - 1, modFilter)}
                                    className="pagination-btn">
                                <ChevronLeft size={18}/>
                            </button>
                            <button disabled={pagination.page >= pagination.totalPages - 1}
                                    onClick={() => fetchData(pagination.page + 1, modFilter)}
                                    className="pagination-btn">
                                <ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminJobPending;