import React, { useEffect, useState } from 'react';
import { UserInfo } from '../../components/profile/UserInfo';
import { UserCard } from '../../components/profile/UserCard';
import { CVParser } from '../../components/cv/CVParser';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, ChevronRight, ArrowLeft } from 'lucide-react';
import authService from '../../services/api/authService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, fetchProfile } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('profile');
    const [isOpenToWork, setIsOpenToWork] = useState(true);
    const [isToggling2FA, setIsToggling2FA] = useState(false);
    const [is2faEnabledLocal, setIs2faEnabledLocal] = useState(user?.is2faEnabled || false);

    useEffect(() => {
        setIs2faEnabledLocal(user?.is2faEnabled || false);
    }, [user?.is2faEnabled]);

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

                                        <label className={`toggle-switch ${isToggling2FA ? 'opacity-50 cursor-wait' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={is2faEnabledLocal}
                                                disabled={isToggling2FA}
                                                onChange={async (e) => {
                                                    if (isToggling2FA) return;
                                                    const newValue = e.target.checked;

                                                    // Visual feedback immediately
                                                    setIs2faEnabledLocal(newValue);

                                                    const result = await Swal.fire({
                                                        title: newValue ? 'Bật xác thực 2 bước?' : 'Tắt xác thực 2 bước?',
                                                        text: newValue
                                                            ? "Tài khoản của bạn sẽ an toàn hơn với xác thực 2 lớp."
                                                            : "Bảo mật tài khoản sẽ giảm đi nếu bạn tắt tính năng này.",
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#667eea',
                                                        cancelButtonColor: '#d33',
                                                        confirmButtonText: 'Đồng ý',
                                                        cancelButtonText: 'Hủy',
                                                        background: '#ffffff',
                                                        borderRadius: '16px'
                                                    });

                                                    if (!result.isConfirmed) {
                                                        // Revert if cancelled
                                                        setIs2faEnabledLocal(!newValue);
                                                        return;
                                                    }

                                                    setIsToggling2FA(true);
                                                    try {
                                                        await authService.toggleTwoFactor(newValue);
                                                        toast.success(newValue ? "Đã bật xác thực 2 bước" : "Đã tắt xác thực 2 bước");
                                                        if (typeof fetchProfile === 'function') {
                                                            await fetchProfile();
                                                        }
                                                    } catch (error) {
                                                        console.error("Toggle 2FA failed", error);
                                                        toast.error("Không thể thay đổi trạng thái 2FA");
                                                        // Revert on error
                                                        setIs2faEnabledLocal(!newValue);
                                                    } finally {
                                                        setIsToggling2FA(false);
                                                    }
                                                }}
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
                    </div>
                ) : (
                    <div className="profile-view profile-animate-right">
                        <CVParser />
                    </div>
                )}

                {/* Fixed Back Button for CV Mode */}
                {viewMode === 'cv' && (
                    <button
                        className="back-to-profile-btn"
                        onClick={() => setViewMode('profile')}
                    >
                        <ArrowLeft size={16} />
                        Quay lại Hồ sơ cá nhân
                    </button>
                )}

                {/* MOVED OUTSIDE of .profile-view to ensure position:fixed works relative to viewport, not transformed container */}
                {viewMode === 'profile' && (
                    <div className="profile-footer-nav">
                        <button
                            className="profile-cv-btn"
                            onClick={() => setViewMode('cv')}
                        >
                            CV của bạn
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProfilePage;
