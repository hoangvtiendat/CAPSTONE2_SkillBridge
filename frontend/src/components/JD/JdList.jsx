import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import companyMemberService from '../../services/api/companyMemberService';
import './JdList.css';
import { useAuth } from '../../context/AuthContext';
import { Zap, Users, Search, Info, Lock, Target, Plus, CalendarPlus, MoreVertical } from 'lucide-react'; // Thêm MoreVertical

const API_BASE_URL = "http://localhost:8081/identity";

const STATUS_LABELS = {
    ALL: 'Tất cả',
    OPEN: 'Đang mở',
    PENDING: 'Chờ duyệt',
    LOCK: 'Đã khoá',
    CLOSED: 'Đóng'
};

const JdList = () => {
    const { user, token } = useAuth();
    const [jdList, setJdList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [role, setRole] = useState(null);

    // Quản lý menu 3 chấm nào đang mở
    const [activeMenu, setActiveMenu] = useState(null);

    const navigate = useNavigate();
    const hasShownError = useRef(false);

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
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

    useEffect(() => {
        fetchJdList();
        fetchRole();
    }, [fetchJdList, fetchRole]);

    const handleLockJd = async (e, jdId) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc muốn khoá JD này?')) return;
        try {
            await jobService.deleteJd(jdId);
            setJdList(prev => prev.map(jd => jd.id === jdId ? { ...jd, status: 'LOCK' } : jd));
            toast.success("Đã khoá JD thành công");
        } catch {
            toast.error("Không thể khoá JD");
        }
    };

    const filteredJdList = jdList.filter(jd => {
        const search = searchTerm.toLowerCase();
        return (jd.position?.toLowerCase().includes(search) ||
                jd.company?.name?.toLowerCase().includes(search)) &&
               (statusFilter === 'ALL' || jd.status === statusFilter);
    });

    return (
        <main className="jd-list-container">
            <Toaster richColors position="top-right" />

            <div className="jd-page-header">
                <div>
                    <h1 className="jd-list-title">Quản lý tuyển dụng</h1>
                    <p className="jd-subtitle">Hệ thống quản lý {jdList.length} tin đăng của công ty</p>
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
                        <button key={s} className={`status-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loader">Đang tải dữ liệu...</div>
            ) : (
                <div className="jd-grid">
                    {filteredJdList.map(jd => (
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
                                        <span className={`status-badge ${jd.status}`}>{jd.status}</span>
                                    </div>
                                </div>
                                <div className="jd-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Địa điểm:</span>
                                        <span className="meta-value">{jd.location}</span>
                                    </div>
                                    <p className="description-preview">{jd.description}</p>
                                </div>
                                <div className="skills-mini-list">
                                    {jd.skills?.slice(0, 3).map((s, i) => (
                                        <span key={i} className="skill-tag">{s.name}</span>
                                    ))}
                                </div>
                            </div>

                            {/* --- PHẦN ACTION ĐÃ SỬA --- */}
                            <div className="jd-card-actions">
                                {/* Luôn hiện nút Chi tiết */}
                                <button className="act-btn info" onClick={(e) => { e.stopPropagation(); navigate(`/detail-jd/${jd.id}`); }}>
                                    <Info size={16} />
                                </button>

                                {/* Luôn hiện nút CV */}
                                <button className="act-btn applicants" onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${jd.id}/applications`); }}>
                                    <Users size={16} /> <span>CV</span>
                                </button>

                                {/* Nếu là OPEN thì hiện 3 chấm, ngược lại không hiện gì thêm hoặc hiện nút Khóa nếu muốn */}
                                {jd.status === 'OPEN' ? (
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
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${jd.id}/potential`); }}>
                                                    <Target size={14} /> Săn nhân tài
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/jobs/${jd.id}/batch-slots`); }}>
                                                    <CalendarPlus size={14} /> Tạo lịch
                                                </button>
                                                <button className="text-danger" onClick={(e) => handleLockJd(e, jd.id)}>
                                                    <Lock size={14} /> Khóa tin
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Nếu không phải OPEN (ví dụ PENDING, CLOSED) và chưa LOCK thì vẫn cho nút Khóa nhanh
                                    jd.status !== 'LOCK' && (
                                        <button className="act-btn lock" onClick={(e) => handleLockJd(e, jd.id)}>
                                            <Lock size={16} />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};

export default JdList;