import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import companyService from '../../services/api/companyService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Building2, ShieldAlert, Info, LogOut, RotateCcw, Fingerprint, ArrowRight } from 'lucide-react';
import './CompanySettings.css';

const CompanySettings = () => {
    const { user, logout, fetchProfile } = useAuth();
    const [loading, setLoading] = useState(true);

    const isDeactivated = user?.companyStatus === 'DEACTIVATED';
    const isAdmin = user?.companyRole === 'ADMIN';

    useEffect(() => {
        if (user?.id) {
            setLoading(false);
        }
    }, [user]);

    const swalConfig = {
        buttonsStyling: false,
        customClass: {
            popup: 'premium-swal-popup',
            title: 'premium-swal-title',
            htmlContainer: 'premium-swal-text',
            confirmButton: 'premium-swal-confirm-btn',
            cancelButton: 'premium-swal-cancel-btn',
            input: 'premium-swal-input'
        }
    };

    const handleReactivate = async () => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Kích hoạt tài khoản?',
            text: 'Mọi hoạt động tuyển dụng sẽ được khôi phục ngay lập tức.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Kích hoạt ngay',
            cancelButtonText: 'Quay lại',
        });

        if (result.isConfirmed) {
            toast.promise(companyService.reactivate(user.companyId), {
                loading: 'Đang xử lý...',
                success: () => {
                    fetchProfile();
                    return "Công ty đã hoạt động trở lại!";
                },
                error: (err) => err.response?.data?.message || "Lỗi khi kích hoạt."
            });
        }
    };

    const handleDeactivate = async () => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Xác nhận vô hiệu hóa?',
            text: 'Hành động này sẽ tạm dừng mọi quyền truy cập của thành viên.',
            input: 'text',
            inputPlaceholder: 'Nhập DEACTIVATE để xác nhận',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vô hiệu hóa',
            cancelButtonText: 'Hủy',
            customClass: {
                ...swalConfig.customClass,
                confirmButton: 'premium-swal-danger-btn'
            },
            inputValidator: (value) => {
                if (value !== 'DEACTIVATE') return 'Mã xác nhận không khớp!';
            }
        });

        if (result.isConfirmed) {
            toast.promise(companyService.deactivate(user.companyId, { confirmationCode: 'DEACTIVATE' }), {
                loading: 'Đang xử lý...',
                success: () => {
                    setTimeout(async () => {
                        await logout();
                        window.location.href = '/login';
                    }, 2000);
                    return "Đã vô hiệu hóa thành công.";
                },
                error: (err) => err.response?.data?.message || "Lỗi hệ thống."
            });
        }
    };

    if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

    return (
        <div className="settings-wrapper animate-in">
            <header className="main-header">
                <div className="icon-wrapper">
                    <Building2 size={26} strokeWidth={2} />
                </div>
                <div className="title-section">
                    <h1>Cấu hình doanh nghiệp</h1>
                    <p>Quản lý thực thể và quyền kiểm soát hệ thống</p>
                </div>
            </header>

            <div className="settings-layout">
                <section className="glass-card main-info">
                    <div className="card-top">
                        <div className="card-label">
                            <Fingerprint size={18} />
                            <span>Thông tin định danh</span>
                        </div>
                    </div>

                    <div className="input-grid">
                        <div className="input-group">
                            <label>Tên pháp nhân</label>
                            <input type="text" value={user?.companyName || ''} readOnly />
                        </div>
                        <div className="input-group">
                            <label>Mã số thuế</label>
                            <input type="text" value={user?.companyTaxId || '---'} readOnly />
                        </div>
                    </div>

                    <div className="alert-box">
                        <Info size={16} />
                        <p>Dữ liệu được xác thực bởi hệ thống quốc gia. Vui lòng liên hệ CSKH nếu có sai sót.</p>
                    </div>
                </section>

                {isAdmin && (
                    <section className={`glass-card status-zone ${isDeactivated ? 'is-safe' : 'is-danger'}`}>
                        <div className="card-top">
                            <div className="card-label">
                                <ShieldAlert size={18} />
                                <span>Kiểm soát trạng thái</span>
                            </div>
                        </div>

                        <div className="action-row">
                            <div className="action-info">
                                <h3>{isDeactivated ? 'Kích hoạt hoạt động' : 'Tạm dừng hoạt động'}</h3>
                                <p>
                                    {isDeactivated
                                        ? 'Khôi phục toàn bộ quyền hạn và hiển thị bài đăng.'
                                        : 'Vô hiệu hóa quyền truy cập và ẩn tất cả tin tuyển dụng.'}
                                </p>
                            </div>
                            <button
                                onClick={isDeactivated ? handleReactivate : handleDeactivate}
                                className={isDeactivated ? 'btn-safe' : 'btn-danger'}
                            >
                                {isDeactivated ? <RotateCcw size={18} /> : <LogOut size={18} />}
                                <span>{isDeactivated ? 'Kích hoạt' : 'Vô hiệu hóa'}</span>
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default CompanySettings;