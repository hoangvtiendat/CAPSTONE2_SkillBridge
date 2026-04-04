import React from 'react';
import { Camera } from 'lucide-react';
import Swal from 'sweetalert2';
import './UserCard.css';

export const UserCard = ({ user, isOpenToWork, onToggleOpenToWork }) => {
    const fileInputRef = React.useRef(null);
    const [avatarPreview, setAvatarPreview] = React.useState(null);

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setAvatarPreview(imageUrl);
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
                            src={avatarPreview || user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
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
        </div>
    );
};
