import React, { useEffect, useState, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Plus, Search, Trash2, X, Users } from 'lucide-react';

import { faMapMarkerAlt, faMoneyBillWave, faBriefcase, faBuilding } from "@fortawesome/free-solid-svg-icons"
import jobService from '../../services/api/jobService';
import skillService from '../../services/api/skillService';
import categoryJDService from '../../services/api/categoryJD';
import applicationService from '../../services/api/applicationService';
import provincesServices from '../../services/api/provincesServices';
import vietnamAdministrativeLegacy from '../../data/vietnamAdministrativeLegacy.json';
import { useParams, useNavigate } from 'react-router-dom';
import './DetailJD.css';


const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const API_BASE_URL = "http://localhost:8081/identity";
const normalizeSkillName = (value) => String(value || '').trim().toLowerCase();

const trimText = (value) => String(value || '').trim();

const cloneTitles = (titles = []) => titles.map(item => ({ key: String(item?.key || ''), value: String(item?.value || '') }));

const normalizeSkillsForCompare = (skills = []) => {
    const deduped = dedupeSkills(skills).map((skill) => ({
        skillId: String(skill?.skillId || '').trim(),
        name: normalizeSkillName(skill?.name),
        isRequired: Boolean(skill?.isRequired)
    }));

    return deduped
        .filter((skill) => skill.skillId || skill.name)
        .sort((a, b) => {
            const left = `${a.skillId}-${a.name}-${a.isRequired ? '1' : '0'}`;
            const right = `${b.skillId}-${b.name}-${b.isRequired ? '1' : '0'}`;
            return left.localeCompare(right);
        });
};

const normalizeFormForCompare = (form = {}) => ({
    categoryId: String(form.categoryId || '').trim(),
    position: trimText(form.position),
    description: trimText(form.description),
    location: trimText(form.location),
    salaryMin: Number(form.salaryMin || 0),
    salaryMax: Number(form.salaryMax || 0),
    skills: normalizeSkillsForCompare(form.skills || [])
});

