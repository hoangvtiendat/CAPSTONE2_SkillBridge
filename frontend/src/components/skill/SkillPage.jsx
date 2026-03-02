import React, { useState, useEffect, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate, useParams } from "react-router-dom"; 
import { ArrowLeft, Search, Plus } from "lucide-react"; 
import apiSkill from "../../services/api/skillService"; 
import "./SkillPage.css"; 

const toastStyles = {
    warning: { borderRadius: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '8px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

export function SkillPage() {
    const navigate = useNavigate();
    const { categoryId } = useParams(); 
    
    const [skills, setSkills] = useState([]);
    const [newSkillName, setNewSkillName] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingSkillId, setEditingSkillId] = useState(null);
    const [editSkillName, setEditSkillName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const getListSkillsOfCategory = useCallback(async (id) => {
        if (!id) return;
        try {
            const response = await apiSkill.getListSkillsOfCategory(id);
            setSkills(response.result || []); 
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lỗi khi tải danh sách kỹ năng";
            toast.error(errorMessage, { style: toastStyles.error });
            }
    }, []);

    useEffect(() => {
        getListSkillsOfCategory(categoryId);
    }, [categoryId, getListSkillsOfCategory]);

    const handleCreateSkill = async () => {
        if (!newSkillName.trim()) {
            toast.error("Vui lòng nhập tên kỹ năng", { style: toastStyles.warning });
            return;
        }
        try {
            await apiSkill.createSkill({ name: newSkillName, category_id: categoryId });
            toast.success("Thêm thành công", { style: toastStyles.success });
            setNewSkillName(""); 
            setIsAdding(false);
            getListSkillsOfCategory(categoryId);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lỗi khi thêm kỹ năng";
            toast.error(errorMessage, { style: toastStyles.error });
        }
    };

    const handleUpdateSkill = async (id) => {
        if (!editSkillName.trim()) return;
        try {
            await apiSkill.upDateSkill(id, { name: editSkillName, category_id: categoryId });
            toast.success("Cập nhật thành công", { style: toastStyles.success });
            setEditingSkillId(null);
            getListSkillsOfCategory(categoryId);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lỗi khi cập nhật kỹ năng";
            toast.error(errorMessage, { style: toastStyles.error });
        }
    };

    const handleDeleteSkill = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa kỹ năng này?")) return;
        try {
            await apiSkill.deleteSkill(id);
            toast.success("Đã xóa kỹ năng", { style: toastStyles.success });
            getListSkillsOfCategory(categoryId);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lỗi khi xóa kỹ năng";
            toast.error(errorMessage, { style: toastStyles.error });
        }
    };

    const filteredSkills = skills.filter(skill => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-wrapper">
            <Toaster position="top-right" expand={false} richColors />
            
            {/* Box Header Trắng */}
            <div className="header-card">
                <div className="header-left">
                    <button onClick={() => navigate(-1)} className="btn-back">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="page-title">Quản lý kỹ năng</h1>
                </div>

                <div className="header-right-stacked">
                 
                
                    <div className="search-box">
                        <Search className="search-icon" size={16} />
                        <input 
                            type="text"
                            placeholder="Tìm theo tên kỹ năng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                </div>
                
            </div>

            <div className="mid-Header">
                <button className="btn-add" onClick={() => setIsAdding(!isAdding)}>
                        <Plus size={16} /> {isAdding ? "Hủy Thêm" : "Thêm Kỹ Năng"}
                    </button>
            </div>
            {/* Box Table Trắng */}
            <div className="table-card">
                <table className="skill-table">
                    <thead>
                        <tr>
                            <th>TÊN KỸ NĂNG</th>
                            <th className="text-right">HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdding && (
                            <tr className="adding-row">
                                <td>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newSkillName} 
                                        onChange={(e) => setNewSkillName(e.target.value)}
                                        placeholder="Nhập tên kỹ năng..." 
                                        className="inline-input"
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSkill()}
                                    />
                                </td>
                                <td className="action-cell">
                                    <button onClick={handleCreateSkill} className="btn-outline-blue">Lưu</button>
                                    <button onClick={() => {setIsAdding(false); setNewSkillName("");}} className="btn-outline-red">Hủy</button>
                                </td>
                            </tr>
                        )}

                        {filteredSkills.length === 0 && !isAdding ? (
                            <tr>
                                <td colSpan="2" className="text-center py-8 text-gray-500">Không có dữ liệu.</td>
                            </tr>
                        ) : (
                            filteredSkills.map((skill) => (
                                <tr key={skill.id}>
                                    <td>
                                        {editingSkillId === skill.id ? (
                                            <input 
                                                autoFocus
                                                className="inline-input"
                                                value={editSkillName}
                                                onChange={(e) => setEditSkillName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateSkill(skill.id)}
                                            />
                                        ) : (
                                            skill.name
                                        )}
                                    </td>
                                    <td className="action-cell">
                                        {editingSkillId === skill.id ? (
                                            <>
                                                <button onClick={() => handleUpdateSkill(skill.id)} className="btn-outline-blue">Lưu</button>
                                                <button onClick={() => setEditingSkillId(null)} className="btn-outline-red">Hủy</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditingSkillId(skill.id); setEditSkillName(skill.name); }} className="btn-outline-blue">Sửa</button>
                                                <button onClick={() => handleDeleteSkill(skill.id)} className="btn-outline-red">Xóa</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
           
        </div>
    );
}