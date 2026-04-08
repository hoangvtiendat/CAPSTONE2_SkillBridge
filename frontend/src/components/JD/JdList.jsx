import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import companyMemberService from '../../services/api/companyMemberService';
import './JdList.css';
import { useAuth } from '../../context/AuthContext';
import { Zap } from 'lucide-react';

const STATUS_LABELS = {
    ALL: 'Tất cả',
    OPEN: 'Đang mở',
    PENDING: 'Đang chờ',
    LOCK: 'Đã khoá',
    CLOSED: 'Đã đóng'
};

const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const JdList = () => {
    const { user, token } = useAuth();

    const [jdList, setJdList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [role, setRole] = useState(null);

    const navigate = useNavigate();
    const hasShownError = useRef(false);

    /* ================= FETCH ================= */
    const fetchJdList = useCallback(async () => {
        try {
            const res = await jobService.getMyJd_of_Company(token);
            setJdList(res.result || []);
        } catch (error) {
            if (!hasShownError.current) {
                toast.error("Lỗi khi tải dữ liệu", {
                    description: error.response?.data?.message || '',
                    style: toastStyles.error
                });
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
            toast.error("Không xác định được role", { style: toastStyles.error });
        }
    }, [token]);

    useEffect(() => {
        fetchJdList();
        fetchRole();
    }, [fetchJdList, fetchRole]);

    /* ================= ACTION ================= */
    const handleViewDetails = (e, jd) => {
        e.stopPropagation();
        navigate(`/detail-jd/${jd.id}`);
    };

    const handleViewApplicants = (e, jdId) => {
        e.stopPropagation();
        navigate(`/recruiter/jobs/${jdId}/applications`);
    };

    const handleHuntTalents = (e, jdId) => {
        e.stopPropagation();
        navigate(`/recruiter/jobs/${jdId}/potential`);
    };

    const handleLockJd = async (e, jdId) => {
        e.stopPropagation();

        if (!window.confirm('Bạn có chắc muốn khoá JD này?')) return;

        try {
            await jobService.deleteJd(jdId);

            // update UI ngay (không reload)
            setJdList(prev =>
                prev.map(jd =>
                    jd.id === jdId ? { ...jd, status: 'LOCK' } : jd
                )
            );

            toast.success("Đã khoá JD", { style: toastStyles.success });
        } catch {
            toast.error("Không thể khoá JD", { style: toastStyles.error });
        }
    };

    /* ================= FILTER ================= */
    const filteredJdList = jdList.filter(jd => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            jd.position?.toLowerCase().includes(search) ||
            jd.company?.name?.toLowerCase().includes(search) ||
            jd.location?.toLowerCase().includes(search) ||
            jd.description?.toLowerCase().includes(search);

        const matchesStatus =
            statusFilter === 'ALL' || jd.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        ALL: jdList.length,
        OPEN: jdList.filter(j => j.status === 'OPEN').length,
        PENDING: jdList.filter(j => j.status === 'PENDING').length,
        LOCK: jdList.filter(j => j.status === 'LOCK').length,
        CLOSED: jdList.filter(j => j.status === 'CLOSED').length
    };

    /* ================= RENDER ================= */
    return (
        <main className="jd-list-container">
            <Toaster position="top-right" />

            {/* HEADER */}
            <div className="jd-header-container">
                <h1 className="jd-list-title">Danh sách JD của công ty</h1>

                <div className="header-actions">
                    {user && (
                        <button
                            className="create-jd-button"
                            onClick={() => navigate('/create-jd')}
                        >
                            Tạo JD mới
                        </button>
                    )}

                    {role === 'ADMIN' && (
                        <button
                            className="subscription-button"
                            onClick={() => navigate('/company/subscriptions')}
                        >
                            <Zap size={16} /> Đăng ký gói
                        </button>
                    )}
                </div>
            </div>

            {/* FILTER */}
            <div className="jd-filter-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm JD..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="status-filters">
                    {Object.keys(STATUS_LABELS).map(s => (
                        <button
                            key={s}
                            className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {STATUS_LABELS[s]} ({statusCounts[s] || 0})
                        </button>
                    ))}
                </div>
            </div>

            {/* STATES */}
            {loading && <p className="loading-text">Đang tải...</p>}

            {!loading && filteredJdList.length === 0 && (
                <p className="empty-state">Không có JD phù hợp</p>
            )}

            {/* LIST */}
            {!loading && filteredJdList.length > 0 && (
                <ul className="jd-list">
                    {filteredJdList.map(jd => (
                        <li
                            key={jd.id}
                            className={`jd-item status-${jd.status?.toLowerCase()}`}
                            onClick={(e) => handleViewDetails(e, jd)}
                        >
                            {/* HEADER */}
                            <div className="jd-header">
                                <img
                                    src={jd.company?.logoUrl}
                                    alt="logo"
                                    className="jd-company-logo"
                                />
                                <div className="jd-header-info">
                                    <h2 className="jd-title">{jd.position}</h2>
                                    <p className="jd-company-name">{jd.company?.name}</p>
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div className="jd-details-wrapper">
                                <div className="jd-section-content">
                                    <h3>Địa điểm</h3>
                                    <p>{jd.location}</p>
                                </div>

                                <div className="jd-section-content">
                                    <h3>Mô tả</h3>
                                    <p className="text-truncate">{jd.description}</p>
                                </div>

                                <div className="jd-section-content">
                                    <h3>Kỹ năng</h3>
                                    <ul className="jd-skills-list">
                                        {jd.skills?.map((s, i) => (
                                            <li key={i} className={s.required ? 'required-skill' : ''}>
                                                {s.name}
                                                {s.required && <span className="req-badge">Bắt buộc</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* ACTION */}
                            <div className="jd-actions">
                                <button onClick={(e) => handleViewDetails(e, jd)}>
                                    Thông tin
                                </button>

                                <button
                                    className="view-applicants-btn"
                                    onClick={(e) => handleViewApplicants(e, jd.id)}
                                >
                                    Ứng viên
                                </button>

                                <button
                                    className="hunt-talents-btn"
                                    onClick={(e) => handleHuntTalents(e, jd.id)}
                                >
                                    Săn tài năng
                                </button>

                                {jd.status !== 'LOCK' && (
                                    <button onClick={(e) => handleLockJd(e, jd.id)}>
                                        Khoá
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
};

export default JdList;