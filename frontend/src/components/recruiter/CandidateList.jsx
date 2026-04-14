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
    CheckCircle2,
    XCircle,
    Clock,
    UserCheck,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmPage from '../admin/DeleteConfirmPage';
import './CandidateList.css';

const CandidateList = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const API_BASE_URL = "http://localhost:8081/identity";
    const DEFAULT_AVATAR = `${API_BASE_URL}/avatars/default.default.jpg`;

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
        try {
            await applicationService.respondToApplication(appId, 'TALENT_POOL');
            setApplications(prev => prev.map(app =>
                app.id === appId ? { ...app, status: 'TALENT_POOL' } : app
            ));
            toast.success("Đã thêm ứng viên vào kho dữ liệu");
        } catch (err) {
            toast.error("Thao tác thất bại");
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await applicationService.deleteApplication(deleteModal.id);
            setApplications(prev => prev.filter(app => app.id !== deleteModal.id));
            toast.success("Đã xóa ứng viên khỏi danh sách");
            setDeleteModal({ show: false, id: null });
        } catch (err) {
            toast.error("Lỗi khi xóa ứng viên");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="badge badge-pending"><Clock size={12} /> Chờ duyệt</span>;
            case 'INTERVIEW':
                return <span className="badge badge-interview"><UserPlus size={12} /> Phỏng vấn</span>;
            case 'HIRED':
                return <span className="badge badge-hired"><CheckCircle2 size={12} /> Đã thuê</span>;
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
                                        {app.status === 'REJECTED' && (
                                            <button
                                                className="btn-action-add"
                                                title="Thêm lại vào danh sách"
                                                onClick={() => handleAddBack(app.id)}
                                            >
                                                <UserPlus size={16} />
                                                <span>Add Back</span>
                                            </button>
                                        )}
                                        <button
                                            className="btn-action-delete"
                                            title="Xóa ứng viên"
                                            onClick={() => setDeleteModal({ show: true, id: app.id })}
                                        >
                                            <Trash2 size={16} />
                                        </button>
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

            {/* Reusable Delete Confirmation Modal */}
            <DeleteConfirmPage
                isOpen={deleteModal.show}
                onCancel={() => setDeleteModal({ show: false, id: null })}
                onConfirm={handleDelete}
                title="Xác nhận xóa ứng viên"
                message="Bạn có chắc chắn muốn xóa hồ sơ ứng viên này khỏi danh sách quản lý? Hành động này không thể hoàn tác."
            />
        </div>
    );
};

export default CandidateList;
