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
import CompanyDetailModal from '../../components/admin/CompanyDetailModal';

const API_BASE_URL = "http://localhost:8081/identity";

const CompanyManagementPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
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

    const swalConfig = {
        buttonsStyling: false,
        customClass: {
            popup: 'premium-swal-popup',
            title: 'premium-swal-title',
            htmlContainer: 'premium-swal-text',
            confirmButton: 'premium-swal-confirm',
            cancelButton: 'premium-swal-cancel',
            icon: 'premium-swal-icon'
        }
    };

    const handleBanCompany = async (id, name) => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Xác nhận vô hiệu hóa?',
            text: `Bạn có chắc chắn muốn khóa hoạt động của công ty "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy',
            customClass: {
                ...swalConfig.customClass,
                confirmButton: 'premium-swal-confirm premium-swal-confirm-danger'
            }
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang xử lý khóa công ty...");
            try {
                await adminService.banCompany(id);
                toast.success("Đã khóa công ty thành công", { id: toastId });
                fetchCompanies(pagination.page);
            } catch (error) {
                toast.error("Thao tác thất bại", { id: toastId });
            }
        }
    };

    const handleUnbanCompany = async (id, name) => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Xác nhận khôi phục?',
            text: `Bạn có muốn mở khóa hoạt động cho công ty "${name}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang xử lý mở khóa...");
            try {
                await adminService.unbanCompany(id);
                toast.success("Đã mở khóa công ty thành công", { id: toastId });
                fetchCompanies(pagination.page);
            } catch (error) {
                toast.error("Thao tác thất bại", { id: toastId });
            }
        }
    };
    const handleTaxLookup = () => {
        if (!filters.taxId) {
            toast.warning("Vui lòng nhập mã số thuế để tra cứu");
            return;
        }
        window.location.href = `/admin/tax-lookup?taxCode=${filters.taxId}`;
    };
    const handleViewDetail = (id) => {
        setSelectedCompanyId(id);
        setIsDetailOpen(true);
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        console.log("aaa: ", `${baseUrl}${cleanPath}`)
        return `${baseUrl}${cleanPath}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACTIVE': return { backgroundColor: '#ecfdf5', color: '#059669' };
            case 'BAN': return { backgroundColor: '#fef2f2', color: '#dc2626' };
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
                                style={{
                                    width: '150px',
                                    paddingLeft: '38px',
                                    borderTopRightRadius: 0, // Bo góc phẳng để nối với nút
                                    borderBottomRightRadius: 0
                                }}
                                value={filters.taxId}
                                onChange={(e) => setFilters(prev => ({ ...prev, taxId: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleTaxLookup()} // Nhấn Enter để tra cứu
                            />
                            <button
                                onClick={handleTaxLookup}
                                className="action-btn"
                                title="Tra cứu pháp lý"
                                style={{
                                    height: '42px',
                                    borderRadius: '0 12px 12px 0',
                                    borderLeft: 'none',
                                    background: '#f8fafc',
                                    padding: '0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#6366f1'
                                }}
                            >
                                <Search size={16} />
                            </button>
                        </div>
                        <div className="filter-item">
                            <Filter size={14} className="filter-icon" />
                            <select
                                className="modern-select"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="ACTIVE">Đã xác thực</option>
                                <option value="BAN">Đã khóa</option>
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
                                                        <img src={getImageUrl(company.imageUrl )} className="user-avatar" alt="" />
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
                                            <div className={`status-indicator ${company.status === 'ACTIVE' ? 'active' : company.status === 'BAN' ? 'banned' : ''}`}>
                                                <div className="status-dot"></div>
                                                <span>
                                                    {company.status === 'ACTIVE' ? 'Đã xác thực' :
                                                        company.status === 'BAN' ? 'Đã khóa' :
                                                            company.status === 'PENDING' ? 'Chờ duyệt' : company.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="actions-wrapper">
                                                <button
                                                    onClick={() => window.location.href = `/admin/tax-lookup?taxCode=${company.taxId}`}
                                                    className="action-btn"
                                                    style={{ color: '#6366f1' }}
                                                    title="Tra cứu pháp lý"
                                                >
                                                    <Shield size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleViewDetail(company.id)}
                                                    className="action-btn info-btn"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {company.status === 'BAN' ? (
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
            <CompanyDetailModal 
                isOpen={isDetailOpen} 
                onClose={() => setIsDetailOpen(false)} 
                companyId={selectedCompanyId} 
            />
        </div>
    );
};

export default CompanyManagementPage;
