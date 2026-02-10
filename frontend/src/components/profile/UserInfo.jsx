import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import './UserInfo.css';

export const UserInfo = ({ user }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        area: '',
        bio: '',
        isOpenToWork: false
    });
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '0901234567', // Mock phone
                area: user.area || 'Hà Nội',
                bio: user.bio || 'Lập trình viên...',
                isOpenToWork: user.is_open_to_work || true
            });
        }
    }, [user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isDirty) return;

        // Simulate API call
        setTimeout(() => {
            toast.success('Cập nhật hồ sơ thành công');
            setIsDirty(false);
        }, 800);
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
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="form-input-compact"
                        />
                    </div>
                    <div className="form-group-compact">
                        <label className="form-label-compact">Khu vực</label>
                        <input
                            type="text"
                            value={formData.area}
                            onChange={(e) => handleChange('area', e.target.value)}
                            className="form-input-compact"
                        />
                    </div>
                </div>

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
