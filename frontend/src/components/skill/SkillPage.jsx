import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Search, Plus, Edit2, Trash2, Check, X, Sparkles } from "lucide-react";
import apiSkill from "../../services/api/skillService";
import Swal from 'sweetalert2';
import "../../components/admin/Admin.css";
import "./SkillPage.css";

export function SkillPage() {
    const navigate = useNavigate();
    const { categoryId } = useParams();

    const [skills, setSkills] = useState([]);
    const [newSkillName, setNewSkillName] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingSkillId, setEditingSkillId] = useState(null);
    const [editSkillName, setEditSkillName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    const getListSkillsOfCategory = useCallback(async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await apiSkill.getListSkillsOfCategory(id);
            setSkills(response.result || []);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lỗi khi tải danh sách kỹ năng";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getListSkillsOfCategory(categoryId);
    }, [categoryId, getListSkillsOfCategory]);

    const handleCreateSkill = async () => {
        if (!newSkillName.trim()) {
            toast.warning("Vui lòng nhập tên kỹ năng");
            return;
        }
        try {
            await apiSkill.createSkill({ name: newSkillName, category_id: categoryId });
            toast.success("Đã thêm kỹ năng mới");
            setNewSkillName("");
            setIsAdding(false);
            getListSkillsOfCategory(categoryId);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lỗi khi thêm kỹ năng";
            toast.error(errorMessage);
        }
    };

    const handleUpdateSkill = async (id) => {
        if (!editSkillName.trim()) return;
        try {
            await apiSkill.upDateSkill(id, { name: editSkillName, category_id: categoryId });
            toast.success("Cập nhật kỹ năng thành công");
            setEditingSkillId(null);
            getListSkillsOfCategory(categoryId);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lỗi khi cập nhật kỹ năng";
            toast.error(errorMessage);
        }
    };

    const handleDeleteSkill = async (id, name) => {
        const result = await Swal.fire({
            title: 'Xóa kỹ năng?',
            html: `Bạn có chắc chắn muốn xóa kỹ năng <b>${name}</b> không?<br/>Hành động này không thể hoàn tác!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy',
            background: '#ffffff',
            borderRadius: '24px',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Đang thực hiện xóa...");
            try {
                await apiSkill.deleteSkill(id);
                toast.success("Đã xóa kỹ năng thành công", { id: toastId });
                getListSkillsOfCategory(categoryId);
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Lỗi khi xóa kỹ năng";
                toast.error(errorMessage, { id: toastId });
            }
        }
    };

    const filteredSkills = skills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-skill-management animate-fade-in">
            {/* Nav Header */}
            <button className="btn-back-nav" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} /> Quay lại
            </button>

            {/* Premium Header Section */}
            <div className="dashboard-header-section" style={{ padding: '24px 32px', marginBottom: '24px' }}>
                <div className="flex-between">
                    <div>
                        <p className="text-overline"><Sparkles size={14} style={{ marginBottom: '-2px', marginRight: '4px' }} /> Kỹ năng chuyên môn</p>
                        <h1 className="page-title" style={{ fontSize: '28px' }}>Quản lý kỹ năng</h1>
                        <p className="page-subtitle">Danh sách các kỹ năng đo lường năng lực cho ngành nghề này.</p>
                    </div>
                </div>
            </div>

            <div className="modern-card">
                {/* Search and Integrated Actions Bar */}
                <div className="filters-bar" style={{ background: 'white' }}>
                    <div className="search-wrapper" style={{ maxWidth: '400px' }}>
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="modern-input"
                            placeholder="Tìm kiếm nhanh kỹ năng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filters-group" style={{ gap: '16px' }}>
                        <div className="flex-between gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <span>{filteredSkills.length} kỹ năng</span>
                        </div>
                        <button
                            className={`btn-add-skill-integrated ${isAdding ? 'cancel' : ''}`}
                            onClick={() => setIsAdding(!isAdding)}
                        >
                            {isAdding ? <X size={18} /> : <Plus size={18} />}
                            <span>{isAdding ? "Hủy" : "Thêm mới"}</span>
                        </button>
                    </div>
                </div>

                {/* Table implementation */}
                <div className="table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60%', paddingLeft: '32px' }}>TÊN KỸ NĂNG</th>
                                <th style={{ width: '40%', textAlign: 'right', paddingRight: '32px' }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isAdding && (
                                <tr className="adding-row-modern shadow-sm">
                                    <td style={{ paddingLeft: '32px' }}>
                                        <div className="input-with-focus-ring">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newSkillName}
                                                onChange={(e) => setNewSkillName(e.target.value)}
                                                placeholder="Nhập tên kỹ năng..."
                                                className="skill-inline-edit-input"
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSkill()}
                                            />
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                        <div className="flex-actions-end">
                                            <button onClick={handleCreateSkill} className="btn-action-save" title="Lưu">
                                                <Check size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {loading ? (
                                <tr>
                                    <td colSpan="2" style={{ padding: '64px 0', textAlign: 'center' }}>
                                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                                        <p style={{ marginTop: '16px', color: '#64748b' }}>Đang tải danh sách...</p>
                                    </td>
                                </tr>
                            ) : filteredSkills.length === 0 && !isAdding ? (
                                <tr>
                                    <td colSpan="2" style={{ padding: '64px 0', textAlign: 'center' }}>
                                        <div style={{ color: '#94a3b8', marginBottom: '16px' }}>
                                            <Search size={48} strokeWidth={1} />
                                        </div>
                                        <p style={{ color: '#64748b' }}>Không tìm thấy kỹ năng nào phù hợp.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSkills.map((skill) => (
                                    <tr key={skill.id} className="table-row-modern">
                                        <td style={{ paddingLeft: '32px' }}>
                                            {editingSkillId === skill.id ? (
                                                <div className="input-with-focus-ring">
                                                    <input
                                                        autoFocus
                                                        className="skill-inline-edit-input"
                                                        value={editSkillName}
                                                        onChange={(e) => setEditSkillName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateSkill(skill.id)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="skill-name-display">
                                                    <div className="skill-dot"></div>
                                                    <span>{skill.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                            <div className="flex-actions-end">
                                                {editingSkillId === skill.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateSkill(skill.id)}
                                                            className="btn-action-save"
                                                            title="Cập nhật"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingSkillId(null)}
                                                            className="btn-action-cancel"
                                                            title="Hủy"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => { setEditingSkillId(skill.id); setEditSkillName(skill.name); }}
                                                            className="btn-action-edit"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSkill(skill.id, skill.name)}
                                                            className="btn-action-delete"
                                                            title="Xóa kỹ năng"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
