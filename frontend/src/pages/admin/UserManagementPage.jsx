import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Filter,
    Ban,
    CheckCircle,
    Calendar,
    Loader2,
    Shield,
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import '../../components/admin/Admin.css';
import '../../components/admin/UserManagementPage.css'
import AppPagination from '../../components/common/AppPagination';
import ManagementFilterBar from '../../components/common/ManagementFilterBar';
import TableActionBar from '../../components/common/TableActionBar';
import StatusBadge from '../../components/common/StatusBadge';
import AppImage from '../../components/common/AppImage';
import FilterResetButton from '../../components/common/FilterResetButton';
import { DEFAULT_AVATAR_IMAGE } from '../../utils/imageUtils';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({
        page: 0,
        size: 5,
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

    const handleBanUser = async (user) => {
        const result = await Swal.fire({
            title: 'Khóa tài khoản?',
            text: `Bạn có chắc chắn muốn khóa tài khoản của ${user.name} không? Người dùng này sẽ không thể truy cập vào hệ thống.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Đồng ý, khóa ngay!',
            cancelButtonText: 'Hủy bỏ',
            background: '#ffffff',
            borderRadius: '16px',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                await adminService.banUser(user.id);
                fetchUsers(pagination.page);
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Tài khoản đã được khóa.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    borderRadius: '16px'
                });
            } catch (error) {
                toast.error('Không thể khóa người dùng');
            }
        }
    };

    const handleUnbanUser = async (user) => {
        const result = await Swal.fire({
            title: 'Mở khóa tài khoản?',
            text: `Xác nhận mở khóa quyền truy cập cho ${user.name}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Đồng ý, mở khóa',
            cancelButtonText: 'Hủy bỏ',
            background: '#ffffff',
            borderRadius: '16px'
        });

        if (result.isConfirmed) {
            try {
                await adminService.unbanUser(user.id);
                fetchUsers(pagination.page);
                Swal.fire({
                    title: 'Đã mở khóa!',
                    text: 'Người dùng hiện đã có thể truy cập hệ thống.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    borderRadius: '16px'
                });
            } catch (error) {
                toast.error('Không thể mở khóa người dùng');
            }
        }
    };

    const getRoleStyle = (role) => {
        switch (role) {
            case 'ADMIN': return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' };
            case 'RECRUITER': return { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe' };
            default: return { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setRoleFilter('');
        setStatusFilter('');
    };

    return (
        <div className="user-management">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="management-page-title">Quản lý người dùng</h1>
                    <p className="management-page-subtitle">Kiểm soát truy cập, phân quyền và giám sát hoạt động tài khoản.</p>
                </div>
            </div>

            <div className="modern-card">
                <ManagementFilterBar
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm tên, email..."
                >
                    <div className="filters-group">
                        <div className="filter-item">
                            <Filter size={14} className="filter-icon" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="modern-select"
                            >
                                <option value="">Vai trò</option>
                                <option value="CANDIDATE">Ứng viên</option>
                                <option value="RECRUITER">Nhà tuyển dụng</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <Shield size={14} className="filter-icon" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="modern-select"
                            >
                                <option value="">Trạng thái</option>
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="BANNED">Đã khóa</option>
                            </select>
                        </div>
                        <FilterResetButton onClick={handleResetFilters} disabled={loading} />
                    </div>
                </ManagementFilterBar>

                <div className="table-container">
                    {loading && (
                        <div className="table-loader-overlay">
                            <Loader2 className="spinning-icon" size={40} />
                        </div>
                    )}
                    <table className="modern-table">
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
                                <tr key={user.id} className="table-row-hover">
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-avatar-wrapper">
                                                <AppImage
                                                    src={user.avatar}
                                                    fallbackSrc={DEFAULT_AVATAR_IMAGE}
                                                    className="user-avatar"
                                                    alt={user.name || 'User'}
                                                />
                                            </div>
                                            <div className="user-details">
                                                <p className="user-name">{user.name}</p>
                                                <p className="user-email">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="modern-badge" style={getRoleStyle(user.role)}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={14} />
                                            <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <TableActionBar
                                            actions={[
                                                user.status === 'ACTIVE'
                                                    ? {
                                                        key: 'ban',
                                                        title: 'Khóa tài khoản',
                                                        icon: Ban,
                                                        tone: 'ban-btn',
                                                        onClick: () => handleBanUser(user)
                                                    }
                                                    : {
                                                        key: 'unban',
                                                        title: 'Mở khóa tài khoản',
                                                        icon: CheckCircle,
                                                        tone: 'unban-btn',
                                                        onClick: () => handleUnbanUser(user)
                                                    }
                                            ]}
                                        />
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan="5" className="empty-table-state">
                                        <div className="empty-content">
                                            <Search size={48} />
                                            <p>Không tìm thấy người dùng nào phù hợp</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <AppPagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={fetchUsers}
                    zeroBased
                    summary={<>Tổng <b>{pagination.totalElements}</b> người dùng</>}
                />
            </div>
        </div>
    );
};

export default UserManagementPage;
