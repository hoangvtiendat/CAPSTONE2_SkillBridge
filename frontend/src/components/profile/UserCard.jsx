import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import Swal from 'sweetalert2';
import './UserCard.css';
import { toast } from 'sonner';
import authService from '../../services/api/authService';
import { API_BASE_URL } from '../../config/appConfig';

const DEFAULT_AVATAR = `${API_BASE_URL}/avatars/default.jpg`;
export const UserCard = ({ user, isOpenToWork, onToggleOpenToWork, onAvatarUpdate }) => {
    const fileInputRef = React.useRef(null);
    const [avatarPreview, setAvatarPreview] = React.useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setAvatarPreview(null);
    }, [user?.avatar]);

    const getImageUrl = (path) => {
        if (!path || path === "" || path === "null") return DEFAULT_AVATAR;
        if (path.startsWith('http')) return path;

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        return `${baseUrl}${cleanPath}`;
    };
    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Vui lòng chọn tệp hình ảnh!");
            return;
        }

        const localUrl = URL.createObjectURL(file);
        setAvatarPreview(localUrl);

        setIsUploading(true);
        try {
            const response = await authService.updateAvatar(file);
            toast.success("Cập nhật ảnh đại diện thành công!");
            if (onAvatarUpdate) {
                await onAvatarUpdate();
            }
        } catch (error) {
            console.error("Lỗi upload avatar:", error);
            toast.error("Không thể tải ảnh lên server");
            setAvatarPreview(null);
        } finally {
            setIsUploading(false);
            event.target.value = null;
        }
    };

    return (
        <div className="user-card-container">
            <div className="user-card-header">
                <div className="avatar-wrapper" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                    <div className="profile-avatar">
                        <img
                            src={avatarPreview || getImageUrl(user?.avatar) || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                            alt="Avatar"
                            className="avatar-image"
                        />
                    </div>
                    <button className="change-avatar-btn">
                        <Camera size={14} />
                    </button>
                </div>

                <h2 className="user-name-title">{user?.name || 'Nguyễn Văn A'}</h2>
                <p className="user-role-subtitle">
                    {user?.role === 'CANDIDATE' ? 'Ứng viên' :
                        user?.role === 'RECRUITER' ? 'Nhà tuyển dụng' :
                            user?.role === 'ADMIN' ? 'Quản trị viên' :
                                user?.role || 'Người dùng'}
                </p>
            </div>

            {user?.role === 'CANDIDATE' && (
                <div className="open-to-work-section">
                    <div
                        onClick={async () => {
                            const newValue = !isOpenToWork;
                            const result = await Swal.fire({
                                title: newValue ? 'Bật trạng thái tìm việc?' : 'Tắt trạng thái tìm việc?',
                                text: newValue
                                    ? "Hệ thống sẽ ưu tiên hiển thị hồ sơ của bạn cho các nhà tuyển dụng."
                                    : "Bạn sẽ tạm thời không xuất hiện trong danh sách tìm kiếm của nhà tuyển dụng.",
                                icon: 'info',
                                showCancelButton: true,
                                confirmButtonColor: '#667eea',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Xác nhận',
                                cancelButtonText: 'Hủy'
                            });

                            if (result.isConfirmed) {
                                onToggleOpenToWork();
                            }
                        }}
                        className={`open-to-work-toggle ${isOpenToWork ? 'active' : 'inactive'}`}
                    >
                        <div className="toggle-label">
                            OPEN TO WORK
                            <span className="toggle-sublabel">
                                {isOpenToWork ? 'Đang tìm kiếm việc làm' : 'Tắt trạng thái tìm việc'}
                            </span>
                        </div>
                        <div className="toggle-switch">
                            <div className="toggle-switch-dot" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
