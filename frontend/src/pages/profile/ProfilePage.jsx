import React, { useEffect, useState } from 'react';
import { UserInfo } from '../../components/profile/UserInfo';
import { UserCard } from '../../components/profile/UserCard';
import { CVParser } from '../../components/cv/CVParser';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, ChevronRight, ArrowLeft } from 'lucide-react';
import authService from '../../services/api/authService';
import candidateService from '../../services/api/candidateService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import './ProfilePage.css';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';

const ProfilePage = () => {
    const { user, fetchProfile } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('profile');
    const [isOpenToWork, setIsOpenToWork] = useState(false)
    const [isToggling2FA, setIsToggling2FA] = useState(false);
    const [is2faEnabledLocal, setIs2faEnabledLocal] = useState(
            user?.is2faEnabled === "true" || user?.is2faEnabled === "1"
        );
    const [isChangePassOpen, setIsChangePassOpen] = useState(false);
    const fetchCandidateStatus = async () => {
        if (!user?.id) return;
        try {
            const response = await candidateService.getCv(user.id);
            const status = response?.result ? !!response.result.isOpenToWork : !!response.isOpenToWork;
            setIsOpenToWork(status);
        } catch (error) {
            console.error("Lỗi lấy trạng thái Candidate:", error);
            setIsOpenToWork(false); // Lỗi thì mặc định tắt
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchCandidateStatus();
        }
    }, [user?.id]);
    useEffect(() => {
        const isEnabled = user?.is2faEnabled === "true" || user?.is2faEnabled === "1";
    }, [user?.is2faEnabled]);

    useEffect(() => {
        if (!user) {
            // navigate('/login');
        }
    }, [user, navigate]);

    const handleToggleOpenToWork = async () => {
        const newValue = !isOpenToWork;
        try {
            setIsOpenToWork(newValue);
            await candidateService.toggleOpenToWork(newValue);

            toast.success(`Đã ${newValue ? 'bật' : 'tắt'} trạng thái tìm việc`);
            Swal.fire({
                title: 'Thành công!',
                text: `Đã cập nhật trạng thái tìm việc.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái:", error);
            setIsOpenToWork(!newValue);
            toast.error("Không thể cập nhật trạng thái tìm việc");
        }
    };

    const handleToggle2FA = async (e) => {
        const newValue = e.target.checked;

        const result = await Swal.fire({
            title: newValue ? 'Bật xác thực 2 bước?' : 'Tắt xác thực 2 bước?',
            text: newValue ? "Tài khoản sẽ an toàn hơn." : "Bảo mật sẽ giảm đi.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) {
            setIs2faEnabledLocal(!newValue);
            return;
        }

        setIsToggling2FA(true);
        try {
            await authService.toggleTwoFactor(newValue);

            setIs2faEnabledLocal(newValue);
            toast.success("Cập nhật bảo mật thành công!");
            if (fetchProfile) await fetchProfile();
        } catch (error) {
            console.error("Lỗi 2FA:", error);
            setIs2faEnabledLocal(!newValue);
            toast.error("Không thể cập nhật bảo mật. Vui lòng thử lại.");
        } finally {
            setIsToggling2FA(false);
        }
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
                                    onAvatarUpdate={fetchProfile}
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
                                                onChange={handleToggle2FA}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <button
                                        className="security-action-btn"
                                        onClick={() => setIsChangePassOpen(true)}
                                    >
                                        <KeyRound size={16} />
                                        Đổi mật khẩu
                                    </button>

                                    {/* 3. Chèn Modal vào cuối Component */}
                                    <ChangePasswordModal
                                        isOpen={isChangePassOpen}
                                        onClose={() => setIsChangePassOpen(false)}
                                    />
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
