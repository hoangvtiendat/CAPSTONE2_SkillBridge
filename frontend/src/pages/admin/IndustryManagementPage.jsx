import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
    Plus,
    Trash2,
    Edit,
    Briefcase,
    X,
    CheckCircle2,
    Calendar,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import '../../components/admin/Admin.css';

const IndustryManagementPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [pagination, setPagination] = useState({
        page: 0,
        size: 5,
        totalElements: 0,
        totalPages: 0
    });

    const fetchCategories = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const data = await adminService.getCategories({ page, size: pagination.size });
            if (data && data.result) {
                setCategories(data.result.content);
                setPagination(prev => ({
                    ...prev,
                    page: data.result.number,
                    totalElements: data.result.totalElements,
                    totalPages: data.result.totalPages
                }));
            }
        } catch (error) {
            toast.error("Không thể tải danh sách ngành nghề");
        } finally {
            setLoading(false);
        }
    }, [pagination.size]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;

        try {
            if (editingCategory) {
                await adminService.updateCategory(editingCategory.id, { name: categoryName });
                toast.success("Cập nhật ngành nghề thành công");
            } else {
                await adminService.createCategory({ name: categoryName });
                toast.success("Thêm mới ngành nghề thành công");
            }
            setCategoryName('');
            setEditingCategory(null);
            setIsModalOpen(false);
            fetchCategories(pagination.page);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Thao tác thất bại";
            toast.error(errorMessage);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa?',
            text: `Bạn có chắc chắn muốn xóa ngành nghề "${name}"? Hành động này không thể hoàn tác.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Có, xóa ngay',
            cancelButtonText: 'Hủy',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                await adminService.deleteCategory(id);
                toast.success("Đã xóa ngành nghề thành công");
                fetchCategories(pagination.page);
            } catch (error) {
                toast.error("Không thể xóa ngành nghề này (có thể đang được sử dụng)");
            }
        }
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setIsModalOpen(true);
    };

    return (
        <div className="industry-management animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Quản lý ngành nghề</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Danh mục các lĩnh vực kinh doanh và tuyển dụng trên hệ thống.</p>
                </div>
            </div>

            <div className="flex-between" style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                    Tổng số: <b>{pagination.totalElements}</b> ngành nghề
                </div>
                <button
                    onClick={() => { setEditingCategory(null); setCategoryName(''); setIsModalOpen(true); }}
                    className="action-btn"
                    style={{
                        width: 'auto',
                        padding: '0 20px',
                        gap: '8px',
                        background: 'var(--admin-primary)',
                        color: 'white',
                        borderColor: 'transparent',
                        fontWeight: '700',
                        fontSize: '14px'
                    }}
                >
                    <Plus size={18} />
                    Thêm ngành nghề
                </button>
            </div>

            <div className="modern-card">
                <div className="table-container">
                    {loading && (
                        <div className="table-loader-overlay">
                            <Loader2 className="spinning-icon" size={40} />
                        </div>
                    )}
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Tên ngành nghề</th>
                                <th>Ngày tạo</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length > 0 ? (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="table-row-hover">
                                        <td>
                                            <div
                                                className="user-info-cell"
                                                onClick={() => navigate(`/admin/category/${cat.id}/skills`)}
                                                style={{ cursor: 'pointer' }}
                                                title={`Xem danh sách kỹ năng của ${cat.name}`}
                                            >
                                                <div className="user-avatar-wrapper" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
                                                    <div className="user-avatar-placeholder" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                        <Briefcase size={18} />
                                                    </div>
                                                </div>
                                                <span className="industry-name-link" style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{cat.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} />
                                                <span>{new Date(cat.createdAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="actions-wrapper">
                                                <button
                                                    onClick={() => openEditModal(cat)}
                                                    className="action-btn info-btn"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id, cat.name)}
                                                    className="action-btn ban-btn"
                                                    title="Xóa ngành nghề"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : !loading && (
                                <tr>
                                    <td colSpan="3" className="empty-table-state">
                                        <div className="empty-content">
                                            <Briefcase size={48} />
                                            <p>Chưa có dữ liệu ngành nghề</p>
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
                            Tổng <b>{pagination.totalElements}</b> ngành nghề
                        </div>
                        <div className="pagination-controls">
                            <button
                                disabled={pagination.page === 0}
                                onClick={() => fetchCategories(pagination.page - 1)}
                                className="pagination-btn"
                                title="Trang trước"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {[...Array(pagination.totalPages)].map((_, index) => {
                                if (
                                    index === 0 ||
                                    index === pagination.totalPages - 1 ||
                                    (index >= pagination.page - 1 && index <= pagination.page + 1)
                                ) {
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => fetchCategories(index)}
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
                                onClick={() => fetchCategories(pagination.page + 1)}
                                className="pagination-btn"
                                title="Trang sau"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - Add/Edit */}
            {isModalOpen && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsModalOpen(false);
                    }}>
                    <div className="modern-card" style={{background: "rgba(255, 255, 255, 0.4)", width: '100%', maxWidth: '450px', padding: 0, borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgb(124 124 124)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#000000' }}>
                                {editingCategory ? 'Chỉnh sửa ngành nghề' : 'Thêm ngành nghề mới'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="action-btn"
                                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#000000', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Tên ngành nghề
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="modern-input"
                                    style={{ paddingLeft: '20px'}}
                                    placeholder="Vd: Công nghệ thông tin, Kế toán..."
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    required
                                />
                                <p style={{ fontSize: '13px', color: '#202020', marginTop: '10px' }}>
                                    Nhập tên ngành nghề chính xác để hiển thị cho người dùng và nhà tuyển dụng.
                                </p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="action-btn"
                                    style={{ width: 'auto', padding: '0 24px', fontWeight: '700' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="action-btn"
                                    style={{
                                        width: 'auto',
                                        padding: '0 24px',
                                        background: 'var(--admin-primary)',
                                        color: 'white',
                                        borderColor: 'transparent',
                                        fontWeight: '700'
                                    }}
                                >
                                    <CheckCircle2 size={18} style={{ marginRight: '8px' }} />
                                    {editingCategory ? 'Lưu thay đổi' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default IndustryManagementPage;
