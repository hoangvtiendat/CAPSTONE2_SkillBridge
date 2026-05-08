import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import vietnamAdministrativeLegacy from '../../data/vietnamAdministrativeLegacy.json';
import './UserInfo.css';

const isProvinceActive = (province) => {
    const deletedValue = province?.isDeleted ?? province?.is_delete ?? province?.isDelete ?? 0;
    return Number(deletedValue) === 0;
};

export const UserInfo = ({ user }) => {
    const { updateUser } = useAuth();
    const [provinces] = useState(vietnamAdministrativeLegacy);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
    const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        bio: '',
        isOpenToWork: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                bio: user.bio || '',
                isOpenToWork: user.is_open_to_work || false
            });

            // Parse address thành province và district
            const locationParts = String(user.address || '')
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean);

            if (locationParts.length > 0) {
                const provinceName = locationParts[locationParts.length - 1];
                const foundProvince = provinces
                    .filter(isProvinceActive)
                    .find((province) => province.name === provinceName);

                if (foundProvince) {
                    setSelectedProvinceCode(String(foundProvince.code));

                    const districtName = locationParts[locationParts.length - 2];
                    const foundDistrict = foundProvince.districts?.find((district) => district.name === districtName);
                    if (foundDistrict) {
                        setSelectedDistrictCode(String(foundDistrict.code));
                    }
                }
            }
        }
    }, [user, provinces]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isDirty || isSubmitting) return;

        // Validate location
        if (!selectedProvinceCode || !selectedDistrictCode) {
            toast.error('Vui lòng chọn Tỉnh/Thành phố và Quận/Huyện');
            return;
        }

        const selectedProvince = provinces.find((province) => String(province.code) === selectedProvinceCode);
        const selectedDistrict = selectedProvince?.districts?.find((district) => String(district.code) === selectedDistrictCode);
        
        const finalAddress = [
            selectedDistrict?.name,
            selectedProvince?.name
        ].filter(Boolean).join(', ');

        const result = await Swal.fire({
            title: 'Xác nhận thay đổi?',
            text: "Bạn có chắc chắn muốn cập nhật thông tin cá nhân của mình?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Lưu ngay',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            await updateUser({...formData, address: finalAddress});
            toast.success('Cập nhật hồ sơ thành công');
            setIsDirty(false);
        } catch (error) {
            toast.error('Cập nhật thất bại. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="user-info-form-container">
            <h3 className="form-title">Thông tin cơ bản</h3>

            <form onSubmit={handleSubmit} className="form-grid-compact">
                <div className="row-2-col">
                    <div className="form-group-compact">
                        <label className="form-label-compact">Họ và tên</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="form-input-compact"
                        />
                    </div>
                    <div className="form-group-compact">
                        <label className="form-label-compact">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="form-input-compact bg-gray-50"
                        />
                    </div>
                </div>

                <div className="row-2-col">
                    <div className="form-group-compact">
                        <label className="form-label-compact">Số điện thoại</label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => handleChange('phoneNumber', e.target.value)}
                            className="form-input-compact"
                        />
                    </div>
                    <div className="form-group-compact">
                        <label className="form-label-compact">Tỉnh/Thành phố</label>
                        <select
                            value={selectedProvinceCode}
                            onChange={(e) => {
                                setSelectedProvinceCode(e.target.value);
                                setSelectedDistrictCode("");
                                setIsDirty(true);
                            }}
                            className="form-input-compact"
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
                </div>

                <div className="row-2-col">
                    <div className="form-group-compact">
                        <label className="form-label-compact">Quận/Huyện</label>
                        <select
                            value={selectedDistrictCode}
                            onChange={(e) => {
                                setSelectedDistrictCode(e.target.value);
                                setIsDirty(true);
                            }}
                            className="form-input-compact"
                            disabled={!selectedProvinceCode}
                            required
                        >
                            <option value="">-- Chọn quận/huyện --</option>
                            {selectedProvinceCode && provinces
                                .find((p) => String(p.code) === selectedProvinceCode)
                                ?.districts?.map((district) => (
                                    <option key={district.code} value={district.code}>
                                        {district.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div></div>
                </div>

                {/* Bio field - kept as UI element even if not in current backend response yet, 
                    can be mapped if backend adds it or removed if strictly following API result */}
                {/* 
                <div className="form-group-compact full-width">
                    <label className="form-label-compact">Giới thiệu bản thân</label>
                    <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="form-textarea-compact"
                        placeholder="Mô tả kinh nghiệm và kỹ năng của bạn..."
                    />
                </div>
                */}

                <div className="full-width flex justify-end mt-4">
                    <button
                        type="submit"
                        disabled={!isDirty || isSubmitting}
                        className={`save-btn-compact ${isDirty ? 'active' : ''} ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isSubmitting ? 'Đang lưu...' : (isDirty ? 'Lưu thay đổi' : 'Đã lưu')}
                    </button>
                </div>
            </form>
        </div>
    );
};
