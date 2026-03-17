import React, { useState, useEffect, useCallback, useRef } from 'react';
import companyService from '../../services/api/companyService';
import './AdminCompanyPending.css';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from "sonner";
import {
    Building2, RotateCcw, ShieldCheck, CheckCircle,
    Globe, Hash, Calendar, MapPin
} from 'lucide-react';

const AdminCompanyPending = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const navigate = useNavigate();
    const observerTarget = useRef(null);

    const fetchCompanies = useCallback(async (currentCursor = null, isReset = false) => {
        if (loading && !isReset) return;
        setLoading(true);
        try {
            const response = await companyService.getCompanyFeedPending(currentCursor, 10);
            const data = response?.result || {};
            const newList = data.companies || [];
            setCompanies(prev => isReset ? newList : [...prev, ...newList]);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Không thể tải danh sách công ty");
        } finally {
            setLoading(false);
        }
    }, [loading]);

    useEffect(() => {
        fetchCompanies(null, true);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    fetchCompanies(cursor);
                }
            },
            { threshold: 0.1 }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [fetchCompanies, cursor, hasMore, loading]);

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
                            onClick={() => fetchCompanies(null, true)}
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
                                <tr key={comp.id} className="job-row-item" onClick={() => navigate(`/admin/companies/${comp.id}`)}>
                                    <td>
                                        <div className="company-main-info">
                                            <div className="company-logo-box">
                                                {comp.imageUrl ? <img src={comp.imageUrl} alt="logo" /> : <Building2 size={20} />}
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
                                    <td className="center timestamp">12/03/2026</td>
                                    <td className="center" onClick={(e) => e.stopPropagation()}>
                                        <div className="action-btns-group">
                                            <button className="btn-action-approve" onClick={(e) => handleApprove(e, comp.id)}>
                                                <CheckCircle size={14} /> Duyệt
                                            </button>
                                            <button className="btn-action-reject" onClick={(e) => handleBan(e, comp.id)}>
                                                Từ chối
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            <tr ref={observerTarget}>
                                <td colSpan="5" className="loader-row center">
                                    {loading ? (
                                        <div className="loading-state-mini">
                                            <RotateCcw size={16} className="spinning" /> Đang tải...
                                        </div>
                                    ) : hasMore ? (
                                        <span className="load-more-text">Cuộn để tải thêm</span>
                                    ) : (
                                        <span className="end-text">Đã hiển thị toàn bộ doanh nghiệp</span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCompanyPending;