import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Building2,
    Ban,
    CheckCircle,
    ExternalLink,
    Eye,
    Globe,
    MapPin,
    FileCheck2,
    Filter,
    Shield,
    X,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import adminService from '../../services/api/adminService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import '../../components/admin/Admin.css';

const CompanyManagementPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 5,
        totalElements: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        name: '',
        taxId: '',
        status: ''
    });

    const fetchCompanies = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const data = await adminService.getCompanies({
                page,
                size: pagination.size,
                ...filters
            });
            if (data && data.result) {
                setCompanies(data.result.content);
                setPagination(prev => ({
                    ...prev,
                    page: data.result.number,
                    totalElements: data.result.totalElements,
                    totalPages: data.result.totalPages
                }));
            }
        } catch (error) {
            toast.error("Không thể tải danh sách công ty");
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.size]);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleBanCompany = async (id, name) => {
        const result = await Swal.fire({
            title: 'Xác nhận khóa?',
            text: `Bạn có chắc chắn muốn khóa công ty "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Có, khóa ngay',
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
                await adminService.banCompany(id);
                toast.success("Đã khóa công ty thành công");
                fetchCompanies(pagination.page);
            } catch (error) {
                toast.error("Thao tác thất bại");
            }
        }
    };

    const handleUnbanCompany = async (id, name) => {
        const result = await Swal.fire({
            title: 'Xác nhận mở khóa?',
            text: `Bạn có muốn mở khóa cho công ty "${name}" không?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Có, mở khóa',
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
                await adminService.unbanCompany(id);
                toast.success("Đã mở khóa công ty thành công");
                fetchCompanies(pagination.page);
            } catch (error) {
                toast.error("Thao tác thất bại");
            }
        }
    };

    const handleViewDetail = async (id) => {
        setDetailLoading(true);
        setIsDetailOpen(true);
        try {
            const data = await adminService.getCompanyDetail(id);
            if (data && data.result) {
                setSelectedCompany(data.result);
            }
        } catch (error) {
            toast.error("Không thể lấy thông tin chi tiết");
            setIsDetailOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'VERIFIED': return { backgroundColor: '#ecfdf5', color: '#059669' };
            case 'BANNED': return { backgroundColor: '#fef2f2', color: '#dc2626' };
            case 'PENDING': return { backgroundColor: '#fffbeb', color: '#d97706' };
            default: return { backgroundColor: '#f8fafc', color: '#64748b' };
        }
    };

    return (
        <div className="company-management animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Quản lý công ty</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Kiểm soát chất lượng và trạng thái hoạt động của các doanh nghiệp.</p>
                </div>
            </div>

            <div className="modern-card">
                <div className="filters-bar">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm tên công ty..."
                            className="modern-input"
                            value={filters.name}
                            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>
                    <div className="filters-group">
                        <div className="filter-item">
                            <FileCheck2 size={14} className="filter-icon" />
                            <input
                                type="text"
                                placeholder="Mã số thuế..."
                                className="modern-select"
                                style={{ width: '150px', paddingLeft: '38px' }}
                                value={filters.taxId}
                                onChange={(e) => setFilters(prev => ({ ...prev, taxId: e.target.value }))}
                            />
                        </div>
                        <div className="filter-item">
                            <Filter size={14} className="filter-icon" />
                            <select
                                className="modern-select"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="VERIFIED">Đã xác thực</option>
                                <option value="BANNED">Đã khóa</option>
                                <option value="PENDING">Chờ duyệt</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    {loading && (
                        <div className="table-loader-overlay">
                            <Loader2 className="spinning-icon" size={40} />
                        </div>
                    )}
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Doanh nghiệp</th>
                                <th>Mã số thuế</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length > 0 ? (
                                companies.map((company) => (
                                    <tr key={company.id} className="table-row-hover">
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-avatar-wrapper" style={{ borderRadius: '12px' }}>
                                                    {company.imageUrl ? (
                                                        <img src={company.imageUrl} className="user-avatar" alt="" />
                                                    ) : (
                                                        <div className="user-avatar-placeholder" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                                                            <Building2 size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="user-details">
                                                    <p className="user-name">{company.name}</p>
                                                    <p className="user-email" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {company.description || "Chưa có mô tả"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{company.taxId}</p>
                                        </td>
                                        <td>
                                            <div className={`status-indicator ${company.status === 'VERIFIED' ? 'active' : company.status === 'BANNED' ? 'banned' : ''}`}>
                                                <div className="status-dot"></div>
                                                <span>
                                                    {company.status === 'VERIFIED' ? 'Đã xác thực' :
                                                        company.status === 'BANNED' ? 'Đã khóa' :
                                                            company.status === 'PENDING' ? 'Chờ duyệt' : company.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="actions-wrapper">
                                                <button
                                                    onClick={() => handleViewDetail(company.id)}
                                                    className="action-btn info-btn"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {company.status === 'BANNED' ? (
                                                    <button
                                                        onClick={() => handleUnbanCompany(company.id, company.name)}
                                                        className="action-btn unban-btn"
                                                        title="Mở khóa công ty"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBanCompany(company.id, company.name)}
                                                        className="action-btn ban-btn"
                                                        title="Khóa công ty"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : !loading && (
                                <tr>
                                    <td colSpan="5" className="empty-table-state">
                                        <div className="empty-content">
                                            <Building2 size={48} />
                                            <p>Không tìm thấy công ty nào phù hợp</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="modern-pagination">
                        <div className="pagination-info">
                            Tổng <b>{pagination.totalElements}</b> doanh nghiệp
                        </div>
                        <div className="pagination-controls">
                            <button
                                disabled={pagination.page === 0}
                                onClick={() => fetchCompanies(pagination.page - 1)}
                                className="pagination-btn"
                                title="Trang trước"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {[...Array(pagination.totalPages)].map((_, index) => {
                                // Show first, last, and pages around current
                                if (
                                    index === 0 ||
                                    index === pagination.totalPages - 1 ||
                                    (index >= pagination.page - 1 && index <= pagination.page + 1)
                                ) {
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => fetchCompanies(index)}
                                            className={`pagination-btn ${pagination.page === index ? 'active' : ''}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                } else if (
                                    index === pagination.page - 2 ||
                                    index === pagination.page + 2
                                ) {
                                    return <span key={index} className="pagination-ellipsis">...</span>;
                                }
                                return null;
                            })}

                            <button
                                disabled={pagination.page >= pagination.totalPages - 1}
                                onClick={() => fetchCompanies(pagination.page + 1)}
                                className="pagination-btn"
                                title="Trang sau"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Company Detail Modal */}
            {isDetailOpen && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsDetailOpen(false);
                    }}>
                    <div className="modern-card" style={{
                        width: '95%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        padding: 0,
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fcfcfd' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="icon-box-primary">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Chi tiết doanh nghiệp</h2>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Thông tin đầy đủ và trạng thái pháp lý</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="action-btn"
                                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                            {detailLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                                    <Loader2 className="spinning-icon" size={40} />
                                </div>
                            ) : selectedCompany ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {/* Top Section */}
                                    <div style={{ display: 'flex', gap: '24px' }}>
                                        <div className="user-avatar-wrapper" style={{ width: '120px', height: '120px', borderRadius: '24px', flexShrink: 0 }}>
                                            {selectedCompany.imageUrl ? (
                                                <img src={selectedCompany.imageUrl} className="user-avatar" alt="" />
                                            ) : (
                                                <div className="user-avatar-placeholder" style={{ fontSize: '40px' }}>
                                                    <Building2 size={48} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{selectedCompany.name}</h3>
                                                <div className={`status-indicator ${selectedCompany.status === 'VERIFIED' ? 'active' : selectedCompany.status === 'BANNED' ? 'banned' : ''}`}>
                                                    <div className="status-dot"></div>
                                                    <span>{selectedCompany.status === 'VERIFIED' ? 'Đã xác thực' : selectedCompany.status === 'BANNED' ? 'Đã khóa' : 'Chờ duyệt'}</span>
                                                </div>
                                            </div>
                                            <p style={{ margin: '8px 0', fontSize: '15px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileCheck2 size={16} /> MST: <b>{selectedCompany.taxId}</b>
                                            </p>
                                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                                {selectedCompany.websiteUrl && (
                                                    <a href={selectedCompany.websiteUrl} target="_blank" rel="noreferrer" className="action-btn" style={{ width: 'auto', padding: '0 16px', gap: '8px', fontSize: '13px', textDecoration: 'none' }}>
                                                        <Globe size={16} /> Website
                                                    </a>
                                                )}
                                                {selectedCompany.gpkdUrl && (
                                                    <a href={selectedCompany.gpkdUrl} target="_blank" rel="noreferrer" className="action-btn" style={{ width: 'auto', padding: '0 16px', gap: '8px', fontSize: '13px', textDecoration: 'none', background: '#f5f3ff', color: '#6366f1', borderColor: '#e0e7ff' }}>
                                                        <Shield size={16} /> Giấy phép kinh doanh
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: 0 }} />

                                    {/* Grid Info */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Thông tin liên hệ</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div className="date-cell">
                                                    <MapPin size={16} /> <span>{selectedCompany.address || 'Chưa cung cấp địa chỉ'}</span>
                                                </div>
                                                <div className="date-cell">
                                                    <Calendar size={16} /> <span>Ngày tham gia: {new Date(selectedCompany.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Mô tả doanh nghiệp</h4>
                                            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                                                {selectedCompany.description || "Doanh nghiệp này chưa cập nhật mô tả giới thiệu."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#fcfcfd' }}>
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="btn-primary"
                                style={{ borderRadius: '12px' }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CompanyManagementPage;
