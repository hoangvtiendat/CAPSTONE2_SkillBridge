import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import companyMemberService from '../../services/api/companyMemberService';
import './JdList.css';
import { useAuth } from '../../context/AuthContext';
import {
    Zap, Users, Search, Info, Lock, Target, Plus,
    CalendarPlus, MoreVertical, XCircle, RefreshCcw
} from 'lucide-react';

const API_BASE_URL = "http://localhost:8081/identity";

const STATUS_LABELS = {
    ALL: 'Tất cả',
    OPEN: 'Đang mở',
    PENDING: 'Chờ duyệt',
    LOCK: 'Đã khoá',
    CLOSED: 'Đã đóng'
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

    const navigate = useNavigate();
    const hasShownError = useRef(false);

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
    }, [fetchJdList, fetchRole]);

    // Listen for real-time JD status updates
    useEffect(() => {
        const handler = (e) => {
            try {
                const { jdId, status } = e.detail || {};
                if (!jdId) return;
                setJdList(prev => prev.map(jd => jd.id === jdId ? { ...jd, status } : jd));
            } catch (err) {
                console.warn('Error handling jdStatusUpdated', err);
            }
        };
        window.addEventListener('jdStatusUpdated', handler);
        return () => window.removeEventListener('jdStatusUpdated', handler);
    }, []);

    /* ================= ACTIONS ================= */

    const handleLockJd = async (e, jdId) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc muốn khoá JD này?')) return;
        try {
            await jobService.deleteJd(jdId);
            setJdList(prev => prev.map(jd => jd.id === jdId ? { ...jd, status: 'LOCK' } : jd));
            emitJdEvent('jd:locked', jdId, 'LOCK');
            toast.success("Đã khoá JD thành công");
        } catch {
            toast.error("Không thể khoá JD");
        }
    };

    const handleCloseJd = async (e, jdId) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc muốn đóng bài đăng này?')) return;
        try {
            await jobService.closedJd(jdId);
            setJdList(prev => prev.map(jd => jd.id === jdId ? { ...jd, status: 'CLOSED' } : jd));
            emitJdEvent('jd:closed', jdId, 'CLOSED');
            toast.success('Đã đóng JD thành công');
        } catch {
            toast.error('Không thể đóng JD');
        }
    };

    const handleReopenJd = async (e, jdId) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc muốn đăng lại bài đăng này?')) return;
        try {
            await jobService.repostJob(jdId);
            setJdList(prev => prev.map(jd => jd.id === jdId ? { ...jd, status: 'OPEN' } : jd));
            emitJdEvent('jd:reposted', jdId, 'OPEN');
            setActiveMenu(null);
            await fetchJdList();
            toast.success('Đã đăng lại bài đăng thành công');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể đăng lại bài đăng');
        }
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
            <Toaster richColors position="top-right" />

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
                        {paginatedJdList.map(jd => (
                            <div key={jd.id} className={`jd-card status-${jd.status?.toLowerCase()}`}>
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
                                            <h2 className="position-title">{jd.position}</h2>
                                            <span className={`status-badge ${jd.status}`}>{STATUS_LABELS[jd.status] || jd.status}</span>
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
                                                                <XCircle size={14} /> Đóng bài
                                                            </button>
                                                        </>
                                                    )}

                                                    {jd.status === 'CLOSED' && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${jd.id}/potential`); }}>
                                                                <Target size={14} /> Săn nhân tài
                                                            </button>
                                                            <button className="text-success" onClick={(e) => handleReopenJd(e, jd.id)}>
                                                                <RefreshCcw size={14} /> Đăng lại bài
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
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="jd-pagination">
                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Trước
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
                                Sau
                            </button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default JdList;