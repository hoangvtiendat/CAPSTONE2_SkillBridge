import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import jobService from '../../services/api/jobService';
import subscriptionService from '../../services/api/subscriptionService';
import companyMemberService from '../../services/api/companyMemberService';
import './JdList.css';
import { useAuth } from '../../context/AuthContext';
import {
    Zap, Users, Search, Info, Lock, Target, Plus,
    CalendarPlus, MoreVertical, XCircle, RefreshCcw, AlertTriangle
} from 'lucide-react';

const API_BASE_URL = "http://localhost:8081/identity";

const STATUS_LABELS = {
    ALL: 'Tất cả',
    NOT_STARTED: 'Sắp bắt đầu',
    OPEN: 'Đang mở',
    PENDING: 'Chờ duyệt',
    LOCK: 'Đã khoá',
    CLOSED: 'Đã đóng'
};

const normalizeId = (value) => String(value ?? '').trim().toLowerCase();

const formatSalary = (amount) => {
    if (!amount && amount !== 0) return 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
};

const buildSpamRows = (compareData) => {
    if (!compareData?.targetJD || !compareData?.jdSpam) return [];

    const targetJD = compareData.targetJD;
    const spamJD = compareData.jdSpam;

    return [
        { label: 'Vị trí', target: targetJD.position, spam: spamJD.position },
        { label: 'Công ty', target: targetJD.company?.name, spam: spamJD.company?.name },
        { label: 'Danh mục', target: targetJD.category?.name, spam: spamJD.category?.name },
        { label: 'Địa điểm', target: targetJD.location, spam: spamJD.location },
        {
            label: 'Mức lương',
            target: `${formatSalary(targetJD.salaryMin)} - ${formatSalary(targetJD.salaryMax)}`,
            spam: `${formatSalary(spamJD.salaryMin)} - ${formatSalary(spamJD.salaryMax)}`
        },
        {
            label: 'Kỹ năng',
            target: (targetJD.skills || []).map(skill => skill.name || skill.skillName || skill).join(', ') || 'Không có dữ liệu',
            spam: (spamJD.skills || []).map(skill => skill.name || skill.skillName || skill).join(', ') || 'Không có dữ liệu'
        },
        { label: 'Mô tả', target: targetJD.description || 'Không có dữ liệu', spam: spamJD.description || 'Không có dữ liệu' },
        {
            label: 'Các thông tin khác',
            target: Object.entries(targetJD.title || {}).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'Không có dữ liệu',
            spam: Object.entries(spamJD.title || {}).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'Không có dữ liệu'
        }
    ];
};

const extractJdIds = (jd) => {
    if (!jd || typeof jd !== 'object') return [];

    const directCandidates = [
        jd.id,
        jd._id,
        jd.jobId,
        jd.jdId,
        jd._jobId,
        jd.postId,
        jd.recruitmentId,
        jd.job?.id,
        jd.job?.jobId
    ];

    const dynamicCandidates = Object.entries(jd)
        .filter(([key, value]) => /id/i.test(key) && (typeof value === 'string' || typeof value === 'number'))
        .map(([, value]) => value);

    return [...new Set([...directCandidates, ...dynamicCandidates]
        .map(normalizeId)
        .filter(Boolean))];
};

