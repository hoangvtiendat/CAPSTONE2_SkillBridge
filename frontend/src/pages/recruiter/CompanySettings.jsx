import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import companyService from '../../services/api/companyService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Building2, ShieldAlert, Info, LogOut, RotateCcw } from 'lucide-react';
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

    // Cấu hình chung cho SweetAlert2 phong cách Liquid Glass
    const swalConfig = {
        buttonsStyling: false,
        customClass: {
            popup: 'liquid-swal-popup',
            title: 'liquid-swal-title',
            htmlContainer: 'liquid-swal-text',
            confirmButton: 'liquid-swal-confirm-btn',
            cancelButton: 'liquid-swal-cancel-btn',
            input: 'liquid-swal-input'
        }
    };

    const handleReactivate = async () => {
        const result = await Swal.fire({
            ...swalConfig,
            title: 'Kích hoạt lại công ty?',
            text: 'Thành viên có thể đăng nhập lại và các tin tuyển dụng sẽ hiển thị trở lại.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Kích hoạt ngay',
            cancelButtonText: 'Hủy bỏ',
        });

        if (result.isConfirmed) {
            toast.promise(companyService.reactivate(user.companyId), {
                loading: 'Đang xử lý kích hoạt...',
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
            title: 'Vô hiệu hóa công ty?',
            text: 'Nhập "DEACTIVATE" để xác nhận việc ẩn toàn bộ tin đăng và đăng xuất thành viên.',
            input: 'text',
            inputPlaceholder: 'Nhập DEACTIVATE',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận vô hiệu hóa',
            cancelButtonText: 'Hủy',
            customClass: {
                ...swalConfig.customClass,
                confirmButton: 'liquid-swal-danger-btn' // Dùng nút đỏ cho hành động nguy hiểm
            },
            inputValidator: (value) => {
                if (value !== 'DEACTIVATE') {
                    return 'Bạn phải nhập chính xác mã xác nhận!';
                }
            }
        });

        if (result.isConfirmed) {
            toast.promise(companyService.deactivate(user.companyId, { confirmationCode: 'DEACTIVATE' }), {
                loading: 'Đang xử lý vô hiệu hóa...',
                success: () => {
                    setTimeout(async () => {
                        await logout();
                        window.location.href = '/login';
                    }, 2000);
                    return "Đã vô hiệu hóa. Đang đăng xuất...";
                },
                error: (err) => err.response?.data?.message || "Lỗi khi vô hiệu hóa."
            });
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải cấu hình...</p>
            </div>
        );
    }

    return (
        <div className="company-settings-container animate-in">
            <header className="settings-header">
                <div className="header-icon-box">
                    <Building2 size={24} />
                </div>
                <div className="header-text">
                    <h1>Cài đặt thực thể</h1>
                    <p>Quản lý trạng thái hoạt động và thông tin định danh doanh nghiệp</p>
                </div>
            </header>

            <div className="settings-grid">
                {/* General Info Section */}
                <section className="settings-card">
                    <div className="card-header">
                        <Info size={18} />
                        <h3>Thông tin định danh</h3>
                    </div>
                    <div className="card-body">
                        <div className="info-field">
                            <label>Tên pháp nhân</label>
                            <input type="text" value={user?.companyName || ''} readOnly className="readonly-input" />
                        </div>
                        <div className="info-field">
                            <label>Mã số thuế (MST)</label>
                            <input type="text" value={user?.companyTaxId || 'Chưa cập nhật'} readOnly className="readonly-input" />
                        </div>
                        <div className="field-hint-box">
                            <ShieldAlert size={14} />
                            <span>Thông tin này được đồng bộ từ dữ liệu quốc gia và không thể tự thay đổi.</span>
                        </div>
                    </div>
                </section>

                {/* Status Control Section */}
                {isAdmin && (
                    <section className={`settings-card ${isDeactivated ? 'status-reactivate' : 'status-danger'}`}>
                        <div className="card-header">
                            <ShieldAlert size={18} />
                            <h3>{isDeactivated ? 'Khôi phục hoạt động' : 'Quản lý trạng thái'}</h3>
                        </div>
                        <div className="card-body">
                            <div className="status-action-box">
                                <div className="action-text">
                                    <h4>{isDeactivated ? 'Kích hoạt lại tài khoản' : 'Tạm dừng hoạt động'}</h4>
                                    <p>
                                        {isDeactivated
                                            ? 'Khôi phục quyền truy cập cho nhân viên và hiển thị lại các tin tuyển dụng.'
                                            : 'Vô hiệu hóa quyền truy cập, ẩn tin tuyển dụng và đăng xuất toàn bộ nhân viên.'}
                                    </p>
                                </div>
                                <div className="action-button-wrapper">
                                    {isDeactivated ? (
                                        <button onClick={handleReactivate} className="btn-success-pill">
                                            <RotateCcw size={18} />
                                            Kích hoạt lại
                                        </button>
                                    ) : (
                                        <button onClick={handleDeactivate} className="btn-danger-pill">
                                            <LogOut size={18} />
                                            Vô hiệu hóa
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default CompanySettings;