const dedupeSkills = (skills = []) => {
    const deduped = [];

    skills.forEach((skill) => {
        const skillId = String(skill?.skillId || '').trim();
        const skillName = normalizeSkillName(skill?.name);
        if (!skillId && !skillName) return;

        const existingIndex = deduped.findIndex((item) => {
            const sameId = skillId && item.skillId && item.skillId === skillId;
            const sameName = skillName && item.name && item.name === skillName;
            return sameId || sameName;
        });

        if (existingIndex === -1) {
            deduped.push({
                skillId,
                name: skillName,
                isRequired: Boolean(skill?.isRequired)
            });
            return;
        }

        const prev = deduped[existingIndex];
        deduped[existingIndex] = {
            skillId: prev.skillId || skillId,
            name: prev.name || skillName,
            isRequired: Boolean(prev.isRequired || skill?.isRequired)
        };
    });

    return deduped;
};
const DetailJD = () => {
    const { id } = useParams();
    const [jdDetail, setJdDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [editForm, setEditForm] = useState(null);
    const [dynamicTitles, setDynamicTitles] = useState([]);
    const [initialFormState, setInitialFormState] = useState(null);
    const [initialLocationState, setInitialLocationState] = useState(null);

    const [categories, setCategories] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [skillsList, setSkillsList] = useState([]);
    const [skillSearchTerm, setSkillSearchTerm] = useState("");
    const [hasAppliedCandidate, setHasAppliedCandidate] = useState(false);

    const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
    const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
    const [selectedWardCode, setSelectedWardCode] = useState("");
    const [specificAddress, setSpecificAddress] = useState("");

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

    const checkAppliedStatus = useCallback(async () => {
        try {
            const response = await applicationService.CheckApplied(id);

            const isApplied =
                response === true ||
                response?.result === true ||
                response?.data === true ||
                response?.isApplied === true;

            setHasAppliedCandidate(Boolean(isApplied));
        } catch (error) {
            setHasAppliedCandidate(false);
        }
    }, [id]);

    useEffect(() => {
        fetchJdDetail();
        getListCategories();
        checkAppliedStatus();

        // Real-time update: if this JD receives a status update, refetch detail
        const handler = (e) => {
            try {
                const { jdId, status } = e.detail || {};
                if (!jdId) return;
                if (String(jdId) === String(id)) {
                    fetchJdDetail();
                }
            } catch (err) {
                console.warn('Error handling jdStatusUpdated in DetailJD', err);
            }
        };
        window.addEventListener('jdStatusUpdated', handler);
        return () => window.removeEventListener('jdStatusUpdated', handler);
    }, [id, fetchJdDetail, checkAppliedStatus]);

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
        if (hasAppliedCandidate) {
            toast.warning('Không thể chỉnh sửa JD', {
                description: 'Hiện tại JD này đã có người ứng tuyển',
                style: toastStyles.warning
            });
            return;
        }

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
                name: normalizeSkillName(extractedName)
            };
        });

        const formObj = {
            categoryId: String(jdDetail.categoryId || jdDetail.category?.id || jdDetail.category?._id || ""),
            position: jdDetail.position || "",
            description: jdDetail.description || "",
            location: jdDetail.location || "",
            salaryMin: jdDetail.salaryMin || "",
            salaryMax: jdDetail.salaryMax || "",
            skills: dedupeSkills(mappedSkills)
        };

        // Parse location string to find matching province/district/ward
        const locationStr = trimText(jdDetail.location || "");
        let provinceCode = "";
        let districtCode = "";
        let wardCode = "";
        let address = "";
        let foundProvince = null;
        let foundDistrict = null;
        let foundWard = null;

        if (locationStr) {
            // Try to find matching province
            foundProvince = vietnamAdministrativeLegacy.find(p => {
                const pName = trimText(p.name || p.provinceName || "");
                return pName && locationStr.includes(pName);
            });

            if (foundProvince) {
                provinceCode = String(foundProvince.code || "");
                foundDistrict = foundProvince.districts?.find(d => {
                    const dName = trimText(d.name || "");
                    return dName && locationStr.includes(dName);
                });

                if (foundDistrict) {
                    districtCode = String(foundDistrict.code || "");
                    foundWard = foundDistrict.wards?.find(w => {
                        const wName = trimText(w.name || "");
                        return wName && locationStr.includes(wName);
                    });

                    if (foundWard) {
                        wardCode = String(foundWard.code || "");
                    }
                }

                // Extract specific address (everything before the province name)
                const provinceName = trimText(foundProvince.name || foundProvince.provinceName || "");
                const districtName = foundDistrict ? trimText(foundDistrict.name || "") : "";
                const wardName = foundWard ? trimText(foundWard.name || "") : "";
                
                const addressParts = [provinceName, districtName, wardName].filter(Boolean);
                const addressPattern = addressParts.join("|");
                const addressMatch = locationStr.split(new RegExp(addressPattern))[0]?.trim();
                address = addressMatch || "";
            }
        }

        setSelectedProvinceCode(provinceCode);
        setSelectedDistrictCode(districtCode);
        setSelectedWardCode(wardCode);
        setSpecificAddress(address);

        const titlesForEdit = cloneTitles(initialTitles);
        const formForEdit = { ...formObj, skills: [...formObj.skills] };

        setDynamicTitles(titlesForEdit);
        setEditForm(formForEdit);
        setInitialFormState({
            editForm: normalizeFormForCompare(formForEdit),
            dynamicTitles: cloneTitles(titlesForEdit).map(item => ({ key: trimText(item.key), value: trimText(item.value) }))
        });
        setInitialLocationState({
            provinceCode,
            districtCode,
            wardCode,
            specificAddress: address
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditForm(null);
        setInitialFormState(null);
        setInitialLocationState(null);
        setSkillSearchTerm("");
        setSelectedProvinceCode("");
        setSelectedDistrictCode("");
        setSelectedWardCode("");
        setSpecificAddress("");
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

        // Validate location is selected
        if (!selectedProvinceCode || !selectedDistrictCode || !selectedWardCode || !specificAddress.trim()) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng chọn đầy đủ địa điểm", style: toastStyles.warning });
            return;
        }

        const sanitizedForm = {
            ...editForm,
            categoryId: String(editForm.categoryId || '').trim(),
            position: trimText(editForm.position),
            description: trimText(editForm.description),
            location: "" // Will be built from location picker
        };

        const sanitizedDynamicTitles = dynamicTitles.map((item) => ({
            key: trimText(item.key),
            value: trimText(item.value)
        }));

        const hasEmptyDynamicTitles = sanitizedDynamicTitles.some(item => item.key === "" || item.value === "");
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

        // Build location from selected components
        const selectedProvince = vietnamAdministrativeLegacy.find((province) => String(province.code) === selectedProvinceCode);
        const selectedDistrict = selectedProvince?.districts?.find(
            (district) => String(district.code) === selectedDistrictCode
        );
        const selectedWard = selectedDistrict?.wards?.find((ward) => String(ward.code) === selectedWardCode);

        const finalLocation = [
            specificAddress.trim(),
            selectedWard?.name,
            selectedDistrict?.name,
            selectedProvince?.name
        ].filter(Boolean).join(', ');

        const titleObject = {};
        sanitizedDynamicTitles.forEach(item => {
            const titleKey = item.key === "" ? "Mục khác" : item.key;
            titleObject[titleKey] = item.value;
        });

        const cleanSkills = validSkillsToSubmit.map(s => {
            const realSkill = skillsList.find(listS => {
                const listSName = String(listS.name || listS.skillName || listS.title || "").trim().toLowerCase();
                return listSName === s.name || String(listS.id || listS._id) === s.skillId;
            });
            return { skillId: realSkill ? String(realSkill.id || realSkill._id) : s.skillId, isRequired: s.isRequired };
        });

        const dedupedCleanSkills = dedupeSkills(cleanSkills).filter(s => s.skillId);

        const payloadToSubmit = {
            ...sanitizedForm,
            location: finalLocation,
            title: titleObject,
            skills: dedupedCleanSkills
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

    const isFormChanged = Boolean(initialFormState && initialLocationState) && (() => {
        const normalizedCurrentForm = normalizeFormForCompare(editForm || {});
        const normalizedCurrentTitles = cloneTitles(dynamicTitles).map(item => ({ key: trimText(item.key), value: trimText(item.value) }));

        // Check if form/titles changed
        const formOrTitlesChanged = JSON.stringify(initialFormState.editForm) !== JSON.stringify(normalizedCurrentForm)
            || JSON.stringify(initialFormState.dynamicTitles) !== JSON.stringify(normalizedCurrentTitles);

        // Check if location picker changed
        const locationChanged = 
            initialLocationState.provinceCode !== selectedProvinceCode ||
            initialLocationState.districtCode !== selectedDistrictCode ||
            initialLocationState.wardCode !== selectedWardCode ||
            initialLocationState.specificAddress !== specificAddress;

        return formOrTitlesChanged || locationChanged;
    })();

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
            case 'LOCK': return 'status-closed';
            case 'PENDING': return 'status-pending';
            default: return 'status-pending';
        }
    };

    const getStatusText = (status) => {
        if (!status) return 'Đang chờ';
        switch(status.toUpperCase()) {
            case 'OPEN': return 'Đang mở';
            case 'CLOSED': return 'Đã đóng';
            case 'LOCK': return 'Đã khóa';
            case 'PENDING': return 'Đang chờ';
            default: return 'Đang chờ';
        }
    };

    return (
        <div className="jd-board-container detail-view-container">
            <Toaster position="top-right" />

            <header className="detail-header-card form-card">
                <div className="header-company-info">
                    <img
                        src={jdDetail.company?.logoUrl ? `${API_BASE_URL}${jdDetail.company.logoUrl}` : "https://via.placeholder.com/80"}
                        alt="Logo"
                        className="company-logo-large"
                    />
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
                    <button
                        className="btn-secondary flex items-center gap-2"
                        onClick={() => navigate(`/recruiter/jobs/${id}/applications`)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1'
                        }}
                    >
                        <Users size={18}/>
                        Xem danh sách ứng tuyển
                    </button>
                    <span title={hasAppliedCandidate ? 'Hiện tại JD này đã có người ứng tuyển' : ''}>
                        <button
                            className={`btn-primary ${hasAppliedCandidate ? 'btn-edit-locked' : ''}`}
                            type="button"
                            onClick={handleOpenModal}
                            disabled={hasAppliedCandidate}
                            aria-disabled={hasAppliedCandidate}
                        >
                            Chỉnh sửa JD
                        </button>
                    </span>
                </div>
            </header>

            {hasAppliedCandidate && (
                <div className="jd-edit-locked-note" role="note">
                    Hiện tại JD đang có người ứng tuyển nên bạn không thể chỉnh sửa nội dung !
                </div>
            )}

            <div className="jd-board-layout">
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
                                        {Number(jdDetail.salary_min).toLocaleString()} - {Number(jdDetail.salaryMax).toLocaleString()} VND
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


            {isModalOpen && editForm && (
                <div className="modal-overlay-modern">
                    <div className="modal-container-modern" style={{ maxHeight: '90vh', overflowY: 'auto' }}>

                        <div className="modal-header-modern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                            <h2 style={{ margin: 0, flex: 1 }}>Cập nhật mô tả công việc (JD)</h2>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {isFormChanged && (
                                    <button 
                                        type="submit" 
                                        form="update-jd-form" 
                                        className="btn-primary" 
                                        disabled={isUpdating}
                                        style={{ minWidth: '150px' }}
                                    >
                                        {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                )}
                                <button onClick={handleCloseModal} className="btn-close-icon"><X size={24} /></button>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateSubmit} id="update-jd-form" className="jd-board-layout" style={{ gap: '20px', padding: '36px', maxWidth: 'none' }}>

                            {/* Cột Trái Modal */}
                            <div className="layout-main-column">
                                <div className="form-card scroll-card">
                                    <h3 className="card-title">Thông Tin Cơ Bản</h3>
                                    <div className="input-group-grid">
                                        <div className="input-item">
                                            <label>Vị Trí Công Việc</label>
                                            <input
                                                type="text"
                                                name="position"
                                                value={editForm.position}
                                                onChange={handleChange}
                                                required
                                                placeholder="VD: Nhân viên Marketing..."
                                            />
                                        </div>
                                        <div className="input-item">
                                            <label>Danh Mục Kỹ Năng</label>
                                            <select
                                                className="category-select"
                                                value={editForm.categoryId}
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

                                    <div className="card-section-divider" />

                                    <h3 className="card-title">Chi Tiết Công Việc</h3>
                                    <div className="input-item full-width">
                                        <label>Mô tả công việc</label>
                                        <textarea
                                            name="description"
                                            value={editForm.description}
                                            onChange={handleChange}
                                            required
                                            rows="3"
                                            placeholder="Mô tả chi tiết về vị trí, trách nhiệm và môi trường làm việc..."
                                        ></textarea>
                                    </div>

                                    <div className="dynamic-section">
                                        <div className="dynamic-header">
                                            <label>Các mục tiêu đề & Chi tiết</label>
                                            <button type="button" onClick={addDynamicTitle} className="btn-add-outline">
                                                <Plus size={14} /> Thêm mục
                                            </button>
                                        </div>

                                        <div className="dynamic-body job-feed">
                                            {dynamicTitles.map((item, index) => (
                                                <div key={index} className="dynamic-row">
                                                    <input
                                                        type="text"
                                                        value={item.key}
                                                        onChange={(e) => handleDynamicTitleChange(index, "key", e.target.value)}
                                                        placeholder="Ví dụ: Quyền lợi, Yêu cầu..."
                                                        className="dynamic-input-key"
                                                    />
                                                    <textarea
                                                        value={item.value}
                                                        onChange={(e) => handleDynamicTitleChange(index, "value", e.target.value)}
                                                        placeholder="Nhập chi tiết cho mục này..."
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

                            <div className="layout-sidebar">
                                <div className="form-card sidebar-card scroll-card">
                                    <h3 className="card-title">Địa Điểm & Mức Lương</h3>
                                    <div className="input-item full-width location-input-shell">
                                        <div className="location-field-group">
                                            <div className="location-grid">
                                                <div className="location-select-wrap location-field-half">
                                                    <label className="location-mini-label">Tỉnh/Thành Phố</label>
                                                    <select
                                                        className="location-select"
                                                        value={selectedProvinceCode}
                                                        onChange={(e) => {
                                                            setSelectedProvinceCode(e.target.value);
                                                            setSelectedDistrictCode("");
                                                            setSelectedWardCode("");
                                                        }}
                                                        required
                                                    >
                                                        <option value="">-- Chọn tỉnh/thành phố --</option>
                                                        {vietnamAdministrativeLegacy.map((province) => (
                                                            <option key={province.code} value={province.code}>
                                                                {province.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="location-select-wrap location-field-half">
                                                    <label className="location-mini-label">Quận/Huyện</label>
                                                    <select
                                                        className="location-select"
                                                        value={selectedDistrictCode}
                                                        onChange={(e) => {
                                                            setSelectedDistrictCode(e.target.value);
                                                            setSelectedWardCode("");
                                                        }}
                                                        required
                                                        disabled={!selectedProvinceCode}
                                                    >
                                                        <option value="">-- Chọn quận/huyện --</option>
                                                        {selectedProvinceCode && vietnamAdministrativeLegacy.find(p => String(p.code) === selectedProvinceCode)?.districts?.map((district) => (
                                                            <option key={district.code} value={district.code}>
                                                                {district.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="location-select-wrap location-field-full">
                                                    <label className="location-mini-label">Xã/Phường</label>
                                                    <select
                                                        className="location-select"
                                                        value={selectedWardCode}
                                                        onChange={(e) => setSelectedWardCode(e.target.value)}
                                                        required
                                                        disabled={!selectedDistrictCode}
                                                    >
                                                        <option value="">-- Chọn xã/phường --</option>
                                                        {selectedProvinceCode && selectedDistrictCode && vietnamAdministrativeLegacy.find(p => String(p.code) === selectedProvinceCode)?.districts?.find(d => String(d.code) === selectedDistrictCode)?.wards?.map((ward) => (
                                                            <option key={ward.code} value={ward.code}>
                                                                {ward.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="location-detail-wrap location-field-full">
                                                    <label className="location-mini-label">Địa Chỉ Cụ Thể</label>
                                                    <input
                                                        type="text"
                                                        value={specificAddress}
                                                        onChange={(e) => setSpecificAddress(e.target.value)}
                                                        placeholder="VD: Số 12 Nguyễn Huệ"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {selectedProvinceCode && selectedDistrictCode && selectedWardCode && specificAddress && (
                                                <div className="location-preview">
                                                    <span>Địa Chỉ Đã Chọn</span>
                                                    <strong>
                                                        {[
                                                            specificAddress.trim(),
                                                            vietnamAdministrativeLegacy.find(p => String(p.code) === selectedProvinceCode)?.districts?.find(d => String(d.code) === selectedDistrictCode)?.wards?.find(w => String(w.code) === selectedWardCode)?.name,
                                                            vietnamAdministrativeLegacy.find(p => String(p.code) === selectedProvinceCode)?.districts?.find(d => String(d.code) === selectedDistrictCode)?.name,
                                                            vietnamAdministrativeLegacy.find(p => String(p.code) === selectedProvinceCode)?.name
                                                        ].filter(Boolean).join(', ')}
                                                    </strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="salary-group">
                                        <div className="input-item">
                                            <label>Lương Tối Thiểu</label>
                                            <input
                                                type="text"
                                                name="salaryMin"
                                                value={editForm.salaryMin ? Number(editForm.salaryMin).toLocaleString('vi-VN') : ''}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\./g, '').replace(/[^\d]/g, '');
                                                    const numValue = rawValue ? Number(rawValue) : '';
                                                    setEditForm(prev => ({ ...prev, salaryMin: numValue }));
                                                }}
                                                required
                                                placeholder="VD: 10.000.000"
                                            />
                                        </div>
                                        <div className="input-item">
                                            <label>Lương Tối Đa</label>
                                            <input
                                                type="text"
                                                name="salaryMax"
                                                value={editForm.salaryMax ? Number(editForm.salaryMax).toLocaleString('vi-VN') : ''}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\./g, '').replace(/[^\d]/g, '');
                                                    const numValue = rawValue ? Number(rawValue) : '';
                                                    setEditForm(prev => ({ ...prev, salaryMax: numValue }));
                                                }}
                                                required
                                                placeholder="VD: 20.000.000"
                                            />
                                        </div>
                                    </div>

                                    <div className="skills-header">
                                        <h3 className="card-title">Kỹ năng Yêu Cầu</h3>
                                        {skillsList.length > 0 && (
                                            <div className="search-box">
                                                <Search size={16} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Tìm kiếm..." 
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
                                                    })
                                                ) : (
                                                    <p className="empty-text">Không tìm thấy kỹ năng phù hợp</p>
                                                )}
                                            </div>
                                        ) : editForm.categoryId ? (
                                            <p className="empty-text">Đang tải danh sách kỹ năng...</p>
                                        ) : (
                                            <p className="empty-text">Vui lòng chọn danh mục để xem kỹ năng</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailJD;