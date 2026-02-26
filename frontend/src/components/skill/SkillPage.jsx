import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate, useParams } from "react-router-dom"; 
import { KeyRound, ArrowLeft, Edit2, Trash2, Plus, Save, X } from "lucide-react"; 
import apiSkill from "../../services/api/skillService"; 
import "./SkillPage.css"; 

export function SkillPage() {
    const navigate = useNavigate();
    const { categoryId } = useParams(); 
    
    const [skills, setSkills] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [newSkillName, setNewSkillName] = useState("");
    const [editingSkillId, setEditingSkillId] = useState(null);
    const [editSkillName, setEditSkillName] = useState("");

    const toastStyles = {
        warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
        success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
        error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
    };

    useEffect(() => {
        if (categoryId) {
            getListSkillsOfCategory(categoryId);
        } else {
            toast.error("Lỗi: Không tìm thấy ID danh mục trên URL", { style: toastStyles.error });
        }
    }, [categoryId]);

    const getListSkillsOfCategory = async (id) => {
        setIsLoading(true);
        try {
            const response = await apiSkill.getListSkillsOfCategory(id);
            setSkills(response.result || []); 
        } catch (error) {
            toast.error("Lỗi khi lấy danh sách", { description: "Vui lòng thử lại sau.", style: toastStyles.error });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSkill = async () => {
        if (!newSkillName.trim()) {
            toast.error("Thiếu thông tin", { description: "Vui lòng nhập tên kỹ năng.", style: toastStyles.warning });
            return;
        }
        setIsLoading(true);
        try {
            const skillData = { name: newSkillName, category_id: categoryId };
            await apiSkill.createSkill(skillData);
            toast.success("Thành công", { description: `Kỹ năng ${newSkillName} đã được tạo.`, style: toastStyles.success });
            setNewSkillName(""); 
            getListSkillsOfCategory(categoryId);
        } catch (error) {
            toast.error("Lỗi khi tạo", { description: "Vui lòng thử lại sau.", style: toastStyles.error });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSkill = async (id) => {
        if (!editSkillName.trim()) {
            toast.error("Thiếu thông tin", { description: "Vui lòng nhập tên kỹ năng.", style: toastStyles.warning });
            return;
        }
        setIsLoading(true);
        try {
            const skillData = { name: editSkillName, category_id: categoryId };
            await apiSkill.upDateSkill(id, skillData);
            toast.success("Thành công", { description: `Đã cập nhật thành ${editSkillName}.`, style: toastStyles.success });
            setEditingSkillId(null);
            setEditSkillName("");
            getListSkillsOfCategory(categoryId);
        } catch (error) {
            toast.error("Lỗi khi cập nhật", { description: "Vui lòng thử lại sau.", style: toastStyles.error });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        setIsLoading(true);
        try {
            await apiSkill.deleteSkill(id);
            toast.success("Thành công", { description: "Kỹ năng đã được xóa.", style: toastStyles.success });
            getListSkillsOfCategory(categoryId);
        } catch (error) {
            toast.error("Lỗi khi xóa", { description: "Vui lòng thử lại sau.", style: toastStyles.error });
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (skill) => {
        setEditingSkillId(skill.id);
        setEditSkillName(skill.name);
    };

    return (
        <main className="skill-container">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="skill-header">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="skill-title">
                    <KeyRound className="icon-blue" /> Quản lý kỹ năng
                </h1>
            </div>

            {/* Khung Thêm Kỹ năng mới */}
            <div className="skill-card">
                <h2 className="card-title">Thêm kỹ năng mới</h2>
                <div className="input-group">
                    <input 
                        type="text" 
                        value={newSkillName} 
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="VD: Java Spring Boot, ReactJS..." 
                        className="form-input"
                    />
                    <button 
                        onClick={handleCreateSkill}
                        disabled={isLoading || !newSkillName}
                        className="btn-primary btn-add"
                    >
                        <Plus size={18} /> Thêm mới
                    </button>
                </div>
            </div>

            {/* Bảng Danh sách Kỹ năng */}
            <div className="table-container">
                <table className="skill-table">
                    <thead>
                        <tr>
                            <th>Tên kỹ năng</th>
                            <th className="text-center actions-col">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {skills.length === 0 ? (
                            <tr>
                                <td colSpan="2" className="text-center empty-state">
                                    Chưa có kỹ năng nào trong danh mục này.
                                </td>
                            </tr>
                        ) : (
                            skills.map((skill) => (
                                <tr key={skill.id}>
                                    <td>
                                        {editingSkillId === skill.id ? (
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={editSkillName}
                                                onChange={(e) => setEditSkillName(e.target.value)}
                                                className="form-input-edit"
                                            />
                                        ) : (
                                            <span className="skill-name">{skill.name}</span>
                                        )}
                                    </td>
                                    <td className="actions-cell">
                                        {editingSkillId === skill.id ? (
                                            <div className="action-buttons">
                                                <button onClick={() => handleUpdateSkill(skill.id)} className="btn-action success">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={() => setEditingSkillId(null)} className="btn-action cancel">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="action-buttons">
                                                <button onClick={() => startEditing(skill)} className="btn-action edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteSkill(skill.id)} className="btn-action delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}