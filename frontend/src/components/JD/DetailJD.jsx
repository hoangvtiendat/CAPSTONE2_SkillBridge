import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Plus, Search, Trash2, Users } from 'lucide-react';

import { faMapMarkerAlt, faMoneyBillWave, faBriefcase, faBuilding } from "@fortawesome/free-solid-svg-icons"
import jobService from '../../services/api/jobService';
import skillService from '../../services/api/skillService';
import categoryJDService from '../../services/api/categoryJD';
import JDInfoCard from './JDInfoCard';
import applicationService from '../../services/api/applicationService';
import subscriptionService from '../../services/api/subscriptionService';
import vietnamAdministrativeLegacy from '../../data/vietnamAdministrativeLegacy.json';
import { useParams, useNavigate } from 'react-router-dom';
import { addDays, format, parse } from 'date-fns';
import './DetailJD.css';


const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const API_BASE_URL = "http://localhost:8081/identity";
const normalizeSkillName = (value) => String(value || '').trim().toLowerCase();

const trimText = (value) => String(value || '').trim();

const parseBackendDateTimeToInput = (value) => {
    if (!value) return '';
    const text = String(value).trim();
    const parsed = parse(text, 'dd/MM/yyyy HH:mm:ss', new Date());
    if (!Number.isNaN(parsed.getTime())) {
        return format(parsed, 'yyyy-MM-dd');
    }

    const directDate = new Date(text);
    if (!Number.isNaN(directDate.getTime())) {
        return format(directDate, 'yyyy-MM-dd');
    }

    return '';
};

const formatDisplayDate = (value) => {
    const inputDate = parseBackendDateTimeToInput(value);
    if (!inputDate) return '';
    const [year, month, day] = inputDate.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const toBackendDateTimeString = (dateString, isEndDate = false) => {
    if (!dateString) return '';
    const [year, month, day] = String(dateString).split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return '';
    return format(date, `dd/MM/yyyy ${isEndDate ? '23:59:59' : '00:00:00'}`);
};

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
    startDate: trimText(form.startDate),
    endDate: trimText(form.endDate),
    salaryMin: Number(form.salaryMin || 0),
    salaryMax: Number(form.salaryMax || 0),
    skills: normalizeSkillsForCompare(form.skills || [])
});

const hasInvalidLeadingTrailingWhitespace = (value) => {
    if (typeof value !== 'string') return false;
    return value !== value.trim();
};

