import React from 'react';
import { Camera } from 'lucide-react';
import './UserCard.css';

export const UserCard = ({ user, isOpenToWork, onToggleOpenToWork }) => {
    return (
        <div className="user-card-container">
            <div className="user-card-header">
                <div className="avatar-wrapper">
                    <div className="profile-avatar">
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
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
