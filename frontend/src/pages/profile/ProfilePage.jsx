import React, { useEffect, useState } from 'react';
import { UserInfo } from '../../components/profile/UserInfo';
import { UserCard } from '../../components/profile/UserCard';
import { CVParser } from '../../components/cv/CVParser';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, ChevronRight, ArrowLeft } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('profile');
    const [isOpenToWork, setIsOpenToWork] = useState(true);

    useEffect(() => {
        if (!user) {
            // navigate('/login');
        }
    }, [user, navigate]);

    const handleToggleOpenToWork = () => {
        setIsOpenToWork(prev => !prev);
    };

    return (
        <div className="profile-page-root">
            <div className="profile-page-container">

                {viewMode === 'profile' ? (
                    <div className="profile-view profile-animate-left">
                        <h1 className="profile-page-title">
                            Quản lý hồ sơ cá nhân
                        </h1>

                        <div className="profile-layout-grid">
                            {/* LEFT */}
                            <aside className="profile-sidebar">
                                <UserCard
                                    user={user}
                                    isOpenToWork={isOpenToWork}
                                    onToggleOpenToWork={handleToggleOpenToWork}
                                />

                                <div className="security-box">
                                    <h3 className="security-box-title">
                                        <Shield size={16} />
                                        Bảo mật
                                    </h3>

                                    <div className="security-item">
                                        <div className="security-info">
                                            <span className="security-icon">
                                                <Shield size={14} />
                                            </span>
                                            <span className="security-text">
                                                Xác thực 2 bước (2FA)
                                            </span>
                                        </div>

                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={user?.two_fa_enabled}
                                                readOnly
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <button className="security-action-btn">
                                        <KeyRound size={16} />
                                        Đổi mật khẩu
                                    </button>
                                </div>
                            </aside>

                            {/* RIGHT */}
                            <main className="profile-main">
                                <UserInfo user={user} />
                            </main>
                        </div>

                        <div className="profile-footer-nav">
                            <button
                                className="profile-cv-btn"
                                onClick={() => setViewMode('cv')}
                            >
                                CV của bạn
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="profile-view profile-animate-right">
                        <button
                            className="back-to-profile-btn"
                            onClick={() => setViewMode('profile')}
                        >
                            <ArrowLeft size={16} />
                            Quay lại Hồ sơ cá nhân
                        </button>

                        <CVParser />
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProfilePage;