const JdList = () => {
    const { user, token } = useAuth();
    const ITEMS_PER_PAGE = 6;

    const [jdList, setJdList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [role, setRole] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [spamIds, setSpamIds] = useState(new Set());
    const [spamCompare, setSpamCompare] = useState(null);
    const [showSpamTable, setShowSpamTable] = useState(false);
    const [spamLoading, setSpamLoading] = useState(false);

    // Repost modal states
    const [repostModalOpen, setRepostModalOpen] = useState(false);
    const [repostJdId, setRepostJdId] = useState(null);
    const [postingDuration, setPostingDuration] = useState(null);
    const [repostStartDate, setRepostStartDate] = useState("");
    const [repostEndDate, setRepostEndDate] = useState("");
    const [isReposting, setIsReposting] = useState(false);

    const navigate = useNavigate();
    const hasShownError = useRef(false);

    const formatDateForInput = (d) => {
        try {
            return format(typeof d === 'string' ? parseISO(d) : d, 'yyyy-MM-dd');
        } catch (e) {
            const dt = new Date(d);
            if (isNaN(dt)) return '';
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
    };

    const toBackendDateTimeString = (dateString, isEndDate = false) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return '';
        const dayPart = String(date.getDate()).padStart(2, '0');
        const monthPart = String(date.getMonth() + 1).padStart(2, '0');
        const yearPart = date.getFullYear();
        return `${dayPart}/${monthPart}/${yearPart} ${isEndDate ? '23:59:59' : '00:00:00'}`;
    };

    const openRepostModal = async (jdId) => {
        try {
            const resp = await subscriptionService.postingDuriation(user?.companyId, token);
            let dur = resp;
            if (resp && typeof resp === 'object') {
                dur = resp?.data ?? resp?.result ?? resp?.postingDuriation ?? resp?.postingDuration ?? null;
            }
            if (typeof dur === 'string') dur = Number(dur);
            if (typeof dur === 'number' && !Number.isNaN(dur)) {
                setPostingDuration(dur);
                const today = formatDateForInput(new Date());
                setRepostStartDate(today);
                setRepostEndDate(formatDateForInput(addDays(new Date(), dur - 1)));
            } else {
                toast.error('Không lấy được thông tin gói cước');
                return;
            }
        } catch (error) {
            console.error('Failed to fetch posting duration for repost', error);
            toast.error('Lỗi khi lấy thông tin gói cước');
            return;
        }
        setRepostJdId(jdId);
        setRepostModalOpen(true);
    };

    const closeRepostModal = () => {
        setRepostModalOpen(false);
        setRepostJdId(null);
        setPostingDuration(null);
        setRepostStartDate("");
        setRepostEndDate("");
    };

    const handleRepostConfirm = async () => {
        if (!repostStartDate || !repostEndDate) {
            toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
            return;
        }

        const startDateValue = new Date(repostStartDate);
        const endDateValue = new Date(repostEndDate);

        if (endDateValue < startDateValue) {
            toast.error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
            return;
        }

        if (postingDuration) {
            const msPerDay = 24 * 60 * 60 * 1000;
            const inclusiveDays = Math.floor((endDateValue - startDateValue) / msPerDay) + 1;
            if (inclusiveDays > postingDuration) {
                toast.error(`Khoảng thời gian không thể vượt quá ${postingDuration} ngày`);
                return;
            }
        }

        setIsReposting(true);
        try {
            await jobService.repostJob(repostJdId, {
                startDate: toBackendDateTimeString(repostStartDate),
                endDate: toBackendDateTimeString(repostEndDate, true)
            });
            setJdList(prev => prev.map(jd => jd.id === repostJdId ? { ...jd, status: 'OPEN' } : jd));
            setActiveMenu(null);
            await fetchJdList();
            toast.success('Đã đăng lại tin đăng thành công');
            closeRepostModal();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể đăng lại tin đăng');
        } finally {
            setIsReposting(false);
        }
    };

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/100';
        if (path.startsWith('http')) return path;
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    };

    const fetchJdList = useCallback(async () => {
        try {
            const res = await jobService.getMyJd_of_Company(token);
            setJdList(res.result || []);
        } catch (error) {
            if (!hasShownError.current) {
                toast.error("Lỗi khi tải dữ liệu");
                hasShownError.current = true;
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchRole = useCallback(async () => {
        try {
            const r = await companyMemberService.getCompanyMembersRole(token);
            setRole(r);
        } catch {
            console.error("Không xác định được role");
        }
    }, [token]);

    const emitJdEvent = (eventName, jdId, status) => {
        window.dispatchEvent(new CustomEvent(eventName, {
            detail: { jdId, status }
        }));
    };

    useEffect(() => {
        fetchJdList();
        fetchRole();
        const fetchSpam = async () => {
            try {
                const res = await jobService.listJDSpam();
                console.log('📌 Spam API response:', res);
                console.log('📌 Is array?', Array.isArray(res));
                
                if (Array.isArray(res)) {
                    // Handle both string IDs and object IDs
                    const normalized = res.map(item => {
                        // If it's an object, try to extract ID
                        if (typeof item === 'object' && item !== null) {
                            const id = item.id || item._id || item.jobId || item.jdId;
                            return normalizeId(id);
                        }
                        // If it's a string, normalize it directly
                        return normalizeId(item);
                    }).filter(Boolean);
                    
                    console.log('📌 Normalized spam IDs:', normalized);
                    setSpamIds(new Set(normalized));
                } else {
                    console.warn('📌 Spam response is not an array:', res);
                }
            } catch (err) {
                console.error('📌 Could not load spam list:', err);
            }
        };
        fetchSpam();
    }, [fetchJdList, fetchRole]);

    // Listen for real-time JD status updates
    useEffect(() => {
        const handler = (e) => {
            try {
                const { objId, status } = e.detail || {};
                if (!objId) return;
                setJdList(prev => prev.map(jd => {
                    const jdId = String(jd.id || jd._id || '');
                    return jdId === String(objId) ? { ...jd, status } : jd;
                }));
            } catch (err) {
                console.warn('Error handling jdStatusUpdated', err);
            }
        };
        window.addEventListener('jdStatusUpdated', handler);
        return () => window.removeEventListener('jdStatusUpdated', handler);
    }, []);


    const handleLockJd = async (e, jdId) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Xác nhận khóa tin đăng?',
            text: 'Bạn có chắc muốn khóa tin đăng này? Hành động này không thể hoàn tác.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f85757',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Khóa ngay',
            cancelButtonText: 'Hủy',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                await jobService.deleteJd(jdId);
                setJdList(prev => prev.map(jd => jd.id === jdId ? { ...jd, status: 'LOCK' } : jd));
                emitJdEvent('jd:locked', jdId, 'LOCK');
                toast.success('Đã khóa tin đăng thành công');
            } catch (error) {
                toast.error('Không thể khóa tin đăng');
            }
        }
    };

    const handleCloseJd = async (e, jdId) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Xác nhận đóng tin đăng?',
            text: 'Bạn có chắc muốn đóng tin đăng này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f85757',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Đóng ngay',
            cancelButtonText: 'Hủy',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                await jobService.closedJd(jdId);
                setJdList(prev => prev.map(jd => jd.id === jdId ? { ...jd, status: 'CLOSED' } : jd));
                emitJdEvent('jd:closed', jdId, 'CLOSED');
                toast.success('Đã đóng tin đăng thành công');
            } catch (error) {
                toast.error('Không thể đóng tin đăng');
            }
        }
    };

    const handleReopenJd = async (e, jdId) => {
        e.stopPropagation();
        await openRepostModal(jdId);
    };

    const handleSpamBadgeClick = async (e, jd) => {
        e.stopPropagation();
        const jdId = jd?.id || jd?.jobId || jd?.jdId || jd?._id;
        if (!jdId) {
            toast.error('Không tìm thấy ID tin đăng');
            return;
        }

        const toastId = toast.loading('Đang tải so sánh spam...');
        setSpamLoading(true);

        try {
            const data = await jobService.jdSpam(jdId);
            if (!data?.targetJD || !data?.jdSpam) {
                toast.error('Không có dữ liệu so sánh spam', { id: toastId });
                return;
            }
            setSpamCompare(data);
            setShowSpamTable(true);
            toast.success('Đã tải dữ liệu spam', { id: toastId });
        } catch (error) {
            toast.error('Không thể tải dữ liệu spam', { id: toastId });
        } finally {
            setSpamLoading(false);
        }
    };

    const SpamCompareModal = ({ show, compare, onClose }) => {
        if (!show || !compare) return null;
        const rows = buildSpamRows(compare);

        return ReactDOM.createPortal(
            <div className="jd-spam-modal-overlay" onClick={onClose}>
                <div className="jd-spam-modal-window" onClick={(e) => e.stopPropagation()}>
                    <div className="jd-spam-modal-header">
                        <div>
                            <h3>Lý do spam</h3>
                            <p>Bảng so sánh tin có nội dung tương tự và tin spam</p>
                        </div>
                        <button className="jd-spam-close-btn" onClick={onClose}>Đóng</button>
                    </div>

                    <div className="jd-spam-modal-table-shell">
                        <table className="jd-spam-modal-table">
                            <thead>
                                <tr>
                                    <th>Trường</th>
                                    <th>tin có nội dung tương tự</th>
                                    <th>tin spam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.label}>
                                        <td className="jd-spam-field-name">{row.label}</td>
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

    /* ================= FILTER & PAGINATION ================= */
    const filteredJdList = jdList.filter(jd => {
        const search = searchTerm.toLowerCase();
        return (jd.position?.toLowerCase().includes(search) ||
            jd.company?.name?.toLowerCase().includes(search)) &&
            (statusFilter === 'ALL' || jd.status === statusFilter);
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const visibleCount = filteredJdList.length;
    const statusCounts = {
        ALL: jdList.length,
        NOT_STARTED: jdList.filter(jd => jd.status === 'NOT_STARTED').length,
        OPEN: jdList.filter(jd => jd.status === 'OPEN').length,
        PENDING: jdList.filter(jd => jd.status === 'PENDING').length,
        LOCK: jdList.filter(jd => jd.status === 'LOCK').length,
        CLOSED: jdList.filter(jd => jd.status === 'CLOSED').length
    };

    const totalPages = Math.max(1, Math.ceil(filteredJdList.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedJdList = filteredJdList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        setActiveMenu(null);
    };

    return (
        <main className="jd-list-container">

            <div className="jd-page-header">
                <div>
                    <h1 className="jd-list-title">Quản lý tuyển dụng</h1>
                    <p className="jd-subtitle">Hệ thống quản lý tin đăng của công ty</p>
                </div>


                <div className="header-actions">
                    {role === 'ADMIN' && (
                        <button className="btn-subscription" onClick={() => navigate('/company/subscriptions')}>
                            <Zap size={16} fill="currentColor" /> Gói dịch vụ
                        </button>
                    )}
                    <button className="btn-create-jd" onClick={() => navigate('/create-jd')}>
                        <Plus size={18} /> Tạo JD mới
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm theo vị trí..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="status-group">
                    {Object.keys(STATUS_LABELS).map(s => (
                        <button
                            key={s}
                            className={`status-btn ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {STATUS_LABELS[s]}
                            <span className="status-count"> {statusCounts[s] || 0}</span>
                        </button>
                    ))}
                </div>
            </div>



            {loading ? (
                <div className="loader">Đang tải dữ liệu...</div>
            ) : (
                <>
                    <div className="jd-grid">
                        {paginatedJdList.map(jd => {
                            const cardIds = extractJdIds(jd);
                            const isSpamJob = cardIds.some(id => spamIds.has(id));
                            // Show spam decorations only when the job status is LOCK.
                            const isSpamJobVisible = isSpamJob && jd.status === 'LOCK';
                            
                            if (cardIds.length > 0) {
                                console.log(`JD "${jd.position}" - IDs: ${cardIds.join(', ')} | Is Spam: ${isSpamJob}`);
                            }

                            return (
                            <div
                                key={jd.id}
                                className={`jd-card status-${String(jd.status || '').toLowerCase().replace(/_/g, '-') } ${isSpamJobVisible ? 'spam-card' : ''}`}
                            >
                                <div className="jd-card-body" onClick={() => navigate(`/detail-jd/${jd.id}`)}>
                                    <div className="jd-card-top">
                                        <div className="logo-box">
                                            <img
                                                src={getImageUrl(jd.company?.imageUrl || jd.company?.logoUrl)}
                                                alt="logo"
                                                onError={(e) => e.target.src = 'https://via.placeholder.com/100'}
                                            />
                                        </div>
                                        <div className="title-box">
                                            <h2 className="position-title">{jd.position}
                                                {isSpamJobVisible ? <AlertTriangle size={16} className="spam-flag" title="tin bị đánh dấu là spam" /> : null}
                                            </h2>
                                            <div className="title-badges">
                                                <span className={`status-badge ${jd.status}`}>
                                                    {STATUS_LABELS[jd.status] || jd.status}
                                                </span>
                                                {isSpamJobVisible && (
                                                    <button
                                                        type="button"
                                                        className="spam-badge"
                                                        onClick={(e) => handleSpamBadgeClick(e, jd)}
                                                        disabled={spamLoading}
                                                        aria-label="tin đăng được đánh dấu spam"
                                                    >
                                                        {spamLoading ? 'ĐANG TẢI' : 'SPAM'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="jd-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">Địa điểm:</span>
                                            <span className="meta-value">{jd.location}</span>
                                        </div>
                                        <p className="description-preview" title={jd.description || ''}>
                                            {jd.description || 'Chưa có mô tả'}
                                        </p>

                                        {Array.isArray(jd.skills) && jd.skills.length > 0 && (
                                            <div className="skills-mini-list">
                                                {jd.skills.slice(0, 4).map((skill, index) => {
                                                    const skillLabel = typeof skill === 'string'
                                                        ? skill
                                                        : (skill?.name || skill?.skillName || skill?.title || 'Kỹ năng');

                                                    return (
                                                        <span key={`${jd.id}-skill-${index}`} className="skill-tag">
                                                            {skillLabel}
                                                        </span>
                                                    );
                                                })}

                                                {jd.skills.length > 4 && (
                                                    <span className="skill-tag">+{jd.skills.length - 4}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="jd-card-actions">
                                    <button className="act-btn info" title="Chi tiết" onClick={(e) => { e.stopPropagation(); navigate(`/detail-jd/${jd.id}`); }}>
                                        <Info size={16} />
                                    </button>

                                    <button className="act-btn applicants" title="Ứng viên" onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${jd.id}/applications`); }}>
                                        <Users size={16} /> <span>CV</span>
                                    </button>

                                    {(jd.status === 'OPEN' || jd.status === 'CLOSED') ? (
                                        <div className="more-menu-container">
                                            <button
                                                className="act-btn more"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === jd.id ? null : jd.id);
                                                }}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeMenu === jd.id && (
                                                <div className="dropdown-menu">
                                                    {jd.status === 'OPEN' && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${jd.id}/potential`); }}>
                                                                <Target size={14} /> Săn nhân tài
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${jd.id}/batch-slots`); }}>
                                                                <CalendarPlus size={14} /> Tạo lịch
                                                            </button>
                                                            <button className="text-warning" onClick={(e) => handleCloseJd(e, jd.id)}>
                                                                <XCircle size={14} /> Đóng tin
                                                            </button>
                                                        </>
                                                    )}

                                                    {jd.status === 'CLOSED' && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${jd.id}/potential`); }}>
                                                                <Target size={14} /> Săn nhân tài
                                                            </button>
                                                            <button className="text-success" onClick={(e) => handleReopenJd(e, jd.id)}>
                                                                <RefreshCcw size={14} /> Đăng lại tin
                                                            </button>
                                                        </>
                                                    )}

                                                    <button className="text-danger" onClick={(e) => handleLockJd(e, jd.id)}>
                                                        <Lock size={14} /> Khóa tin
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        jd.status !== 'LOCK' && (
                                            <button className="act-btn lock" title="Khóa tin" onClick={(e) => handleLockJd(e, jd.id)}>
                                                <Lock size={16} />
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    <SpamCompareModal
                        show={showSpamTable}
                        compare={spamCompare}
                        onClose={() => setShowSpamTable(false)}
                    />

                    {totalPages > 1 && (
                        <div className="jd-pagination">
                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                ←
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Repost Modal */}
            {repostModalOpen && (
                <div className="modal-overlay" onClick={closeRepostModal}>
                    <div className="modal-content repost-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Đăng lại tin đăng</h2>
                        
                        {postingDuration && (
                            <p className="posting-duration-info">
                                Gói hiện tại cho phép đăng tối đa <strong>{postingDuration} ngày</strong>
                            </p>
                        )}

                        <div className="posting-date-group">
                            <div className="posting-date-field">
                                <label>Ngày bắt đầu</label>
                                <input
                                    type="date"
                                    value={repostStartDate}
                                    onChange={(e) => setRepostStartDate(e.target.value)}
                                    min={formatDateForInput(new Date())}
                                />
                            </div>
                            <div className="posting-date-field">
                                <label>Ngày kết thúc</label>
                                <input
                                    type="date"
                                    value={repostEndDate}
                                    onChange={(e) => setRepostEndDate(e.target.value)}
                                    min={repostStartDate}
                                    max={repostStartDate && postingDuration ? formatDateForInput(addDays(parseISO(repostStartDate), postingDuration - 1)) : undefined}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn btn-secondary" 
                                onClick={closeRepostModal}
                                disabled={isReposting}
                            >
                                Hủy
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleRepostConfirm}
                                disabled={isReposting}
                            >
                                {isReposting ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default JdList;