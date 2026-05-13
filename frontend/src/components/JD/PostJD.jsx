import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search } from 'lucide-react';

import jobService from '../../services/api/jobService';
import skillService from '../../services/api/skillService';
import categoryJDService from '../../services/api/categoryJD';
import vietnamAdministrativeLegacy from '../../data/vietnamAdministrativeLegacy.json';
import { useAuth } from '../../context/AuthContext';
import subscriptionService from '../../services/api/subscriptionService';
import { addDays, format, parseISO } from 'date-fns';

import './PostJD.css';

const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const isProvinceActive = (province) => {
    const deletedValue = province?.isDeleted ?? province?.is_delete ?? province?.isDelete ?? 0;
    return Number(deletedValue) === 0;
};

const PostJD = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);

    const [categories, setCategories] = useState([]);
    const [skillsList, setSkillsList] = useState([]);
    const [skillSearchTerm, setSkillSearchTerm] = useState("");
    const [provinces] = useState(vietnamAdministrativeLegacy);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
    const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
    const [selectedWardCode, setSelectedWardCode] = useState("");
    const [specificAddress, setSpecificAddress] = useState("");

    const [dynamicTitles, setDynamicTitles] = useState([
        { key: "Yêu cầu", value: "" },
        { key: "Quyền lợi", value: "" }
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

    const [postingDuration, setPostingDuration] = useState(null); // days
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        getListCategories();
    }, []);

    // Fetch posting duration for company (in days)
    useEffect(() => {
        const fetchDuration = async () => {
            if (!user?.companyId) return;
            try {
                const resp = await subscriptionService.postingDuriation(user.companyId, token);
                // service returns response.data; could be a raw number or wrapped object
                let dur = resp;
                if (resp && typeof resp === 'object') {
                    dur = resp?.data ?? resp?.result ?? resp?.postingDuriation ?? resp?.postingDuration ?? null;
                }
                if (typeof dur === 'string') dur = Number(dur);
                if (typeof dur === 'number' && !Number.isNaN(dur)) {
                    setPostingDuration(dur);
                }
            } catch (err) {
                console.error('Failed to fetch posting duration', err);
            }
        };
        fetchDuration();
    }, [user?.companyId, token]);

    useEffect(() => {
        if (!postingDuration) return;

        const today = formatDateForInput(new Date());
        if (!startDate) {
            setStartDate(today);
        }
        if (!endDate) {
            setEndDate(formatDateForInput(addDays(new Date(), postingDuration - 1)));
        }
    }, [postingDuration, startDate, endDate]);

    const formatDateForInput = (d) => {
        try {
            return format(typeof d === 'string' ? parseISO(d) : d, 'yyyy-MM-dd');
        } catch (e) {
            const dt = new Date(d);
            if (isNaN(dt)) return '';
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
    };

    const toBackendDateTimeString = (dateString, isEndDate = false) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return '';
        const dayPart = String(date.getDate()).padStart(2, '0');
        const monthPart = String(date.getMonth() + 1).padStart(2, '0');
        const yearPart = date.getFullYear();
        return `${dayPart}/${monthPart}/${yearPart} ${isEndDate ? '23:59:59' : '00:00:00'}`;
    };

    useEffect(() => {
        if (formData.categoryId) {
            getListSkills(formData.categoryId);
        } else {
            setSkillsList([]);
        }
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
            const errorMessage = error.response?.data?.message || "Đã có lỗi xảy ra khi tải danh sách kỹ năng";
            toast.error("Lỗi khi tải danh sách kỹ năng", { description: errorMessage, style: toastStyles.error });
        }
    };

    const handleCreateJd = async (e) => {
        e.preventDefault();

        const hasEmptyDynamicTitles = dynamicTitles.some(item => item.key.trim() === "" || item.value.trim() === "");
        if (hasEmptyDynamicTitles) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng điền đầy đủ các trường Tiêu đề và Mô tả", style: toastStyles.warning });
            return;
        }

        const stringFields = ["categoryId", "position", "description"];
        const hasEmptyStringFields = stringFields.some(field => !formData[field] || formData[field].trim() === "");
        if (hasEmptyStringFields) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng điền đầy đủ các trường bắt buộc", style: toastStyles.warning });
            return;
        }

        if (!selectedProvinceCode || !selectedDistrictCode || !selectedWardCode || !specificAddress.trim()) {
            toast.error("Lỗi nhập liệu", {
                description: "Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện, Xã/Phường và nhập địa chỉ cụ thể",
                style: toastStyles.warning
            });
            return;
        }

        if (!formData.salaryMin || !formData.salaryMax) {
            toast.error("Lỗi nhập liệu", { description: "Vui lòng điền đầy đủ thông tin lương", style: toastStyles.warning });
            return;
        }

        if (Number(formData.salaryMax) < Number(formData.salaryMin)) {
            toast.error("Lỗi nhập liệu", { description: "Lương tối đa phải lớn hơn hoặc bằng tối thiểu", style: toastStyles.warning });
            return;
        }

        // Validation: Kiểm tra skills không được để trống
        if (!formData.skills || formData.skills.length === 0) {
            toast.error("Lỗi nhập liệu", {
                description: "Vui lòng chọn ít nhất một kỹ năng yêu cầu",
                style: toastStyles.warning
            });
            return;
        }

        // Validate posting date range if postingDuration is available
        if (postingDuration) {
            if (!startDate || !endDate) {
                toast.error("Lỗi nhập liệu", { description: `Vui lòng chọn ngày bắt đầu và kết thúc trong phạm vi ${postingDuration} ngày`, style: toastStyles.warning });
                return;
            }
            const s = new Date(startDate);
            const eDate = new Date(endDate);
            if (eDate < s) {
                toast.error("Lỗi nhập liệu", { description: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu", style: toastStyles.warning });
                return;
            }
            const msPerDay = 24 * 60 * 60 * 1000;
            const inclusiveDays = Math.floor((eDate - s) / msPerDay) + 1;
            if (inclusiveDays > postingDuration) {
                toast.error("Lỗi nhập liệu", { description: `Khoảng thời gian đăng tin không thể vượt quá ${postingDuration} ngày`, style: toastStyles.warning });
                return;
            }
        }

        const titleObject = {};
        dynamicTitles.forEach(item => {
            const finalKey = item.key.trim() === "" ? "Mục khác" : item.key.trim();
            titleObject[finalKey] = item.value;
        });

        const selectedProvince = provinces.find((province) => String(province.code) === selectedProvinceCode);
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

        const payloadToSubmit = {
            ...formData,
            location: finalLocation,
            title: titleObject,
            startDate: toBackendDateTimeString(startDate),
            endDate: toBackendDateTimeString(endDate, true)
        };

        setLoading(true);
        try {
            await jobService.createJd(payloadToSubmit);
            toast.success("Thành công", { description: "Tạo JD thành công!", style: toastStyles.success });
            navigate('/company/jd-list');
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Đã có lỗi xảy ra khi tạo JD";
            toast.error("Lỗi khi tạo JD", { description: errorMessage, style: toastStyles.error });
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

    const handleStartDateChange = (value) => {
        setStartDate(value);
        if (postingDuration && value) {
            try {
                const max = formatDateForInput(addDays(parseISO(value), postingDuration - 1));
                if (!endDate || new Date(endDate) > new Date(max)) {
                    setEndDate(max);
                }
            } catch (e) {
                // ignore
            }
        }
    };

    const handleEndDateChange = (value) => {
        setEndDate(value);
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

   return (
        <div className="jd-board-container">

            <header className="jd-board-header">
                <div className="jd-header-copy">
                    <h2>Tạo Bài Tuyển Dụng Mới</h2>
                 
                </div>

                <button
                    type="submit"
                    form="post-jd-form"
                    disabled={loading}
                    className="btn-primary-large btn-header-submit"
                >
                    {loading ? 'Đang Xử Lý...' : 'Xác Nhận Tạo JD'}
                </button>
            </header>

            <form id="post-jd-form" onSubmit={handleCreateJd} className="jd-board-layout">
                
                <div className="layout-main-column">
                    <section className="form-card scroll-card">
                        <h3 className="card-title">Thông Tin Cơ Bản</h3>
                        <div className="input-group-grid">
                            <div className="input-item">
                                <label>Vị Trí Công Việc</label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    required
                                    placeholder="VD: Nhân viên Marketing..."
                                />
                            </div>
                            <div className="input-item">
                                <label>Danh Mục Kỹ Năng</label>
                                <select
                                    className="category-select"
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

                        <div className="card-section-divider" />

                        <h3 className="card-title">Chi Tiết Công Việc</h3>
                        <div className="input-item full-width">
                            <label>Mô tả công việc</label>
                            <textarea
                                name="description"
                                value={formData.description}
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

                                {/* Posting date range selectors (constrained by subscription postingDuration) */}
                                <div className="posting-date-group">
                                    <label className="location-mini-label">Thời Gian Đăng Tin</label>
                                    <div className="posting-date-row">
                                        <div className="input-item">
                                            <label>Ngày Bắt Đầu</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => handleStartDateChange(e.target.value)}
                                                min={formatDateForInput(new Date())}
                                            />
                                        </div>

                                        <div className="input-item">
                                            <label>Ngày Kết Thúc</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => handleEndDateChange(e.target.value)}
                                                min={startDate || formatDateForInput(new Date())}
                                                max={startDate && postingDuration ? formatDateForInput(addDays(parseISO(startDate), postingDuration - 1)) : undefined}
                                            />
                                        </div>
                                       {postingDuration && (
                                                <div className="posting-duration-note">
                                                    Gói hiện tại cho phép đăng tối đa <strong>{postingDuration} ngày</strong> kể từ ngày bắt đầu.
                                                </div>
                                            )}
                                    </div>
                                  
                                </div>
                            </div>
                        </div>

                        <div className="salary-group">
                            <div className="input-item">
                                <label>Lương Tối Thiểu</label>
                                <input
                                    type="text"
                                    name="salaryMin"
                                    value={formData.salaryMin ? Number(formData.salaryMin).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\./g, '').replace(/[^\d]/g, '');
                                        const numValue = rawValue ? Number(rawValue) : '';
                                        setFormData(prev => ({ ...prev, salaryMin: numValue }));
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
                                    value={formData.salaryMax ? Number(formData.salaryMax).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\./g, '').replace(/[^\d]/g, '');
                                        const numValue = rawValue ? Number(rawValue) : '';
                                        setFormData(prev => ({ ...prev, salaryMax: numValue }));
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
                            ) : formData.categoryId ? (
                                <p className="empty-text">Đang tải danh sách kỹ năng...</p>
                            ) : (
                                <p className="empty-text">Vui lòng chọn danh mục để xem kỹ năng</p>
                            )}
                        </div>

                    </section>
                </div>
            </form>
        </div>
    );
};

export default PostJD;