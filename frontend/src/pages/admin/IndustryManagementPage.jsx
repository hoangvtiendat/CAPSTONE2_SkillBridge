import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Trash2,
    Edit,
    Briefcase,
    AlertTriangle,
    X,
    CheckCircle2
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import { toast } from 'sonner';
import '../../components/admin/Admin.css';

const IndustryManagementPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [isDeleting, setIsDeleting] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getCategories({ size: 100 });
            if (data && data.result) {
                setCategories(data.result.content);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách ngành nghề");
        } finally {
            setLoading(false);
        }
    }, []);

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
            fetchCategories();
        } catch (error) {
            toast.error("Thao tác thất bại");
        }
    };

    const handleDelete = async (id) => {
        try {
            await adminService.deleteCategory(id);
            toast.success("Đã xóa ngành nghề");
            setIsDeleting(null);
            fetchCategories();
        } catch (error) {
            toast.error("Không thể xóa ngành nghề này (có thể đang được sử dụng)");
        }
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setIsModalOpen(true);
    };

    return (
        <div className="industry-management">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Quản lý ngành nghề</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Danh mục các lĩnh vực kinh doanh và tuyển dụng trên hệ thống.</p>
                </div>
                <button
                    onClick={() => { setEditingCategory(null); setCategoryName(''); setIsModalOpen(true); }}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} />
                    Thêm ngành nghề
                </button>
            </div>

            <div className="data-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Tên ngành nghề</th>
                                <th>Ngày tạo</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải dữ liệu...</td></tr>
                            ) : categories.length > 0 ? (
                                categories.map((cat) => (
                                    <tr key={cat.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#64748b' }}>
                                                    <Briefcase size={18} />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '600' }}>{cat.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                                            {new Date(cat.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button
                                                    onClick={() => openEditModal(cat)}
                                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setIsDeleting(cat.id)}
                                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có dữ liệu ngành nghề</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Add/Edit */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="data-card" style={{ width: '100%', maxWidth: '400px', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                                {editingCategory ? 'Chỉnh sửa ngành nghề' : 'Thêm ngành nghề mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tên ngành nghề</label>
                                <input
                                    autoFocus
                                    type="text"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
                                    placeholder="Vd: Công nghệ thông tin, Kế toán..."
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <CheckCircle2 size={16} />
                                    {editingCategory ? 'Lưu thay đổi' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleting && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="data-card" style={{ width: '100%', maxWidth: '350px', padding: '32px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px' }}>Xác nhận xóa?</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Hành động này không thể hoàn tác. Ngành nghề sẽ bị xóa vĩnh viễn.</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setIsDeleting(null)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={() => handleDelete(isDeleting)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Xóa ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IndustryManagementPage;
