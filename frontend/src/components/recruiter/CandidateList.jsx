import React, { useEffect, useState, useMemo } from 'react';
import applicationService from '../../services/api/applicationService';
import { useAuth } from '../../context/AuthContext';
import {
    Search,
    Filter,
    Trash2,
    UserPlus,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    MoreVertical,
    Clock,
    UserCheck,
    AlertCircle,
    CheckCircle,
    XCircle,
    UserX
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import './CandidateList.css';

const CandidateList = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

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

    const API_BASE_URL = "http://localhost:8081/identity";
    const DEFAULT_AVATAR = `${API_BASE_URL}/avatars/default.jpg`;

    const getImageUrl = (path) => {
        if (!path || path === "" || path === "null") return DEFAULT_AVATAR;
        if (path.startsWith('http')) return path;
        const baseUrl = API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${baseUrl}/${cleanPath}`;
    };

    useEffect(() => {
        const fetchApps = async () => {
            if (!user?.companyId) {
                setLoading(false);
                return;
            }
            try {
                const res = await applicationService.getApplicationsByCompany(user.companyId);
                setApplications(res.result || []);
            } catch (err) {
                toast.error("Không thể tải danh sách ứng viên");
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [user?.companyId]);

    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch =
                app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [applications, searchTerm, statusFilter]);

    const handleAddBack = async (appId) => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Xác nhận khôi phục?',
            text: "Bạn có muốn đưa ứng viên này trở lại danh sách chờ duyệt?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Khôi phục',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang khôi phục...");
            try {
                await applicationService.respondToApplication(appId, 'PENDING');
                setApplications(prev => prev.map(app =>
                    app.id === appId ? { ...app, status: 'PENDING', updatedAt: new Date().toISOString() } : app
                ));
                toast.success("Đã khôi phục ứng viên thành công", { id: toastId });
            } catch (err) {
                toast.error("Thao tác thất bại", { id: toastId });
            }
        }
    };

    const handleApprove = async (appId) => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Xác nhận chấp nhận?',
            text: "Bạn có chắc chắn muốn duyệt hồ sơ ứng viên này không?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang xử lý duyệt hồ sơ...");
            try {
                await applicationService.respondToApplication(appId, 'INTERVIEW');
                setApplications(prev => prev.map(app =>
                    app.id === appId ? { ...app, status: 'INTERVIEW', updatedAt: new Date().toISOString() } : app
                ));
                toast.success("Đã chấp nhận hồ sơ ứng viên", { id: toastId });
            } catch (err) {
                toast.error("Thao tác thất bại", { id: toastId });
            }
        }
    };

    const handleReject = async (appId) => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Xác nhận từ chối?',
            text: "Bạn có chắc chắn muốn từ chối hồ sơ ứng viên này?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy',
            customClass: {
                ...swalConfig.customClass,
                confirmButton: 'premium-swal-confirm premium-swal-confirm-warning'
            }
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang xử lý từ chối...");
            try {
                await applicationService.respondToApplication(appId, 'REJECTED');
                setApplications(prev => prev.map(app =>
                    app.id === appId ? { ...app, status: 'REJECTED', updatedAt: new Date().toISOString() } : app
                ));
                toast.success("Đã từ chối hồ sơ ứng viên", { id: toastId });
            } catch (err) {
                toast.error("Thao tác thất bại", { id: toastId });
            }
        }
    };

    const handleDelete = async (appId) => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Xác nhận xóa?',
            text: "Dữ liệu ứng tuyển này sẽ bị xóa vĩnh viễn khỏi hệ thống.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Có, xóa ngay',
            cancelButtonText: 'Hủy',
            customClass: {
                ...swalConfig.customClass,
                confirmButton: 'premium-swal-confirm premium-swal-confirm-danger'
            }
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang xóa dữ liệu...");
            try {
                await applicationService.deleteApplication(appId);
                setApplications(prev => prev.filter(app => app.id !== appId));
                toast.success("Đã xóa hoàn toàn dữ liệu ứng viên", { id: toastId });
            } catch (err) {
                const errorMsg = err.response?.data?.message || "Lỗi khi xóa ứng viên";
                toast.error(errorMsg, { id: toastId });
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="badge badge-pending"><Clock size={12} /> Chờ duyệt</span>;
            case 'INTERVIEW':
                return <span className="badge badge-interview"><UserPlus size={12} /> Phỏng vấn</span>;
            case 'HIRED':
                return <span className="badge badge-hired"><CheckCircle size={12} /> Đã thuê</span>;
            case 'REJECTED':
                return <span className="badge badge-rejected"><XCircle size={12} /> Đã từ chối</span>;
            case 'TALENT_POOL':
                return <span className="badge badge-talent"><UserCheck size={12} /> Tiềm năng</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="candidate-list-loading">
                <div className="loader-ring"></div>
                <p>Đang tải danh sách ứng viên...</p>
            </div>
        );
    }

    return (
        <div className="candidate-manager">
            {/* Header Area */}
            <div className="manager-header">
                <div>
                    <h1 className="manager-title">Quản lý ứng viên</h1>
                    <p className="manager-subtitle">Xây dựng và quản lý nguồn nhân lực của {user?.companyName || 'công ty'}</p>
                </div>

                <div className="manager-controls">
                    <div className="search-box-glass">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-selector"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="PENDING">Đang chờ duyệt</option>
                            <option value="INTERVIEW">Phỏng vấn</option>
                            <option value="HIRED">Đã thuê</option>
                            <option value="REJECTED">Từ chối</option>
                            <option value="TALENT_POOL">Tiềm năng</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="candidate-table-container">
                <table className="candidate-table">
                    <thead>
                        <tr>
                            <th>Ứng viên</th>
                            <th>Vị trí ứng tuyển</th>
                            <th>Trạng thái</th>
                            <th>Cập nhật</th>
                            <th className="text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredApps.length > 0 ? filteredApps.map(app => (
                            <tr key={app.id}>
                                <td>
                                    <div className="candidate-info">
                                        <div className="candidate-avatar">
                                            <img
                                                src={getImageUrl(app.candidate?.user?.avatar)}
                                                alt={app.fullName}
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div className="candidate-text">
                                            <div className="candidate-name">{app.fullName}</div>
                                            <div className="candidate-contact">
                                                <span><Mail size={12} /> {app.email}</span>
                                                {app.phoneNumber && <span><Phone size={12} /> {app.phoneNumber}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="job-info">
                                        <Briefcase size={14} className="text-slate-400" />
                                        <span>{app.job?.title?.vi || app.job?.title?.en || app.job?.position}</span>
                                    </div>
                                </td>
                                <td>{getStatusBadge(app.status)}</td>
                                <td>
                                    <div className="date-info">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span>{new Date(app.updatedAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="candidate-actions">
                                        {app.status !== 'REJECTED' && app.status !== 'HIRED' && (
                                            <>
                                                <button
                                                    className="btn-action-approve"
                                                    title="Chấp nhận hồ sơ"
                                                    onClick={() => handleApprove(app.id)}
                                                >
                                                    <CheckCircle size={22} />
                                                </button>
                                                <button
                                                    className="btn-action-reject"
                                                    title="Từ chối hồ sơ"
                                                    onClick={() => handleReject(app.id)}
                                                >
                                                    <XCircle size={22} />
                                                </button>
                                            </>
                                        )}
                                        
                                        {app.status === 'REJECTED' && (
                                            <>
                                                <button
                                                    className="btn-action-add"
                                                    title="Thêm lại vào danh sách"
                                                    onClick={() => handleAddBack(app.id)}
                                                >
                                                    <UserPlus size={16} />
                                                    <span>Khôi phục</span>
                                                </button>
                                                <button
                                                    className="btn-action-delete"
                                                    title="Xóa vĩnh viễn"
                                                    onClick={() => handleDelete(app.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    <AlertCircle size={40} className="empty-icon" />
                                    <p>Không tìm thấy ứng viên nào phù hợp.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default CandidateList;
