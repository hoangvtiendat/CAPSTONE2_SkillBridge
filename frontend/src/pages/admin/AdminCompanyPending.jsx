import React, { useState, useEffect, useCallback, useRef } from 'react';
import companyService from '../../services/api/companyService';
import './AdminCompanyPending.css';
import '../../components/admin/Admin.css';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from "sonner";
import {
    Building2, RotateCcw, ShieldCheck, CheckCircle,
    Globe, Hash, Calendar, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';

const API_BASE_URL = "http://localhost:8081/identity";
const AdminCompanyPending = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    const [pagination, setPagination] = useState({
        page: 0,
        totalPages: 0,
        totalElements: 0
    });

    const navigate = useNavigate();

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        console.log("aaa: ", `${baseUrl}${cleanPath}`)
        return `${baseUrl}${cleanPath}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN'); // Trả về dạng DD/MM/YYYY
    };

    const fetchCompanies = useCallback(async (pageIdx) => {
        setLoading(true);
        try {
            const response = await companyService.getCompanyFeedPending(pageIdx, 6);
            const data = response?.result || {};
            const newList = data.companies || [];

            setCompanies(newList);
            setPagination({
                page: data.currentPage || 0,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0
            });
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Không thể tải danh sách công ty");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies(0);
    }, [fetchCompanies]);

    const handleApprove = async (e, id) => {
        e.stopPropagation();
        const toastId = toast.loading("Đang duyệt doanh nghiệp...");
        try {
            await companyService.responseCompanyPending(id, "ACTIVE");
            setCompanies(prev => prev.filter(c => c.id !== id));
            toast.success("Doanh nghiệp đã được kích hoạt!", { id: toastId });
        } catch (err) {
            toast.error("Thao tác thất bại", { id: toastId });
        }
    };

    const handleBan = async (e, id) => {
        e.stopPropagation();
        const actionText = "từ chối";
        if (!window.confirm(`Bạn chắc chắn muốn ${actionText} doanh nghiệp này?`)) return;

        const toastId = toast.loading("Đang xử lý...");
        try {
            await companyService.responseCompanyPending(id, "BAN");
            setCompanies(prev => prev.filter(c => c.id !== id));
            toast.success("Đã từ chối doanh nghiệp!", { id: toastId });
        } catch (err) {
            toast.error("Thao tác thất bại", { id: toastId });
        }
    };

    return (
        <div className="admin-pending-container">
            <Toaster position="top-right" richColors />

            <div className="admin-pending-header">
                <div className="header-left">
                    <div className="header-icon-box blue">
                        <ShieldCheck size={24} />
                    </div>
                    <div className="title-group">
                        <h1>Phê duyệt Doanh nghiệp</h1>
                        <p>Xác minh pháp nhân mới tham gia hệ thống <span>({companies.length} yêu cầu)</span></p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="filter-wrapper">
                        <button
                            className={`btn-refresh ${loading ? 'spinning' : ''}`}
                            onClick={() => fetchCompanies(0)}
                            disabled={loading}
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="pending-content-card">
                <div className="table-scroll-container">
                    <table className="pending-table-core">
                        <thead>
                            <tr>
                                <th style={{ width: '320px' }}>DOANH NGHIỆP</th>
                                <th style={{ width: '150px' }} className="center">MÃ SỐ THUẾ</th>
                                <th style={{ width: '220px' }}>LIÊN HỆ</th>
                                <th style={{ width: '140px' }} className="center">NGÀY TẠO</th>
                                <th style={{ width: '200px' }} className="center">THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((comp) => (
                                <tr key={comp.id} className="job-row-item"
                                    onClick={() => navigate(`/admin/companies/${comp.id}`)}>
                                    <td>
                                        <div className="company-main-info">
                                            <div className="company-logo-box">
                                                {comp.imageUrl ? (
                                                    <img src={getImageUrl(comp.imageUrl)} alt="logo" />
                                                ) : (
                                                    <Building2 size={20} />
                                                )}
                                            </div>
                                            <div className="job-detail-box">
                                                <span className="job-name">{comp.name}</span>
                                                <div className="job-loc">
                                                    <Globe size={12} />
                                                    <span>{comp.websiteUrl || 'Chưa cập nhật'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="center">
                                        <div className="tax-code-badge">
                                            <Hash size={12} />
                                            <span>{comp.taxId || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-info-cell">
                                            <span className="email-text">{comp.email}</span>
                                            <span className="phone-text">{comp.phoneNumber}</span>
                                        </div>
                                    </td>
                                    <td className="center timestamp">
                                        {formatDate(comp.createdAt)}
                                    </td>
                                    <td className="center" onClick={(e) => e.stopPropagation()}>
                                        <div className="action-btns-group">
                                            <button className="btn-action-approve"
                                                onClick={(e) => handleApprove(e, comp.id)}>
                                                <CheckCircle size={14} /> Duyệt
                                            </button>
                                            <button className="btn-action-reject"
                                                onClick={(e) => handleBan(e, comp.id)}>
                                                Từ chối
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Page based pagination control */}
                    {pagination.totalPages > 1 && (
                        <div className="modern-pagination">
                            <div className="pagination-info">
                                Đang xem trang <b>{pagination.page + 1} / {pagination.totalPages}</b>
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
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => fetchCompanies(index)}
                                            className={`pagination-btn ${pagination.page === index ? 'active' : ''}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
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
            </div>
        </div>
    );
};

export default AdminCompanyPending;