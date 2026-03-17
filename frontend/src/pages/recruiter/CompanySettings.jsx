import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import companyService from '../../services/api/companyService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Building2, ShieldAlert, Info, LogOut } from 'lucide-react';
import './CompanySettings.css';

const CompanySettings = () => {
    const { user, logout, fetchProfile } = useAuth();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    const isDeactivated = user?.companyStatus === 'DEACTIVATED';
    const isAdmin = user?.companyRole === 'ADMIN';

    useEffect(() => {
        if (user?.id) {
            setCompany({
                name: user.companyName,
                taxId: user.companyTaxId || 'Đang cập nhật',
                status: user.companyStatus || 'ACTIVE',
                role: user.companyRole
            });
            setLoading(false);
        }
    }, [user]);


    const handleReactivate = async () => {
        const result = await Swal.fire({
            title: 'Kích hoạt lại công ty?',
            text: 'Tất cả các thành viên sẽ có thể đăng nhập lại và các tin tuyển dụng sẽ được hiển thị (nếu còn hạn).',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Kích hoạt ngay',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                toast.promise(companyService.reactivate(user.companyId), {
                    loading: 'Đang xử lý kích hoạt...',
                    success: () => {
                        fetchProfile(); // Cập nhật lại context để UI đổi trạng thái
                        return "Công ty đã hoạt động trở lại!";
                    },
                    error: (err) => err.response?.data?.message || "Lỗi khi kích hoạt."
                });
            } catch (error) {
                console.error("Reactivation failed", error);
            }
        }
    };

    const handleDeactivate = async () => {
        const { value: confirmCode } = await Swal.fire({
            title: 'Vô hiệu hóa tài khoản công ty?',
            text: 'Tất cả tin tuyển dụng sẽ bị ẩn và các thành viên sẽ bị đăng xuất. Nhập "DEACTIVATE" để xác nhận.',
            input: 'text',
            inputPlaceholder: 'Nhập DEACTIVATE',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Vô hiệu hóa ngay',
            cancelButtonText: 'Hủy',
            inputValidator: (value) => {
                if (value !== 'DEACTIVATE') {
                    return 'Bạn phải nhập đúng mã xác nhận!';
                }
            }
        });

        if (confirmCode === 'DEACTIVATE') {
            try {
                toast.promise(companyService.deactivate(user.companyId, { confirmationCode: 'DEACTIVATE' }), {
                    loading: 'Đang xử lý vô hiệu hóa...',
                    success: () => {
                        setTimeout(async () => {
                            await logout();
                            window.location.href = '/login';
                        }, 2000);
                        return "Công ty đã bị vô hiệu hóa. Đang đăng xuất...";
                    },
                    error: (err) => err.response?.data?.message || "Lỗi khi vô hiệu hóa."
                });
            } catch (error) {
                console.error("Deactivation failed", error);
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;

    return (
        <div className="company-settings-container animate-in">
            <div className="settings-header">
                <Building2 size={24} className="text-primary" />
                <h1>Cài đặt công ty</h1>
            </div>

            <div className="settings-grid">
                {/* General Info Section */}
                <section className="settings-card">
                    <div className="card-header">
                        <Info size={18} />
                        <h3>Thông tin chung</h3>
                    </div>
                    <div className="card-content">
                        <div className="info-field">
                            <label>Tên công ty</label>
                            <input type="text" value={user?.companyName || ''} readOnly className="readonly-input" />
                        </div>
                        <div className="info-field">
                            <label>Mã số thuế</label>
                            <input type="text" value={user?.companyTaxId || ''} readOnly className="readonly-input" />
                        </div>
                        <p className="field-hint">Thông tin định danh không thể tự ý thay đổi. Liên hệ hỗ trợ nếu cần cập nhật.</p>
                    </div>
                </section>

                {/* Danger Zone Section */}
                {isAdmin && (
                    <section className={`settings-card ${isDeactivated ? 'reactivate-zone' : 'danger-zone'}`}>
                        <div className="card-header">
                            <ShieldAlert size={18} />
                            <h3>{isDeactivated ? 'Kích hoạt lại' : 'Vùng nguy hiểm'}</h3>
                        </div>
                        <div className="card-content">
                            <div className="danger-action">
                                <div className="action-info">
                                    <h4>{isDeactivated ? 'Kích hoạt lại tài khoản công ty' : 'Vô hiệu hóa tài khoản công ty'}</h4>
                                    <p>
                                        {isDeactivated
                                            ? 'Khôi phục toàn bộ hoạt động của công ty và cho phép thành viên đăng nhập lại.'
                                            : 'Tạm dừng tất cả hoạt động, ẩn các tin tuyển dụng và ngăn chặn các thành viên đăng nhập.'}
                                    </p>
                                </div>
                                {isDeactivated ? (
                                    <button onClick={handleReactivate} className="btn-success">
                                        <Building2 size={16} />
                                        Kích hoạt lại
                                    </button>
                                ) : (
                                    <button onClick={handleDeactivate} className="btn-danger">
                                        <LogOut size={16} />
                                        Vô hiệu hóa
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default CompanySettings;
