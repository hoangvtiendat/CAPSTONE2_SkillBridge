import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Hand, Plus, Trash2, Search } from 'lucide-react'; // Đã thêm Search icon

import jobService from '../../services/api/jobService';
import skillService from '../../services/api/skillService';
import categoryJDService from '../../services/api/categoryJD';

import './PostJD.css'; 

const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const PostJD = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [categories, setCategories] = useState([]);
    const [skillsList, setSkillsList] = useState([]);
    
    // Thêm state cho thanh tìm kiếm kỹ năng giống DetailJD
    const [skillSearchTerm, setSkillSearchTerm] = useState("");

    const [dynamicTitles, setDynamicTitles] = useState([
        { key: "Quyền lợi", value: "" },
        { key: "Yêu cầu", value: "" }
    ]);

    const [formData, setFormData] = useState({
        categoryId: "",
        position: "",
        description: "",
        location: "",
        salaryMin: "", 
        salaryMax: "", 
        skills: []
    });

    useEffect(() => {
        getListCategories();
    }, []);

    useEffect(() => {
        if (formData.categoryId) {
            getListSkills(formData.categoryId);
        } else {
            setSkillsList([]);
        }
        // Reset thanh tìm kiếm khi đổi category
        setSkillSearchTerm("");
    }, [formData.categoryId]);

    const getListCategories = async () => {
        try {
            const response = await categoryJDService.getListCategories();
            const data = response?.data?.data || response?.data || response || [];
            setCategories(Array.isArray(data) ? data : []); 
        } catch (error) {
            toast.error("Lỗi khi tải danh mục JD", { style: toastStyles.error });
        }
    };

    const getListSkills = async (category_id) => {
        try {
            const response = await skillService.getListSkillsOfCategory(category_id);
            const data = response?.result || [];
            setSkillsList(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Error loading skills list", { style: toastStyles.error });
        }
    };

    const handleCreateJd = async (e) => {
        e.preventDefault();

        const hasEmptyDynamicTitles = dynamicTitles.some(item => item.key.trim() === "" || item.value.trim() === "");
        if (hasEmptyDynamicTitles) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng điền đầy đủ các trường Tiêu đề và Mô tả", style: toastStyles.warning });
            return;
        }

        const requiredFields = ["categoryId", "position", "description", "location", "salaryMin", "salaryMax"];
        const hasEmptyFields = requiredFields.some(field => formData[field].trim() === "");
        if (hasEmptyFields) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng điền đầy đủ các trường bắt buộc", style: toastStyles.warning });
            return;
        }

        if (Number(formData.salaryMax) < Number(formData.salaryMin)) {
            toast.error("Lỗi nhập liệu", { description: "Lương tối đa phải lớn hơn hoặc bằng tối thiểu", style: toastStyles.warning });
            return;
        }

        const titleObject = {};
        dynamicTitles.forEach(item => {
            const finalKey = item.key.trim() === "" ? "Mục khác" : item.key.trim();
            titleObject[finalKey] = item.value;
        });

        const payloadToSubmit = {
            ...formData,
            title: titleObject
        };

        setLoading(true);
        try {
            await jobService.createJd(payloadToSubmit);
            toast.success("Thành công", { description: "Tạo JD thành công!", style: toastStyles.success });
            navigate('/company/jd-list');
        } catch (error) {
            toast.error("Lỗi khi tạo JD", { style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e) => {
        const selectedCategoryId = e.target.value;
        setFormData(prev => ({
            ...prev,
            categoryId: selectedCategoryId,
            skills: [] 
        }));
    };

    const handleSkillToggle = (skillId) => {
        setFormData(prev => {
            const exists = prev.skills.find(s => s.skillId === skillId);
            if (exists) {
                return { ...prev, skills: prev.skills.filter(s => s.skillId !== skillId) };
            } else {
                return { ...prev, skills: [...prev.skills, { skillId, isRequired: false }] };
            }
        });
    };

    const handleSkillRequiredToggle = (skillId, checked) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.map(s => 
                s.skillId === skillId ? { ...s, isRequired: checked } : s
            )
        }));
    };

    const addDynamicTitle = () => {
        setDynamicTitles([...dynamicTitles, { key: "", value: "" }]);
    };

    const removeDynamicTitle = (indexToRemove) => {
        setDynamicTitles(dynamicTitles.filter((_, index) => index !== indexToRemove));
    };

    const handleDynamicTitleChange = (index, field, newValue) => {
        const updatedTitles = [...dynamicTitles];
        updatedTitles[index][field] = newValue;
        setDynamicTitles(updatedTitles);
    };

    const filteredSkillsList = skillsList.filter(skill => {
        const skillName = String(skill.name || skill.skillName || skill.title || "").toLowerCase();
        return skillName.includes(skillSearchTerm.toLowerCase());
    });

   return (
        <div className="jd-board-container">
            <Toaster position="top-right" />
            
            <header className="jd-board-header">
                <h2>
                    <Hand className="icon-header" size={28} />
                    Tạo bài tuyển dụng mới
                </h2>
                <p className="subtitle">Điền thông tin chi tiết để đăng tuyển vị trí mới</p>
            </header>

            <form onSubmit={handleCreateJd} className="jd-board-layout">
                
                {/* --- CỘT TRÁI: THÔNG TIN CHÍNH --- */}
                <div className="layout-main-column">
                    
                    {/* Card 1: Thông tin cơ bản */}
                    <section className="form-card">
                        <h3 className="card-title">Thông tin cơ bản</h3>
                        <div className="input-group-grid">
                            <div className="input-item">
                                <label>Vị trí (Position)</label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    required
                                    placeholder="VD: Marketing Executive..."
                                />
                            </div>
                            <div className="input-item">
                                <label>Danh mục (Category)</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={handleCategoryChange}
                                    required
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id || cat._id} value={cat.id || cat._id}>
                                            {cat.name || cat.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Card 2: Chi tiết công việc */}
                    <section className="form-card">
                        <h3 className="card-title">Mô tả công việc</h3>
                        
                        <div className="input-item full-width">
                            <label>Mô tả chung (Description)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows="3"
                                placeholder="Tham gia xây dựng và triển khai..."
                            ></textarea>
                        </div>

                        <div className="dynamic-section">
                            <div className="dynamic-header">
                                <label>Các mục Tiêu đề & Chi tiết</label>
                                <button type="button" onClick={addDynamicTitle} className="btn-add-outline">
                                    <Plus size={16} /> Thêm mục
                                </button>
                            </div>

                            <div className="dynamic-body job-feed">
                                {dynamicTitles.map((item, index) => (
                                    <div key={index} className="dynamic-row">
                                        <input
                                            type="text"
                                            value={item.key}
                                            onChange={(e) => handleDynamicTitleChange(index, "key", e.target.value)}
                                            placeholder="Tiêu đề (VD: Quyền lợi)"
                                            className="dynamic-input-key"
                                        />
                                        <textarea
                                            value={item.value}
                                            onChange={(e) => handleDynamicTitleChange(index, "value", e.target.value)}
                                            placeholder="Mô tả chi tiết..."
                                            rows="2"
                                            className="dynamic-input-value"
                                        />
                                        {dynamicTitles.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDynamicTitle(index)}
                                                className="btn-delete-icon"
                                                title="Xóa mục này"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* --- CỘT PHẢI: THUỘC TÍNH & KỸ NĂNG --- */}
                <div className="layout-sidebar">
                    
                    {/* Card 3: Thông tin bổ sung */}
                    <section className="form-card sidebar-card">
                        <h3 className="card-title">Yêu cầu & Quyền lợi</h3>
                        
                        <div className="input-item full-width">
                            <label>Địa điểm (Location)</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder="VD: TP. Hồ Chí Minh"
                            />
                        </div>

                        <div className="salary-group">
                            <div className="input-item">
                                <label>Lương Tối thiểu (VND)</label>
                                <input
                                    type="number"
                                    name="salaryMin"
                                    value={formData.salaryMin}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-item">
                                <label>Lương Tối đa (VND)</label>
                                <input
                                    type="number"
                                    name="salaryMax"
                                    value={formData.salaryMax}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    {/* Card 4: Kỹ năng */}
                    <section className="form-card sidebar-card skills-card">
                        <div className="skills-header">
                            <h3 className="card-title">Kỹ năng yêu cầu</h3>
                            {skillsList.length > 0 && (
                                <div className="search-box">
                                    <Search size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Tìm nhanh..." 
                                        value={skillSearchTerm}
                                        onChange={(e) => setSkillSearchTerm(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="skills-content">
                            {skillsList.length > 0 ? (
                                <div className="skills-list-compact">
                                    {filteredSkillsList.length > 0 ? (
                                        filteredSkillsList.map(skill => {
                                            const skillId = skill.id || skill._id;
                                            const skillName = skill.name || skill.skillName || skill.title;
                                            const selectedSkill = formData.skills.find(s => s.skillId === skillId);
                                            const isSelected = !!selectedSkill;

                                            return (
                                                <div key={skillId} className={`compact-skill-item ${isSelected ? 'active' : ''}`}>
                                                    <label className="checkbox-main">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleSkillToggle(skillId)}
                                                        />
                                                        <span>{skillName}</span>
                                                    </label>

                                                    {isSelected && (
                                                        <label className="checkbox-sub">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSkill.isRequired}
                                                                onChange={(e) => handleSkillRequiredToggle(skillId, e.target.checked)}
                                                            />
                                                            Bắt buộc?
                                                        </label>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="empty-text">Không tìm thấy kỹ năng.</p>
                                    )}
                                </div>
                            ) : formData.categoryId ? (
                                <p className="empty-text">Đang tải hoặc chưa có kỹ năng...</p>
                            ) : (
                                <p className="empty-text">Vui lòng chọn danh mục để xem kỹ năng.</p>
                            )}
                        </div>
                    </section>

                    {/* Nút Submit cố định ở dưới cột phải */}
                    <div className="action-wrapper">
                        <button type="submit" disabled={loading} className="btn-primary-large">
                            {loading ? 'Đang xử lý...' : 'Xác nhận Tạo JD'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostJD;