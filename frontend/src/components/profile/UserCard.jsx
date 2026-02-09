import React from 'react';
import { Camera } from 'lucide-react';
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
            // In a real app, you would upload the file here
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
                <p className="user-role-subtitle">Java Developer</p>
            </div>

            <div className="open-to-work-section">
                <div
                    onClick={onToggleOpenToWork}
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
