import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Hand, Plus, Trash2 } from 'lucide-react';

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

    return (
        <div className="post-jd-container">
            <Toaster position="top-right" />
            <h2 className="form-title">
                <Hand className="title-icon" />
                Tạo Job Description Mới
            </h2>

            <form onSubmit={handleCreateJd} className="jd-form">
                
                <div className="form-row">
                    <div className="form-group">
                        <label>Vị trí (Position)</label>
                        <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            required
                            placeholder="VD: Marketing Executive"
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label>Danh mục (Category)</label>
                        <select
                            value={formData.categoryId}
                            onChange={handleCategoryChange}
                            required
                            className="form-control"
                        >
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map(cat => {
                                const catId = cat.id || cat._id; 
                                return (
                                    <option key={catId} value={catId}>
                                        {cat.name || cat.categoryName}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="dynamic-titles-container">
                    <div className="dynamic-titles-header">
                        <label>Các mục Tiêu đề & Mô tả chi tiết</label>
                        <button type="button" onClick={addDynamicTitle} className="btn-add">
                            <Plus size={16} /> Thêm mục mới
                        </button>
                    </div>

                    <div className="dynamic-titles-list">
                        {dynamicTitles.map((item, index) => (
                            <div key={index} className="dynamic-title-row">
                                <div className="dynamic-title-key">
                                    <input
                                        type="text"
                                        value={item.key}
                                        onChange={(e) => handleDynamicTitleChange(index, "key", e.target.value)}
                                        className="form-control"
                                        placeholder="Tiêu đề (VD: Quyền lợi)"
                                    />
                                </div>
                                <div className="dynamic-title-value">
                                    <input
                                        type="text"
                                        value={item.value}
                                        onChange={(e) => handleDynamicTitleChange(index, "value", e.target.value)}
                                        className="form-control"
                                        placeholder="Mô tả cho tiêu đề này..."
                                    />
                                </div>
                                
                                {dynamicTitles.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDynamicTitle(index)}
                                        className="btn-remove"
                                        title="Xóa mục này"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* --------------------------------------------------- */}

                <div className="form-group">
                    <label>Mô tả công việc chung (Description)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="4"
                        className="form-control"
                        placeholder="Tham gia xây dựng và triển khai..."
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>Địa điểm (Location)</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="VD: TP. Hồ Chí Minh"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Lương tối thiểu (VND)</label>
                        <input
                            type="number"
                            name="salaryMin"
                            value={formData.salaryMin}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label>Lương tối đa (VND)</label>
                        <input
                            type="number"
                            name="salaryMax"
                            value={formData.salaryMax}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                    </div>
                </div>

                {skillsList.length > 0 && (
                    <div className="skills-container">
                        <label className="skills-title">Kỹ năng yêu cầu</label>
                        <div className="skills-grid">
                            {skillsList.map(skill => {
                                const skillId = skill.id || skill._id;
                                const skillName = skill.name || skill.skillName || skill.title;
                                
                                const selectedSkill = formData.skills.find(s => s.skillId === skillId);
                                const isSelected = !!selectedSkill;

                                return (
                                    <div key={skillId} className="skill-item">
                                        <label className="skill-label">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSkillToggle(skillId)}
                                            />
                                            <span>{skillName}</span>
                                        </label>

                                        {isSelected && (
                                            <label className="skill-required-label">
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
                            })}
                        </div>
                    </div>
                )}

                {formData.categoryId && skillsList.length === 0 && (
                    <p style={{fontSize: '13px', color: '#6b7280', fontStyle: 'italic'}}>
                        (Danh mục này chưa có kỹ năng nào hoặc đang tải...)
                    </p>
                )}

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-submit"
                    >
                        {loading ? 'Đang tạo...' : 'Tạo JD'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostJD;