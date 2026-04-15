import React, { useState, useEffect, useCallback } from 'react';
import companyService from '../../services/api/companyService';
import './AdminCompanyPending.css';
import '../../components/admin/Admin.css';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import confirmAction from '../../utils/confirmAction';
import AppPagination from '../../components/common/AppPagination';
import TableActionBar from '../../components/common/TableActionBar';
import AppImage from '../../components/common/AppImage';
import FilterResetButton from '../../components/common/FilterResetButton';
import ManagementFilterBar from '../../components/common/ManagementFilterBar';
import { DEFAULT_COMPANY_IMAGE } from '../../utils/imageUtils';
import {
    ShieldCheck, CheckCircle, Filter,
    Globe, Hash
} from 'lucide-react';

const AdminCompanyPending = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState({
        page: 0,
        totalPages: 0,
        totalElements: 0
    });

    const navigate = useNavigate();

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
        const confirmed = await confirmAction({
            title: 'Từ chối doanh nghiệp?',
            text: `Bạn chắc chắn muốn ${actionText} doanh nghiệp này?`,
            confirmText: 'Từ chối',
            icon: 'warning',
            confirmButtonColor: '#ef4444'
        });
        if (!confirmed) return;

        const toastId = toast.loading("Đang xử lý...");
        try {
            await companyService.responseCompanyPending(id, "BAN");
            setCompanies(prev => prev.filter(c => c.id !== id));
            toast.success("Đã từ chối doanh nghiệp!", { id: toastId });
        } catch (err) {
            toast.error("Thao tác thất bại", { id: toastId });
        }
    };

    const filteredCompanies = companies.filter((comp) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return true;
        return (
            (comp?.name || '').toLowerCase().includes(q) ||
            (comp?.taxId || '').toLowerCase().includes(q) ||
            (comp?.email || '').toLowerCase().includes(q)
        );
    });

    const handleResetFilters = () => {
        setSearchTerm('');
        fetchCompanies(0);
    };

    return (
        <div className="admin-pending-container">
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

                <div className="header-right"></div>
            </div>

            <div className="pending-content-card">
                <ManagementFilterBar
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm doanh nghiệp, mã số thuế, email..."
                >
                    <div className="filter-item">
                        <Filter size={14} className="filter-icon" />
                        <span className="modern-select" style={{ paddingLeft: '38px', minWidth: 170 }}>
                            Chờ duyệt
                        </span>
                    </div>
                    <FilterResetButton onClick={handleResetFilters} disabled={loading} spinning={loading} />
                </ManagementFilterBar>
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
                            {filteredCompanies.map((comp) => (
                                <tr key={comp.id} className="job-row-item"
                                    onClick={() => navigate('/admin/management/companies')}>
                                    <td>
                                        <div className="company-main-info">
                                            <div className="company-logo-box">
                                                <AppImage src={comp.imageUrl} fallbackSrc={DEFAULT_COMPANY_IMAGE} alt={comp.name || 'Company'} />
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
                                        <TableActionBar
                                            actions={[
                                                {
                                                    key: 'approve',
                                                    label: 'Duyệt',
                                                    title: 'Duyệt doanh nghiệp',
                                                    icon: CheckCircle,
                                                    variant: 'solid',
                                                    tone: 'approve',
                                                    onClick: (e) => handleApprove(e, comp.id)
                                                },
                                                {
                                                    key: 'reject',
                                                    label: 'Từ chối',
                                                    title: 'Từ chối doanh nghiệp',
                                                    variant: 'solid',
                                                    tone: 'reject',
                                                    onClick: (e) => handleBan(e, comp.id)
                                                }
                                            ]}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <AppPagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={fetchCompanies}
                        zeroBased
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminCompanyPending;