import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faMoneyBillWave, faBriefcase, faBuilding } from "@fortawesome/free-solid-svg-icons";
import { Plus, Search, Trash2, X } from 'lucide-react'; // Đã thêm các icon cần thiết

import jobService from '../../services/api/jobService';
import skillService from '../../services/api/skillService';
import categoryJDService from '../../services/api/categoryJD';

import './DetailJD.css';
// Tái sử dụng các class từ PostJD.css nếu bạn nhúng chung, 
// hoặc copy các class cấu trúc grid sang DetailJD.css

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
    const [skillSearchTerm, setSkillSearchTerm] = useState("");

    const fetchJdDetail = useCallback(async () => {
        try {
            const response = await jobService.getDetailJd(id);
            setJdDetail(response.result);
            setLoading(false);
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết JD', { style: toastStyles.error });
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchJdDetail();
        getListCategories();
    }, [id, fetchJdDetail]);

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
        setSkillSearchTerm("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e) => {
        setEditForm(prev => ({ ...prev, categoryId: e.target.value }));
    };

    const handleSkillToggle = (toggledId, toggledName) => {
        setEditForm(prev => {
            const exists = prev.skills.find(s => s.skillId === toggledId || (s.name && toggledName && s.name === toggledName));
            if (exists) {
                return { ...prev, skills: prev.skills.filter(s => s.skillId !== toggledId && (!s.name || !toggledName || s.name !== toggledName)) };
            } else {
                return { ...prev, skills: [...prev.skills, { skillId: toggledId, isRequired: false, name: toggledName }] };
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

    const addDynamicTitle = () => setDynamicTitles([...dynamicTitles, { key: "", value: "" }]);
    const removeDynamicTitle = (indexToRemove) => setDynamicTitles(dynamicTitles.filter((_, index) => index !== indexToRemove));
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

        const validSkillsToSubmit = editForm.skills.filter(s => skillsList.some(listS => {
            const listSId = String(listS.id || listS._id || listS.skillId || "");
            const listSName = String(listS.name || listS.skillName || listS.title || "").trim().toLowerCase();
            return (s.skillId === listSId) || (s.name && s.name === listSName);
        }));

        if (validSkillsToSubmit.length === 0) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng chọn ít nhất 1 kỹ năng yêu cầu", style: toastStyles.warning });
            return;
        }

        const titleObject = {};
        dynamicTitles.forEach(item => { titleObject[item.key.trim() === "" ? "Mục khác" : item.key.trim()] = item.value; });

        const cleanSkills = validSkillsToSubmit.map(s => {
            const realSkill = skillsList.find(listS => {
                const listSName = String(listS.name || listS.skillName || listS.title || "").trim().toLowerCase();
                return listSName === s.name || String(listS.id || listS._id) === s.skillId;
            });
            return { skillId: realSkill ? String(realSkill.id || realSkill._id) : s.skillId, isRequired: s.isRequired };
        });

        const payloadToSubmit = { ...editForm, title: titleObject, skills: cleanSkills };

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

    const isFormChanged = initialFormState && (JSON.stringify(initialFormState.editForm) !== JSON.stringify(editForm) || JSON.stringify(initialFormState.dynamicTitles) !== JSON.stringify(dynamicTitles));

    const filteredSkillsList = skillsList.filter(skill => {
        const skillName = String(skill.name || skill.skillName || skill.title || "").toLowerCase();
        return skillName.includes(skillSearchTerm.toLowerCase());
    });

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Đang tải dữ liệu...</p></div>;
    if (!jdDetail) return <div className="error-container">Không tìm thấy thông tin JD</div>;

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

    const getStatusText = (status) => {
        if (!status) return 'Đang chờ';
        switch(status.toUpperCase()) {
            case 'OPEN': return 'Đang mở';
            case 'CLOSED': return 'Đã đóng';
            case 'PENDING': return 'Đang chờ';
            default: return 'Đang chờ';
        }
    };

    return (
        <div className="jd-board-container detail-view-container">
            <Toaster position="top-right" />
            
            {/* --- HEADER CHI TIẾT --- */}
            <header className="detail-header-card form-card">
                <div className="header-company-info">
                    <img src={jdDetail.company?.logoUrl || "https://via.placeholder.com/80"} alt="Logo" className="company-logo-large" />
                    <div>
                        <h1 className="job-title-large">{jdDetail.position}</h1>
                        <p className="company-name-large">
                            <FontAwesomeIcon icon={faBuilding} className="icon-sm" /> {jdDetail.company?.name || "Tên công ty chưa cập nhật"}
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <span className={`status-badge-modern ${getStatusClass(statusText)}`}>
                        {getStatusText(statusText)}
                    </span>
                    <button className="btn-primary" onClick={handleOpenModal}>
                        Chỉnh sửa JD
                    </button>
                </div>
            </header>

            {/* --- LAYOUT 2 CỘT CHO VIEW MODE --- */}
            <div className="jd-board-layout">
                {/* Cột Trái: Mô tả chi tiết */}
                <div className="layout-main-column">
                    <section className="form-card content-card">
                        <h3 className="card-title">Mô tả công việc</h3>
                        <div className="text-content">{jdDetail.description}</div>

                        {jdDetail.title && Object.entries(jdDetail.title).map(([key, value], index) => (
                            <div key={index} className="dynamic-content-section mt-4">
                                <h3 className="card-title-sm">{key}</h3>
                                <div className="text-content">{value}</div>
                            </div>
                        ))}
                    </section>
                </div>

                {/* Cột Phải: Thuộc tính & Kỹ năng */}
                <div className="layout-sidebar">
                    <section className="form-card sidebar-card">
                        <h3 className="card-title">Thông tin chung</h3>
                        <div className="info-list">
                            <div className="info-item-modern">
                                <div className="icon-box"><FontAwesomeIcon icon={faMapMarkerAlt} /></div>
                                <div>
                                    <span className="info-label">Địa điểm</span>
                                    <span className="info-value">{jdDetail.location}</span>
                                </div>
                            </div>
                            <div className="info-item-modern">
                                <div className="icon-box green"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
                                <div>
                                    <span className="info-label">Mức lương</span>
                                    <span className="info-value highlight">
                                        {Number(jdDetail.salaryMin).toLocaleString()} - {Number(jdDetail.salaryMax).toLocaleString()} VND
                                    </span>
                                </div>
                            </div>
                            <div className="info-item-modern">
                                <div className="icon-box blue"><FontAwesomeIcon icon={faBriefcase} /></div>
                                <div>
                                    <span className="info-label">Danh mục</span>
                                    <span className="info-value">{jdDetail.category?.name || jdDetail.category?.categoryName || "Chưa có"}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="form-card sidebar-card">
                        <h3 className="card-title">Kỹ năng yêu cầu</h3>
                        <div className="skills-tags-container">
                            {jdDetail.skills?.map((skill, index) => (
                                <span key={index} className={`skill-tag-modern ${skill.required ? 'required' : ''}`}>
                                    {skill.name || skill.skillName || skill.title}
                                    {skill.required && <span className="star-req">*</span>}
                                </span>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* =========================================
               MODAL CẬP NHẬT (DÙNG LẠI GRID 2 CỘT)
            ========================================= */}
            {isModalOpen && editForm && (
                <div className="modal-overlay-modern">
                    <div className="modal-container-modern">
                        
                        <div className="modal-header-modern">
                            <h2>Cập nhật Job Description</h2>
                            <button onClick={handleCloseModal} className="btn-close-icon"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="modal-body-scroll">
                            <div className="jd-board-layout" style={{ gap: '20px' }}>
                                
                                {/* Cột Trái Modal */}
                                <div className="layout-main-column">
                                    <div className="form-card">
                                        <h3 className="card-title">Thông tin cơ bản</h3>
                                        <div className="input-group-grid">
                                            <div className="input-item">
                                                <label>Vị trí (Position)</label>
                                                <input type="text" name="position" value={editForm.position} onChange={handleChange} required />
                                            </div>
                                            <div className="input-item">
                                                <label>Danh mục (Category)</label>
                                                <select value={editForm.categoryId} onChange={handleCategoryChange} required>
                                                    <option value="">-- Chọn --</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name || cat.categoryName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-card">
                                        <h3 className="card-title">Mô tả công việc</h3>
                                        <div className="input-item full-width">
                                            <label>Mô tả chung (Description)</label>
                                            <textarea name="description" value={editForm.description} onChange={handleChange} required rows="3"></textarea>
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
                                    </div>
                                </div>

                                {/* Cột Phải Modal */}
                                <div className="layout-sidebar">
                                    <div className="form-card sidebar-card">
                                        <h3 className="card-title">Yêu cầu & Lương</h3>
                                        <div className="input-item full-width">
                                            <label>Địa điểm (Location)</label>
                                            <input type="text" name="location" value={editForm.location} onChange={handleChange} required />
                                        </div>
                                        <div className="salary-group">
                                            <div className="input-item">
                                                <label>Lương Tối thiểu</label>
                                                <input type="number" name="salaryMin" value={editForm.salaryMin} onChange={handleChange} required />
                                            </div>
                                            <div className="input-item">
                                                <label>Lương Tối đa</label>
                                                <input type="number" name="salaryMax" value={editForm.salaryMax} onChange={handleChange} required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-card sidebar-card skills-card" style={{ maxHeight: '400px' }}>
                                        <div className="skills-header">
                                            <h3 className="card-title">Kỹ năng yêu cầu</h3>
                                            <div className="search-box">
                                                <Search size={16} />
                                                <input type="text" placeholder="Tìm nhanh..." value={skillSearchTerm} onChange={(e) => setSkillSearchTerm(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="skills-content">
                                            {filteredSkillsList.length > 0 ? (
                                                <div className="skills-list-compact">
                                                    {filteredSkillsList.map(skill => {
                                                        const listSkillId = String(skill.id || skill._id || skill.skillId || "");
                                                        const listSkillName = String(skill.name || skill.skillName || skill.title || "").trim().toLowerCase();
                                                        const selectedSkill = editForm.skills.find(s => (s.skillId && s.skillId === listSkillId) || (s.name && s.name === listSkillName));
                                                        const isSelected = !!selectedSkill;

                                                        return (
                                                            <div key={listSkillId} className={`compact-skill-item ${isSelected ? 'active' : ''}`}>
                                                                <label className="checkbox-main">
                                                                    <input type="checkbox" checked={isSelected} onChange={() => handleSkillToggle(listSkillId, listSkillName)} />
                                                                    <span>{skill.name || skill.skillName || skill.title}</span>
                                                                </label>
                                                                {isSelected && (
                                                                    <label className="checkbox-sub">
                                                                        <input type="checkbox" checked={selectedSkill.isRequired} onChange={(e) => handleSkillRequiredToggle(listSkillId, listSkillName, e.target.checked)} />
                                                                        Bắt buộc?
                                                                    </label>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="empty-text">Không tìm thấy kỹ năng.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer Cố định của Modal */}
                            <div className="modal-footer-modern">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Hủy bỏ</button>
                                {isFormChanged && (
                                    <button type="submit" className="btn-primary" disabled={isUpdating}>
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