const isProvinceActive = (province) => {
    const deletedValue = province?.isDeleted ?? province?.is_delete ?? province?.isDelete ?? 0;
    return Number(deletedValue) === 0;
};

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

    const [categories, setCategories] = useState([]);
    const [skillsList, setSkillsList] = useState([]);
    const [skillSearchTerm, setSkillSearchTerm] = useState("");
    const [hasAppliedCandidate, setHasAppliedCandidate] = useState(false);
    const [provinces] = useState(vietnamAdministrativeLegacy);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
    const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
    const [selectedWardCode, setSelectedWardCode] = useState("");
    const [specificAddress, setSpecificAddress] = useState("");
    const [postingDuration, setPostingDuration] = useState(null);

    const fetchJdDetail = useCallback(async () => {
        try {
            const response = await jobService.getDetailJd(id);

            console.debug('DetailJD API response:', response);
            setJdDetail(response?.result ?? response);
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
    }, [id, fetchJdDetail, checkAppliedStatus]);

    useEffect(() => {
        const fetchPostingDuration = async () => {
            const companyId = jdDetail?.company?.id || jdDetail?.company?._id || jdDetail?.companyId || jdDetail?.company?.companyId;
            if (!companyId) return;

            try {
                const response = await subscriptionService.postingDuriation(companyId);
                let duration = response;
                if (response && typeof response === 'object') {
                    duration = response?.data ?? response?.result ?? response?.postingDuriation ?? response?.postingDuration ?? null;
                }
                if (typeof duration === 'string') duration = Number(duration);
                if (typeof duration === 'number' && !Number.isNaN(duration)) {
                    setPostingDuration(duration);
                }
            } catch (error) {
                console.error('Failed to fetch posting duration for DetailJD', error);
            }
        };

        fetchPostingDuration();
    }, [jdDetail?.company?.id, jdDetail?.company?._id, jdDetail?.companyId, jdDetail?.company?.companyId]);

    useEffect(() => {
        const handler = (e) => {
            try {
                const { objId } = e.detail || {};
                if (!objId) return;
                if (String(objId) === String(id)) {
                    fetchJdDetail();
                }
            } catch (err) {
                console.warn('Error handling jdStatusUpdated in DetailJD', err);
            }
        };

        window.addEventListener('jdStatusUpdated', handler);
        return () => window.removeEventListener('jdStatusUpdated', handler);
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

    useEffect(() => {
        if (!isModalOpen || !editForm) return;

        if (!editForm.startDate && jdDetail?.startDate) {
            setEditForm(prev => ({ ...prev, startDate: parseBackendDateTimeToInput(jdDetail.startDate) }));
        }

        if (!editForm.endDate && jdDetail?.endDate) {
            setEditForm(prev => ({ ...prev, endDate: parseBackendDateTimeToInput(jdDetail.endDate) }));
        }

        if (postingDuration && editForm.startDate && !editForm.endDate) {
            setEditForm(prev => ({
                ...prev,
                endDate: format(addDays(new Date(prev.startDate), postingDuration - 1), 'yyyy-MM-dd')
            }));
        }
    }, [isModalOpen, editForm, jdDetail?.startDate, jdDetail?.endDate, postingDuration]);

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
            startDate: parseBackendDateTimeToInput(jdDetail.startDate),
            endDate: parseBackendDateTimeToInput(jdDetail.endDate),
            salaryMin: jdDetail.salaryMin || "",
            salaryMax: jdDetail.salaryMax || "",
            skills: dedupeSkills(mappedSkills)
        };

        const titlesForEdit = cloneTitles(initialTitles);
        const formForEdit = { ...formObj, skills: [...formObj.skills] };

        const locationParts = String(jdDetail.location || '')
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean);

        let provinceCode = '';
        let districtCode = '';
        let wardCode = '';
        let parsedSpecificAddress = '';

        if (locationParts.length > 0) {
            const provinceName = locationParts[locationParts.length - 1];
            const foundProvince = provinces
                .filter(isProvinceActive)
                .find((province) => province.name === provinceName);

            if (foundProvince) {
                provinceCode = String(foundProvince.code);

                const districtName = locationParts[locationParts.length - 2];
                const foundDistrict = foundProvince.districts?.find((district) => district.name === districtName);
                if (foundDistrict) {
                    districtCode = String(foundDistrict.code);

                    const wardName = locationParts[locationParts.length - 3];
                    const foundWard = foundDistrict.wards?.find((ward) => ward.name === wardName);
                    if (foundWard) {
                        wardCode = String(foundWard.code);
                    }
                }

                const parsedPartCount = wardCode ? 3 : districtCode ? 2 : 1;
                parsedSpecificAddress = locationParts
                    .slice(0, Math.max(0, locationParts.length - parsedPartCount))
                    .join(', ');
            } else {
                parsedSpecificAddress = String(jdDetail.location || '');
            }
        }

        setSelectedProvinceCode(provinceCode);
        setSelectedDistrictCode(districtCode);
        setSelectedWardCode(wardCode);
        setSpecificAddress(parsedSpecificAddress);

        setDynamicTitles(titlesForEdit);
        setEditForm(formForEdit);
        setInitialFormState({
            editForm: normalizeFormForCompare(formForEdit),
            dynamicTitles: cloneTitles(titlesForEdit).map(item => ({ key: trimText(item.key), value: trimText(item.value) }))
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditForm(null);
        setInitialFormState(null);
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

        const selectedProvince = provinces.find((province) => String(province.code) === selectedProvinceCode);
        const selectedDistrict = selectedProvince?.districts?.find((district) => String(district.code) === selectedDistrictCode);
        const selectedWard = selectedDistrict?.wards?.find((ward) => String(ward.code) === selectedWardCode);
        const finalLocation = [
            specificAddress.trim(),
            selectedWard?.name,
            selectedDistrict?.name,
            selectedProvince?.name
        ].filter(Boolean).join(', ');

        const textFieldConfig = [
            { key: 'position', label: 'Vị trí công việc' },
            { key: 'description', label: 'Mô tả công việc' }
        ];

        const hasEmptyDynamicTitles = dynamicTitles.some(item => item.key.trim() === "" || item.value.trim() === "");
        if (hasEmptyDynamicTitles) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng điền đầy đủ Tiêu đề và Mô tả", style: toastStyles.warning });
            return;
        }

        if (!selectedProvinceCode || !selectedDistrictCode || !selectedWardCode || !specificAddress.trim()) {
            toast.error("Lỗi nhập liệu", {
                description: "Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện, Xã/Phường và nhập địa chỉ cụ thể",
                style: toastStyles.warning
            });
            return;
        }

        if (!editForm.startDate || !editForm.endDate) {
            toast.error('Lỗi nhập liệu', {
                description: 'Vui lòng chọn ngày bắt đầu và ngày kết thúc',
                style: toastStyles.warning
            });
            return;
        }

        const startDateValue = new Date(editForm.startDate);
        const endDateValue = new Date(editForm.endDate);
        if (Number.isNaN(startDateValue.getTime()) || Number.isNaN(endDateValue.getTime())) {
            toast.error('Lỗi nhập liệu', {
                description: 'Ngày bắt đầu hoặc ngày kết thúc không hợp lệ',
                style: toastStyles.warning
            });
            return;
        }

        if (endDateValue < startDateValue) {
            toast.error('Lỗi nhập liệu', {
                description: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
                style: toastStyles.warning
            });
            return;
        }

        if (postingDuration) {
            const msPerDay = 24 * 60 * 60 * 1000;
            const inclusiveDays = Math.floor((endDateValue - startDateValue) / msPerDay) + 1;
            if (inclusiveDays > postingDuration) {
                toast.error('Lỗi nhập liệu', {
                    description: `Khoảng thời gian đăng tin không thể vượt quá ${postingDuration} ngày`,
                    style: toastStyles.warning
                });
                return;
            }
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
        dynamicTitles.forEach(item => {
            const titleKey = item.key.trim() === "" ? "Mục khác" : item.key.trim();
            titleObject[titleKey] = item.value.trim();
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
            ...editForm,
            categoryId: String(editForm.categoryId || '').trim(),
            position: trimText(editForm.position),
            description: trimText(editForm.description),
            location: finalLocation,
            title: titleObject,
            startDate: toBackendDateTimeString(editForm.startDate),
            endDate: toBackendDateTimeString(editForm.endDate, true),
            skills: dedupedCleanSkills
        };

        setIsUpdating(true);
        try {
            await jobService.updateJd(jdDetail.id, payloadToSubmit);
            toast.info("Đang xử lý", { description: "Hệ thống AI đang duyệt bản cập nhật JD của bạn...", style: toastStyles.warning });
            await fetchJdDetail();
            handleCloseModal();
        } catch (error) {
            toast.error("Lỗi cập nhật", { description: "Không thể lưu thay đổi", style: toastStyles.error });
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredSkillsList = skillsList.filter(skill => {
        const skillName = String(skill.name || skill.skillName || skill.title || "").toLowerCase();
        return skillName.includes(skillSearchTerm.toLowerCase());
    });

    const selectedProvince = provinces.find((province) => String(province.code) === selectedProvinceCode);
    const districtOptions = selectedProvince?.districts || [];
    const selectedDistrict = districtOptions.find((district) => String(district.code) === selectedDistrictCode);
    const wardOptions = selectedDistrict?.wards || [];

    const locationPreview = [
        specificAddress.trim(),
        wardOptions.find((ward) => String(ward.code) === selectedWardCode)?.name,
        selectedDistrict?.name,
        selectedProvince?.name
    ].filter(Boolean).join(', ');

    const compareLocationValue = locationPreview || trimText(editForm?.location);

    const isFormChanged = Boolean(initialFormState) && (() => {
        const normalizedCurrentForm = normalizeFormForCompare({
            ...(editForm || {}),
            location: compareLocationValue
        });
        const normalizedCurrentTitles = cloneTitles(dynamicTitles).map(item => ({ key: trimText(item.key), value: trimText(item.value) }));
        return JSON.stringify(initialFormState.editForm) !== JSON.stringify(normalizedCurrentForm)
            || JSON.stringify(initialFormState.dynamicTitles) !== JSON.stringify(normalizedCurrentTitles);
    })();

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Đang tải dữ liệu...</p></div>;
    if (!jdDetail) return <div className="error-container">Không tìm thấy thông tin JD</div>;

    const statusText = jdDetail.status || "PENDING";
    const getStatusClass = (status) => {
        if (!status) return 'status-pending';
        switch (status.toUpperCase()) {
            case 'NOT_STARTED': return 'status-not-started';
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
            case 'NOT_STARTED': return 'Sắp bắt đầu';
            case 'OPEN': return 'Đang mở';
            case 'CLOSED': return 'Đã đóng';
            case 'LOCK': return 'Đã khóa';
            case 'PENDING': return 'Đang chờ';
            default: return 'Đang chờ';
        }
    };

    return (
        <div className="jd-board-container detail-view-container">


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
                        <Users size={18} />
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
                    <JDInfoCard jdDetail={jdDetail} />
                </div>
            </div>


            {isModalOpen && editForm && (
                <div className="update-jd-full-page">
                    <header className="jd-board-header">
                        <div className="jd-header-copy">
                            <h2>Cập Nhật Mô Tả Công Việc</h2>
                        </div>
                        <div className="header-controls">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="btn-secondary"
                            >
                                Hủy bỏ
                            </button>
                            {isFormChanged && (
                                <button
                                    type="submit"
                                    form="update-jd-form"
                                    disabled={isUpdating}
                                    className="btn-primary-large btn-header-submit"
                                >
                                    {isUpdating ? 'Đang Xử Lý...' : 'Xác Nhận Cập Nhật'}
                                </button>
                            )}
                        </div>
                    </header>

                    <form id="update-jd-form" onSubmit={handleUpdateSubmit} className="jd-board-layout">

                        <div className="layout-main-column">
                            <section className="form-card scroll-card">
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
                            </section>
                        </div>

                        <div className="layout-sidebar">
                            <section className="form-card sidebar-card scroll-card">
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
                                                    {provinces.filter(isProvinceActive).map((province) => (
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
                                                    {districtOptions.map((district) => (
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
                                                    {wardOptions.map((ward) => (
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

                                        {locationPreview && (
                                            <div className="location-preview">
                                                <span>Địa Chỉ Đã Chọn</span>
                                                <strong>{locationPreview}</strong>
                                            </div>
                                        )}

                                        <div className="posting-date-group modal-posting-date-group">
                                            <label className="location-mini-label">Thời Gian Đăng Tin</label>
                                            <div className="posting-date-row">
                                                <div className="input-item">
                                                    <label>Ngày Bắt Đầu</label>
                                                    <input
                                                        type="date"
                                                        name="startDate"
                                                        value={editForm.startDate || ''}
                                                        onChange={handleChange}
                                                        required
                                                        min={format(new Date(), 'yyyy-MM-dd')}
                                                        max={postingDuration && editForm.endDate ? format(addDays(new Date(editForm.endDate), 0), 'yyyy-MM-dd') : undefined}
                                                    />
                                                </div>

                                                <div className="input-item">
                                                    <label>Ngày Kết Thúc</label>
                                                    <input
                                                        type="date"
                                                        name="endDate"
                                                        value={editForm.endDate || ''}
                                                        onChange={handleChange}
                                                        required
                                                        min={editForm.startDate || format(new Date(), 'yyyy-MM-dd')}
                                                        max={postingDuration && editForm.startDate ? format(addDays(new Date(editForm.startDate), postingDuration - 1), 'yyyy-MM-dd') : undefined}
                                                    />
                                                </div>
                                            </div>
                                            {postingDuration && (
                                                <div className="posting-duration-note">
                                                    Gói hiện tại cho phép đăng tối đa <strong>{postingDuration} ngày</strong> kể từ ngày bắt đầu.
                                                </div>
                                            )}
                                        </div>
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
                                                    const skillId = skill.id || skill._id;
                                                    const skillName = skill.name || skill.skillName || skill.title;
                                                    const selectedSkill = editForm.skills.find(s => s.skillId === skillId || (s.name && s.name === normalizeSkillName(skillName)));
                                                    const isSelected = !!selectedSkill;

                                                    return (
                                                        <div key={skillId} className={`compact-skill-item ${isSelected ? 'active' : ''}`}>
                                                            <label className="checkbox-main">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleSkillToggle(skillId, normalizeSkillName(skillName))}
                                                                />
                                                                <span>{skillName}</span>
                                                            </label>

                                                            {isSelected && (
                                                                <label className="checkbox-sub">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedSkill.isRequired}
                                                                        onChange={(e) => handleSkillRequiredToggle(skillId, normalizeSkillName(skillName), e.target.checked)}
                                                                    />
                                                                    Yêu cầu bắt buộc
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

                            </section>
                        </div>
                    </form>

                    <div className="update-jd-overlay" onClick={handleCloseModal}></div>
                </div>
            )}
        </div>
    );
};
export default DetailJD;
