import React, { useState, useEffect, useCallback } from 'react';
import companyService from '../../services/api/companyService';
import './AdminCompanyPending.css';
import '../../components/admin/Admin.css';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from "sonner";
import {
    Building2, RotateCcw, ShieldCheck, CheckCircle,
    Globe, Hash, ChevronLeft, ChevronRight, XCircle
} from 'lucide-react';

const API_BASE_URL = "http://localhost:8081/identity";

const AdminCompanyPending = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
    const navigate = useNavigate();

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    };

    const fetchCompanies = useCallback(async (pageIdx) => {
        setLoading(true);
        try {
            const response = await companyService.getCompanyFeedPending(pageIdx, 6);
            const data = response?.result || {};
            setCompanies(data.companies || []);
            setPagination({
                page: data.currentPage || 0,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0
            });
        } catch (err) {
            toast.error("Không thể tải danh sách công ty");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCompanies(0); }, [fetchCompanies]);

    const handleTaxLookup = (e, taxId) => {
        e.stopPropagation();
        if (!taxId) return toast.error("Công ty này không có mã số thuế");
        navigate(`/admin/tax-lookup?taxCode=${taxId}`);
    };

    const handleApprove = async (e, id) => {
        e.stopPropagation();
        const toastId = toast.loading("Đang duyệt doanh nghiệp...");
        try {
            await companyService.responseCompanyPending(id, "ACTIVE");
            setCompanies(prev => prev.filter(c => c.id !== id));
            toast.success("Doanh nghiệp đã được kích hoạt!", { id: toastId });
        } catch (err) { toast.error("Thao tác thất bại", { id: toastId }); }
    };

    const handleReject = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm(`Bạn chắc chắn muốn từ chối doanh nghiệp này?`)) return;
        const toastId = toast.loading("Đang xử lý...");
        try {
            await companyService.responseCompanyPending(id, "BAN");
            setCompanies(prev => prev.filter(c => c.id !== id));
            toast.success("Đã từ chối doanh nghiệp!", { id: toastId });
        } catch (err) { toast.error("Thao tác thất bại", { id: toastId }); }
    };

    return (
        <div className="admin-pending-container animate-fade-in">
            <Toaster position="top-right" richColors />

            <div className="admin-pending-header">
                <div className="header-left">
                    <div className="header-icon-box blue">
                        <ShieldCheck size={26} />
                    </div>
                    <div className="title-group">
                        <h1>Phê duyệt Doanh nghiệp</h1>
                        <p>Xác minh pháp nhân mới tham gia hệ thống <span>({pagination.totalElements} yêu cầu)</span></p>
                    </div>
                </div>
                <div className="header-right">
                    <button className={`btn-refresh ${loading ? 'spinning' : ''}`} onClick={() => fetchCompanies(0)} disabled={loading}>
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="pending-content-card">
                <div className="table-scroll-container">
                    <table className="pending-table-core">
                        <thead>
                            <tr>
                                <th>DOANH NGHIỆP</th>
                                <th>MÃ SỐ THUẾ</th>
                                <th>LIÊN HỆ</th>
                                <th>NGÀY TẠO</th>
                                <th>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((comp) => (
                                <tr key={comp.id} className="job-row-item" onClick={() => navigate(`/admin/companies/${comp.id}`)}>
                                    <td>
                                        <div className="company-main-info">
                                            <div className="company-logo-box">
                                                {comp.imageUrl ? <img src={getImageUrl(comp.imageUrl)} alt="logo" /> : <Building2 size={20} />}
                                            </div>
                                            <div className="job-detail-box">
                                                <span className="job-name">{comp.name}</span>
                                                <div className="job-loc"><Globe size={12} /><span>{comp.websiteUrl || 'No website'}</span></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="center">
                                        <div className="tax-code-text"><b>{comp.taxId || 'N/A'}</b></div>
                                    </td>
                                    <td>
                                        <div className="contact-info-cell">
                                            <span className="email-text">{comp.email}</span>
                                            <span className="phone-text">{comp.phoneNumber}</span>
                                        </div>
                                    </td>
                                    <td className="center timestamp">{new Date(comp.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="center" onClick={(e) => e.stopPropagation()}>
                                        <div className="action-btns-group">
                                            <button className="btn-action-lookup" onClick={(e) => handleTaxLookup(e, comp.taxId)}>
                                                <Hash size={14} /> Tra cứu
                                            </button>
                                            <button className="btn-action-approve" onClick={(e) => handleApprove(e, comp.id)}>
                                                <CheckCircle size={14} /> Duyệt
                                            </button>
                                            <button className="btn-action-reject" onClick={(e) => handleReject(e, comp.id)}>
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {pagination.totalPages > 1 && (
                        <div className="modern-pagination">
                            <div className="pagination-info">Trang <b>{pagination.page + 1} / {pagination.totalPages}</b></div>
                            <div className="pagination-controls">
                                <button disabled={pagination.page === 0} onClick={() => fetchCompanies(pagination.page - 1)} className="pagination-btn"><ChevronLeft size={18} /></button>
                                <button disabled={pagination.page >= pagination.totalPages - 1} onClick={() => fetchCompanies(pagination.page + 1)} className="pagination-btn"><ChevronRight size={18} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCompanyPending;