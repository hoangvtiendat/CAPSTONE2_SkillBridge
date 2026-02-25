import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Filter,
    Ban,
    CheckCircle,
    MoreVertical,
    User as UserIcon,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import { toast } from 'sonner';
import '../../components/admin/Admin.css';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0
    });

    const fetchUsers = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const params = {
                page,
                size: pagination.size,
                name: searchTerm,
                role: roleFilter,
                status: statusFilter
            };
            const response = await adminService.getUsers(params);
            if (response && response.result) {
                setUsers(response.result.content);
                setPagination(prev => ({
                    ...prev,
                    page: response.result.number,
                    totalElements: response.result.totalElements,
                    totalPages: response.result.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [pagination.size, searchTerm, roleFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(0);
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleBanUser = async (id) => {
        try {
            await adminService.banUser(id);
            toast.success('Đã khóa người dùng thành công');
            fetchUsers(pagination.page);
        } catch (error) {
            toast.error('Không thể khóa người dùng');
        }
    };

    const handleUnbanUser = async (id) => {
        try {
            await adminService.unbanUser(id);
            toast.success('Đã mở khóa người dùng thành công');
            fetchUsers(pagination.page);
        } catch (error) {
            toast.error('Không thể mở khóa người dùng');
        }
    };

    const getRoleStyle = (role) => {
        switch (role) {
            case 'ADMIN': return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' };
            case 'EMPLOYER': return { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe' };
            default: return { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
        }
    };

    return (
        <div className="user-management">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', margin: 0, fontWeight: '900', color: '#0f172a' }}>Quản lí người dùng</h1>
                    <p style={{ margin: '8px 0 0', color: '#64748b' }}>Quản lý tài khoản, phân quyền và trạng thái hoạt động trên toàn hệ thống.</p>
                </div>
            </div>

            <div className="data-card">
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                    >
                        <option value="">Tất cả vai trò</option>
                        <option value="CANDIDATE">Candidate</option>
                        <option value="EMPLOYER">Employer</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="BANNED">Đã khóa</option>
                    </select>
                </div>

                <div className="table-responsive" style={{ minHeight: '300px', position: 'relative' }}>
                    {loading && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 className="spinning-icon" size={32} color="#4f46e5" />
                        </div>
                    )}
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Vai trò</th>
                                <th>Ngày tham gia</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} alt="" /> : <UserIcon size={20} />}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>{user.name}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                                    <Mail size={12} />
                                                    <span>{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={getRoleStyle(user.role)}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} />
                                            <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            backgroundColor: user.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                                            color: user.status === 'ACTIVE' ? '#059669' : '#dc2626',
                                            borderColor: user.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2'
                                        }}>
                                            {user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            {user.status === 'ACTIVE' ? (
                                                <button
                                                    onClick={() => handleBanUser(user.id)}
                                                    title="Khóa tài khoản"
                                                    style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    <Ban size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnbanUser(user.id)}
                                                    title="Mở khóa tài khoản"
                                                    style={{ border: 'none', background: '#ecfdf5', color: '#059669', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                                        Không tìm thấy người dùng nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                            Trang <b>{pagination.page + 1}</b> trên tổng số <b>{pagination.totalPages}</b>
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                disabled={pagination.page === 0}
                                onClick={() => fetchUsers(pagination.page - 1)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    backgroundColor: 'white', fontSize: '12px', fontWeight: '600', cursor: pagination.page === 0 ? 'default' : 'pointer',
                                    opacity: pagination.page === 0 ? 0.5 : 1
                                }}
                            >
                                <ChevronLeft size={14} /> Trước
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages - 1}
                                onClick={() => fetchUsers(pagination.page + 1)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    backgroundColor: 'white', fontSize: '12px', fontWeight: '600', cursor: pagination.page >= pagination.totalPages - 1 ? 'default' : 'pointer',
                                    opacity: pagination.page >= pagination.totalPages - 1 ? 0.5 : 1
                                }}
                            >
                                Sau <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <style>
                {`
                .spinning-icon {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
};

export default UserManagementPage;
