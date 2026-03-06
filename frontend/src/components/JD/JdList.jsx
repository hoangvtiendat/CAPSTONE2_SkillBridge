import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast, Toaster } from 'sonner'; 
import { useNavigate } from 'react-router-dom'; 
import jobService from '../../services/api/jobService';
import companyMemberService from '../../services/api/companyMemberService';
import './JdList.css';
import { useAuth } from '../../context/AuthContext';

 const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const JdList = () => {
    const { user, token } = useAuth();
    const [jdList, setJdList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJd, setSelectedJd] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [role , setRole] = useState(null);
    const navigate = useNavigate(); 

    const hasShownError = useRef(false);

    const handGetJdList = useCallback(async () => {
        try {
            const data = await jobService.getMyJd_of_Company(token);
            setJdList(data.result);
        } catch (error) {
            if (!hasShownError.current) {
                const errorMessage = error.response?.data?.message || 'Không thể tải danh sách JD';
                toast.error("Lỗi khi tải dữ liệu", { 
                    description: errorMessage, 
                    style: toastStyles.error 
                });
                
                hasShownError.current = true;
            }
        } finally {
            setLoading(false);
        }
    }, [token]); 
    const handGetRole = async () => {
        try {
            const roleOfUser = await companyMemberService.getCompanyMembersRole(token);
            setRole(roleOfUser);
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || 'Không thể xác định vai trò người dùng';
            toast.error("Lỗi khi xác định vai trò", { 
                description: errorMessage, 
                style: toastStyles.error 
            });
        }
    }
    const handleDeleteJd = async (e, jdId) => {
        e.stopPropagation();
        
        if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) return;

        try {
            await jobService.deleteJd(jdId); 
            setJdList(prevJdList => prevJdList.filter(jd => jd.id !== jdId));
            
            toast.success("Thành công", { description: "Xóa JD thành công!", style: toastStyles.success });
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error("Lỗi khi xóa", { description: error.response.data.message, style: toastStyles.error });
            } else {
                toast.error("Lỗi khi xóa", { description: "Không thể xóa JD", style: toastStyles.error });
            }
        }
    };

    const handleViewDetails = (e, jd) => {
        if (e) e.stopPropagation(); 
        setSelectedJd(jd);
        navigate(`/detail-jd/${jd.id}`);
    };

    const handleCreateJd = () => {
        navigate('/create-jd');
    };

     const filteredJdList = jdList.filter(jd => {
         const matchesSearch = 
            jd.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            jd.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            jd.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            jd.description?.toLowerCase().includes(searchTerm.toLowerCase());

         const matchesStatus = statusFilter === 'ALL' || jd.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

     const statusCounts = {
        ALL: jdList.length,
        OPEN: jdList.filter(jd => jd.status === 'OPEN').length,
        PENDING: jdList.filter(jd => jd.status === 'PENDING').length,
        DELETE: jdList.filter(jd => jd.status === 'DELETE').length,
        CLOSED: jdList.filter(jd => jd.status === 'CLOSED').length
    };
  
    useEffect(() => {
        handGetJdList();
        handGetRole();
    }, [handGetJdList]);

    return (
        <main className="jd-list-container">
            <Toaster position="top-right" />

            <div className="jd-header-container">
                <h1 className="jd-list-title">Danh sách JD của công ty</h1>
                <div className="header-actions">
                    {user && (
                        <button className="create-jd-button" onClick={handleCreateJd}>Tạo JD mới</button>
                    )}
                    {role === 'ADMIN' && (
                        <button className="subscription-button" onClick={() => navigate('/company/subscriptions')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Đăng ký gói dịch vụ
                        </button>
                    )}
                </div>
            </div>

            {/* Search và Filter */}
            <div className="jd-filter-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo vị trí, công ty, địa điểm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button 
                            className="clear-search"
                            onClick={() => setSearchTerm('')}
                            aria-label="Xóa tìm kiếm"
                        >
                            ×
                        </button>
                    )}
                </div>

                <div className="status-filters">
                    <button
                        className={`filter-btn ${statusFilter === 'ALL' ? 'OPEN' : ''}`}
                        onClick={() => setStatusFilter('ALL')}
                    >
                        Tất cả ({statusCounts.ALL})
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'OPEN' ? 'OPEN' : ''}`}
                        onClick={() => setStatusFilter('OPEN')}
                    >
                        Đang hoạt động ({statusCounts.OPEN})
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'PENDING' ? 'OPEN' : ''}`}
                        onClick={() => setStatusFilter('PENDING')}
                    >
                        Chờ duyệt ({statusCounts.PENDING})
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'DELETE' ? 'OPEN' : ''}`}
                        onClick={() => setStatusFilter('DELETE')}
                    >
                        Xóa ({statusCounts.DELETE})
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'CLOSED' ? 'OPEN' : ''}`}
                        onClick={() => setStatusFilter('CLOSED')}
                    >
                        Đã đóng ({statusCounts.CLOSED})
                    </button>
                </div>
            </div>

            {loading && <p className="loading-text">Đang tải dữ liệu...</p>}
            {!loading && filteredJdList.length === 0 && (
                <p className="empty-state">
                    {searchTerm || statusFilter !== 'ALL' 
                        ? 'Không tìm thấy JD phù hợp với bộ lọc.' 
                        : 'Không có JD nào.'}
                </p>
            )}

            {!loading && filteredJdList.length > 0 && (
                <ul className="jd-list">
                    {filteredJdList.map(jd => (
                        <li 
                            key={jd.id} 
                            className={`jd-item ${selectedJd?.id === jd.id ? 'selected' : ''}`} 
                            onClick={(e) => handleViewDetails(e, jd)}
                        >
                            <div className="jd-header">
                                <img src={jd.company.logoUrl} alt={`${jd.company.name} logo`} className="jd-company-logo" />
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
                                    <h3>Mô tả công việc</h3>
                                    <p className="text-truncate">{jd.description}</p>
                                </div>
                                
                                <div className="jd-section-content">
                                    <h3>Kỹ năng yêu cầu</h3>
                                    <ul className="jd-skills-list">
                                        {jd.skills.map((skill, index) => (
                                            <li key={index} className={skill.required ? 'required-skill' : ''}>
                                                {skill.name} {skill.required && <span className="req-badge">Bắt buộc</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="jd-actions">
                                <button onClick={(e) => handleViewDetails(e, jd)}>Xem thông tin</button>
                                <button onClick={(e) => handleDeleteJd(e, jd.id)}>Xóa</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
};

export default JdList;