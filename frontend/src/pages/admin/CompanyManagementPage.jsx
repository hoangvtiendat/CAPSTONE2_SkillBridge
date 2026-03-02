import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Building2,
    Ban,
    CheckCircle,
    MoreVertical,
    ExternalLink,
    Globe,
    MapPin,
    FileCheck2
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import { toast } from 'sonner';
import '../../components/admin/Admin.css';

const CompanyManagementPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
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

    const handleBanCompany = async (id) => {
        try {
            await adminService.banCompany(id);
            toast.success("Đã khóa công ty thành công");
            fetchCompanies(pagination.page);
        } catch (error) {
            toast.error("Thao tác thất bại");
        }
    };

    const handleUnbanCompany = async (id) => {
        try {
            await adminService.unbanCompany(id);
            toast.success("Đã mở khóa công ty thành công");
            fetchCompanies(pagination.page);
        } catch (error) {
            toast.error("Thao tác thất bại");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'VERIFIED': return { backgroundColor: '#ecfdf5', color: '#059669', borderColor: '#d1fae5' };
            case 'BANNED': return { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fee2e2' };
            case 'PENDING': return { backgroundColor: '#fffbeb', color: '#d97706', borderColor: '#fef3c7' };
            default: return { backgroundColor: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' };
        }
    };

    return (
        <div className="company-management">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Quản lý công ty</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Kiểm soát chất lượng và trạng thái hoạt động của các doanh nghiệp.</p>
                </div>
            </div>

            <div className="data-card" style={{ marginBottom: '24px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Tìm tên công ty..."
                        style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                        value={filters.name}
                        onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <FileCheck2 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Mã số thuế..."
                        style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                        value={filters.taxId}
                        onChange={(e) => setFilters(prev => ({ ...prev, taxId: e.target.value }))}
                    />
                </div>
                <select
                    style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '13px' }}
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="VERIFIED">Đã xác thực</option>
                    <option value="BANNED">Đã khóa</option>
                    <option value="PENDING">Chờ duyệt</option>
                </select>
            </div>

            <div className="data-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Doanh nghiệp</th>
                                <th>Thông tin thuế</th>
                                <th>Liên hệ</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải dữ liệu...</td></tr>
                            ) : companies.length > 0 ? (
                                companies.map((company) => (
                                    <tr key={company.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '44px', height: '44px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                    {company.imageUrl ? <img src={company.imageUrl} alt="" style={{ width: '100%', height: '100%', objectCover: 'cover' }} /> : <Building2 size={24} color="#94a3b8" />}
                                                </div>
                                                <div style={{ maxWidth: '200px' }}>
                                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.name}</p>
                                                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.description || "No description"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>{company.taxId}</p>
                                            {company.gpkdUrl && (
                                                <a href={company.gpkdUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                    GPKD <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                                                    <Globe size={12} /> <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.websiteUrl || 'N/A'}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                                                    <MapPin size={12} /> <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.address || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge" style={getStatusStyle(company.status)}>
                                                {company.status === 'VERIFIED' ? 'Đã xác thực' : company.status === 'BANNED' ? 'Đã khóa' : company.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                {company.status === 'BANNED' ? (
                                                    <button onClick={() => handleUnbanCompany(company.id)} style={{ border: 'none', background: '#ecfdf5', color: '#059669', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><CheckCircle size={18} /></button>
                                                ) : (
                                                    <button onClick={() => handleBanCompany(company.id)} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Ban size={18} /></button>
                                                )}
                                                <button style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}><MoreVertical size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Không tìm thấy công ty nào</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#f8fafc' }}>
                        <button disabled={pagination.page === 0} onClick={() => fetchCompanies(pagination.page - 1)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontSize: '12px', cursor: pagination.page === 0 ? 'default' : 'pointer', opacity: pagination.page === 0 ? 0.5 : 1 }}>Trước</button>
                        <button disabled={pagination.page >= pagination.totalPages - 1} onClick={() => fetchCompanies(pagination.page + 1)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontSize: '12px', cursor: pagination.page >= pagination.totalPages - 1 ? 'default' : 'pointer', opacity: pagination.page >= pagination.totalPages - 1 ? 0.5 : 1 }}>Sau</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyManagementPage;
