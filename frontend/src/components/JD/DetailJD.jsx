import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

import jobService from '../../services/api/jobService';
import skillService from '../../services/api/skillService';
import categoryJDService from '../../services/api/categoryJD';

import './DetailJD.css';

const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const DetailJD = () => {
    const { id } = useParams();
    const [jdDetail, setJdDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [editForm, setEditForm] = useState(null);
    const [dynamicTitles, setDynamicTitles] = useState([]);
    const [initialFormState, setInitialFormState] = useState(null);

    const [categories, setCategories] = useState([]);
    const [skillsList, setSkillsList] = useState([]);

    const fetchJdDetail = async () => {
        try {
            const response = await jobService.getDetailJd(id);
            setJdDetail(response.result);
            setLoading(false);
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết JD', { style: toastStyles.error });
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJdDetail();
        getListCategories();
    }, [id]);

    const getListCategories = async () => {
        try {
            const response = await categoryJDService.getListCategories();
            const data = response?.data?.data || response?.data || response || [];
            setCategories(Array.isArray(data) ? data : []); 
        } catch (error) {
            toast.error("Lỗi khi tải danh mục", { style: toastStyles.error });
        }
    };

    useEffect(() => {
        const fetchSkills = async () => {
            if (editForm?.categoryId) {
                try {
                    const response = await skillService.getListSkillsOfCategory(editForm.categoryId);
                    const data = response?.result || response?.data?.data || response?.data || response || [];
                    setSkillsList(Array.isArray(data) ? data : []);
                } catch (error) {
                    toast.error("Lỗi tải kỹ năng", { style: toastStyles.error });
                }
            } else {
                setSkillsList([]);
            }
        };
        fetchSkills();
    }, [editForm?.categoryId]);

    const handleOpenModal = () => {
        let initialTitles = [];
        if (jdDetail.title && Object.keys(jdDetail.title).length > 0) {
            initialTitles = Object.entries(jdDetail.title).map(([k, v]) => ({ key: k, value: v }));
        } else {
            initialTitles = [{ key: "Quyền lợi", value: "" }, { key: "Yêu cầu", value: "" }];
        }
        
        const mappedSkills = (jdDetail.skills || []).map(s => {
            let extractedId = s.skillId || s.id || s._id;
            if (!extractedId && s.skill) extractedId = s.skill.id || s.skill._id;
            
            let extractedName = s.name || s.skillName || s.title;
            if (!extractedName && s.skill) extractedName = s.skill.name || s.skill.title;

            const extractedRequired = s.isRequired !== undefined ? s.isRequired : (s.required || false);
            
            return {
                skillId: String(extractedId || ""), 
                isRequired: extractedRequired,
                name: String(extractedName || "").trim().toLowerCase() 
            };
        });

        const formObj = {
            categoryId: String(jdDetail.categoryId || jdDetail.category?.id || jdDetail.category?._id || ""),
            position: jdDetail.position || "",
            description: jdDetail.description || "",
            location: jdDetail.location || "",
            salaryMin: jdDetail.salaryMin || "",
            salaryMax: jdDetail.salaryMax || "",
            skills: mappedSkills
        };

        setDynamicTitles(initialTitles);
        setEditForm(formObj);
        setInitialFormState({ editForm: formObj, dynamicTitles: initialTitles });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditForm(null);
        setInitialFormState(null); 
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e) => {
        const selectedCategoryId = e.target.value;
        setEditForm(prev => ({
            ...prev,
            categoryId: selectedCategoryId
        }));
    };

    const handleSkillToggle = (toggledId, toggledName) => {
        setEditForm(prev => {
            const exists = prev.skills.find(s => 
                s.skillId === toggledId || 
                (s.name && toggledName && s.name === toggledName)
            );

            if (exists) {
                return { 
                    ...prev, 
                    skills: prev.skills.filter(s => 
                        s.skillId !== toggledId && 
                        (!s.name || !toggledName || s.name !== toggledName)
                    ) 
                };
            } else {
                return { 
                    ...prev, 
                    skills: [...prev.skills, { skillId: toggledId, isRequired: false, name: toggledName }] 
                };
            }
        });
    };

    const handleSkillRequiredToggle = (toggledId, toggledName, checked) => {
        setEditForm(prev => ({
            ...prev,
            skills: prev.skills.map(s => {
                const isMatch = s.skillId === toggledId || (s.name && toggledName && s.name === toggledName);
                return isMatch ? { ...s, isRequired: checked } : s;
            })
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

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();

        const hasEmptyDynamicTitles = dynamicTitles.some(item => item.key.trim() === "" || item.value.trim() === "");
        if (hasEmptyDynamicTitles) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng điền đầy đủ Tiêu đề và Mô tả", style: toastStyles.warning });
            return;
        }

        if (Number(editForm.salaryMax) < Number(editForm.salaryMin)) {
            toast.error("Lỗi nhập liệu", { description: "Lương tối đa phải lớn hơn hoặc bằng tối thiểu", style: toastStyles.warning });
            return;
        }

        // BƯỚC LỌC KỲ DIỆU: Chỉ giữ lại những Kỹ năng thực sự thuộc về Category hiện tại (có mặt trong skillsList)
        const validSkillsToSubmit = editForm.skills.filter(s => {
            return skillsList.some(listS => {
                const listSId = String(listS.id || listS._id || listS.skillId || "");
                const listSName = String(listS.name || listS.skillName || listS.title || "").trim().toLowerCase();
                return (s.skillId === listSId) || (s.name && s.name === listSName);
            });
        });

        // Kiểm tra xem sau khi lọc, người dùng có chọn kỹ năng nào hợp lệ không
        if (validSkillsToSubmit.length === 0) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng chọn ít nhất 1 kỹ năng yêu cầu cho danh mục hiện tại", style: toastStyles.warning });
            return;
        }

        const titleObject = {};
        dynamicTitles.forEach(item => {
            const finalKey = item.key.trim() === "" ? "Mục khác" : item.key.trim();
            titleObject[finalKey] = item.value;
        });

        const cleanSkills = validSkillsToSubmit.map(s => {
            const realSkill = skillsList.find(listS => {
                const listSName = String(listS.name || listS.skillName || listS.title || "").trim().toLowerCase();
                return listSName === s.name || String(listS.id || listS._id) === s.skillId;
            });
            
            return {
                skillId: realSkill ? String(realSkill.id || realSkill._id) : s.skillId,
                isRequired: s.isRequired
            };
        });

        const payloadToSubmit = {
            ...editForm,
            title: titleObject,
            skills: cleanSkills
        };

        setIsUpdating(true);
        try {
            await jobService.updateJd(jdDetail.id, payloadToSubmit);
            toast.success("Thành công", { description: "Đã cập nhật JD!", style: toastStyles.success });
            await fetchJdDetail();
            handleCloseModal();
        } catch (error) {
            toast.error("Lỗi cập nhật", { description: "Không thể lưu thay đổi", style: toastStyles.error });
        } finally {
            setIsUpdating(false);
        }
    };

    const isFormChanged = initialFormState 
        && (JSON.stringify(initialFormState.editForm) !== JSON.stringify(editForm) 
        || JSON.stringify(initialFormState.dynamicTitles) !== JSON.stringify(dynamicTitles));

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!jdDetail) {
        return <div className="error-container">Không tìm thấy thông tin JD</div>;
    }

    const statusText = jdDetail.status || "PENDING"; 

    const getStatusClass = (status) => {
        if (!status) return 'status-pending';
        switch(status.toUpperCase()) {
            case 'OPEN': return 'status-open';
            case 'CLOSED': return 'status-closed';
            case 'PENDING': return 'status-pending';
            default: return 'status-pending';
        }
    };
    return (
        <div className="detail-jd-wrapper">
            <Toaster position="top-right" />
            
            <div className="jd-header-card">
                <div className="header-left">
                    <div className="company-logo-wrapper">
                        <img 
                            src={jdDetail.company?.logoUrl || "https://via.placeholder.com/100"} 
                            alt={jdDetail.company?.name || "Company Logo"} 
                            className="company-logo" 
                        />
                    </div>
                    <div className="header-titles">
                        <h1 className="job-position">{jdDetail.position}</h1>
                        <h2 className="company-name">{jdDetail.company?.name || "Tên công ty chưa cập nhật"}</h2>
                    </div>
                </div>

                <div className="header-right">
                    <div className={`status-badge ${getStatusClass(statusText)}`}>
                            Trạng thái: {statusText}
                        </div>
                    <button className="btn-update" onClick={handleOpenModal}>
                        Cập nhật
                    </button>
                </div>
            </div>

            <div className="jd-body-layout">
                <div className="jd-main-content">
                    <div className="content-section">
                        <h3>Mô tả công việc</h3>
                        <p className="text-content">{jdDetail.description}</p>
                    </div>

                    {jdDetail.title && Object.entries(jdDetail.title).map(([key, value], index) => (
                        <div key={index} className="content-section">
                            <h3>{key}</h3>
                            <p className="text-content">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="jd-sidebar">
                    <div className="sidebar-card">
                        <h3>Thông tin chung</h3>
                        <div className="info-item">
                            <span className="info-icon">📍</span>
                            <div className="info-text">
                                <span className="info-label">Địa điểm</span>
                                <span className="info-value">{jdDetail.location}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">💰</span>
                            <div className="info-text">
                                <span className="info-label">Mức lương</span>
                                <span className="info-value highlight-salary">
                                    {Number(jdDetail.salaryMin).toLocaleString()} - {Number(jdDetail.salaryMax).toLocaleString()} VND
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h3>Kỹ năng yêu cầu</h3>
                        <div className="skills-tag-list">
                            {jdDetail.skills?.map((skill, index) => (
                                <span key={index} className={`skill-tag ${skill.required ? 'tag-required' : ''}`}>
                                    {skill.name || skill.skillName || skill.title} {skill.required && <span className="req-star">*</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && editForm && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '850px' }}>
                        <div className="modal-header">
                            <h2>Cập nhật Job Description</h2>
                            <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
                        </div>
                        
                        <form onSubmit={handleUpdateSubmit} className="modal-body">
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Vị trí (Position)</label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={editForm.position}
                                        onChange={handleChange}
                                        required
                                        className="form-control"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Danh mục (Category)</label>
                                    <select
                                        value={editForm.categoryId}
                                        onChange={handleCategoryChange}
                                        required
                                        className="form-control"
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(cat => {
                                            const catId = String(cat.id || cat._id); 
                                            return (
                                                <option key={catId} value={catId}>
                                                    {cat.name || cat.categoryName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="dynamic-titles-container mt-3 mb-3">
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
                                                    placeholder="Tiêu đề..."
                                                />
                                            </div>
                                            <div className="dynamic-title-value">
                                                <input
                                                    type="text"
                                                    value={item.value}
                                                    onChange={(e) => handleDynamicTitleChange(index, "value", e.target.value)}
                                                    className="form-control"
                                                    placeholder="Mô tả..."
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

                            <div className="form-group">
                                <label>Mô tả công việc chung (Description)</label>
                                <textarea
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleChange}
                                    required
                                    rows="4"
                                    className="form-control"
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Địa điểm (Location)</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={editForm.location}
                                    onChange={handleChange}
                                    required
                                    className="form-control"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Lương tối thiểu (VND)</label>
                                    <input
                                        type="number"
                                        name="salaryMin"
                                        value={editForm.salaryMin}
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
                                        value={editForm.salaryMax}
                                        onChange={handleChange}
                                        required
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            {skillsList.length > 0 && (
                                <div className="skills-container mt-3">
                                    <label className="skills-title">Kỹ năng yêu cầu</label>
                                    <div className="skills-grid">
                                        {skillsList.map(skill => {
                                            const listSkillId = String(skill.id || skill._id || skill.skillId || "");
                                            const listSkillName = String(skill.name || skill.skillName || skill.title || "").trim().toLowerCase();
                                            
                                            const selectedSkill = editForm.skills.find(s => 
                                                (s.skillId && s.skillId !== "undefined" && s.skillId === listSkillId) || 
                                                (s.name && listSkillName && s.name === listSkillName)
                                            );
                                            
                                            const isSelected = !!selectedSkill;

                                            return (
                                                <div key={listSkillId} className="skill-item">
                                                    <label className="skill-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleSkillToggle(listSkillId, listSkillName)}
                                                        />
                                                        <span>{skill.name || skill.skillName || skill.title}</span>
                                                    </label>

                                                    {isSelected && (
                                                        <label className="skill-required-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSkill.isRequired}
                                                                onChange={(e) => handleSkillRequiredToggle(listSkillId, listSkillName, e.target.checked)}
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

                            {editForm.categoryId && skillsList.length === 0 && (
                                <p style={{fontSize: '13px', color: '#6b7280', fontStyle: 'italic', marginTop: '10px'}}>
                                    (Danh mục này chưa có kỹ năng nào hoặc đang tải...)
                                </p>
                            )}

                            <div className="modal-footer" style={{ marginTop: '20px' }}>
                                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Đóng</button>
                                
                                {isFormChanged && (
                                    <button type="submit" className="btn-save" disabled={isUpdating}>
                                        {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailJD;