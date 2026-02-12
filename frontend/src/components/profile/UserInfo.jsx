import React, { useState, useEffect } from 'react';
import { Save, Camera, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import './UserInfo.css';

export const UserInfo = ({ user }) => {
    const { updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        bio: '',
        isOpenToWork: false
    });
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                bio: user.bio || '', // Assuming bio is added to backend later, or just placeholder
                isOpenToWork: user.is_open_to_work || false
            });
        }
    }, [user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isDirty) return;

        try {
            await updateUser(formData);
            toast.success('Cập nhật hồ sơ thành công');
            setIsDirty(false);
        } catch (error) {
            toast.error('Cập nhật thất bại. Vui lòng thử lại.');
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
                        <label className="form-label-compact">Địa chỉ</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="form-input-compact"
                        />
                    </div>
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
                        disabled={!isDirty}
                        className={`save-btn-compact ${isDirty ? 'active' : ''}`}
                    >
                        {isDirty ? 'Lưu thay đổi' : 'Đã lưu'}
                    </button>
                </div>
            </form>
        </div>
    );
};
