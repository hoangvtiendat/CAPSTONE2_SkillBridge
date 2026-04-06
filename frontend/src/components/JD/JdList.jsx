import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import companyMemberService from '../../services/api/companyMemberService';
import './JdList.css';
import { useAuth } from '../../context/AuthContext';
import { Zap } from 'lucide-react';

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

    const handGetJdList = useCallback(async () => {
        try {
            const data = await jobService.getMyJd_of_Company(token);
            setJdList(data.result || []);
        } catch (error) {
            if (!hasShownError.current) {
                toast.error("Lỗi khi tải dữ liệu", { style: toastStyles.error });
                hasShownError.current = true;
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handGetRole = useCallback(async () => {
        try {
            const roleOfUser = await companyMemberService.getCompanyMembersRole(token);
            setRole(roleOfUser);
        } catch (error) {
            console.error("Lỗi xác định vai trò:", error);
        }
    }, [token]);

    const handleDeleteJd = async (e, jdId) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn khóa công việc này không?')) return;
        try {
            await jobService.deleteJd(jdId);

            // QUAN TRỌNG: Cập nhật status thay vì filter xóa hẳn để bộ lọc "DELETE" vẫn tìm thấy
            setJdList(prev => prev.map(jd =>
                jd.id === jdId ? { ...jd, status: 'DELETE' } : jd
            ));

            toast.success("Thành công", { description: "Đã khóa JD thành công!", style: toastStyles.success });
        } catch (error) {
            toast.error("Lỗi", { description: "Không thể khóa JD", style: toastStyles.error });
        }
    };

    const handleViewApplicants = (e, jdId) => {
        if (e) e.stopPropagation();
        navigate(`/recruiter/jobs/${jdId}/applications`);
    };

    const handleHuntTalents = (e, jdId) => {
        if (e) e.stopPropagation();
        navigate(`/recruiter/jobs/${jdId}/potential`);
    };

    const handleViewDetails = (e, jd) => {
        if (e) e.stopPropagation();
        navigate(`/detail-jd/${jd.id}`);
    };

    useEffect(() => {
        handGetJdList();
        handGetRole();
    }, [handGetJdList, handGetRole]);

    const filteredJdList = jdList.filter(jd => {
        const matchesSearch = jd.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             jd.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Fix lọc: Status DELETE hoặc LOCK đều hiển thị khi chọn tab DELETE
        const currentStatus = (jd.status === 'LOCK' || jd.status === 'DELETE') ? 'DELETE' : jd.status;
        const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        ALL: jdList.length,
        OPEN: jdList.filter(jd => jd.status === 'OPEN').length,
        PENDING: jdList.filter(jd => jd.status === 'PENDING').length,
        DELETE: jdList.filter(jd => jd.status === 'DELETE' || jd.status === 'LOCK').length,
        CLOSED: jdList.filter(jd => jd.status === 'CLOSED').length
    };

    return (
        <main className="jd-list-container">
            <Toaster position="top-right" />

            <div className="jd-header-container">
                <h1 className="jd-list-title">Danh sách JD của công ty</h1>
                <div className="header-actions">
                    {user && <button className="create-jd-button" onClick={() => navigate('/create-jd')}>Tạo JD mới</button>}
                    {role === 'ADMIN' && (
                        <button className="subscription-button" onClick={() => navigate('/company/subscriptions')}>
                            Đăng ký gói dịch vụ
                        </button>
                    )}
                </div>
            </div>

            <div className="jd-filter-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm vị trí..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="status-filters">
                    {['ALL', 'OPEN', 'PENDING', 'DELETE', 'CLOSED'].map(s => (
                        <button
                            key={s}
                            className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s} ({statusCounts[s]})
                        </button>
                    ))}
                </div>
            </div>

            {!loading && (
                <ul className="jd-list">
                    {filteredJdList.map(jd => (
                        <li key={jd.id} className={`jd-item status-${jd.status.toLowerCase()}`} onClick={(e) => handleViewDetails(e, jd)}>
                            <div className="jd-header">
                                <img src={jd.company.logoUrl} alt="logo" className="jd-company-logo" />
                                <div className="jd-header-info">
                                    <h2 className="jd-title">{jd.position}</h2>
                                    <p className="jd-company-name">{jd.company.name}</p>
                                </div>
                            </div>

                            <div className="jd-details-wrapper">
                                <div className="jd-section-content">
                                    <h3>Địa điểm</h3>
                                    <p>{jd.location}</p>
                                </div>
                                <div className="jd-section-content">
                                    <h3>Mô tả</h3>
                                    <p className="text-truncate">{jd.description}</p>
                                </div>
                            </div>

                            <div className="jd-actions">
                                <button className="btn-info-glass" onClick={(e) => handleViewDetails(e, jd)}>Thông tin</button>
                                <button className="view-applicants-btn" onClick={(e) => handleViewApplicants(e, jd.id)}>Ứng viên</button>
                                <button className="hunt-talents-btn" onClick={(e) => handleHuntTalents(e, jd.id)}>
                                    Săn tài năng
                                </button>
                                {jd.status !== "DELETE" && jd.status !== "LOCK" && (
                                    <span className="deleted-label">
                                        <button onClick={(e) => handleDeleteJd(e, jd.id)}>Khóa</button>
                                    </span>
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