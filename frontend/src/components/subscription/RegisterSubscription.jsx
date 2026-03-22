import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import subscriptionService from '../../services/api/subscriptionService';
import { toast, Toaster } from 'sonner';
import { Check, ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './SubscriptionManager.css';

const RegisterSubscription = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { token } = useAuth();

    const subscriptionType = searchParams.get('type') || 'custom';

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [customForm, setCustomForm] = useState({
        jobLimit: '',
        candidateViewLimit: '',
        hasPriorityDisplay: false
    });

    const postPayment = async (id, type) => {
        try {
            setLoading(true);
            const res = await subscriptionService.postPayment(id, token, type);
            const orderURL = res?.checkoutUrl || res?.result?.checkoutUrl || res?.data?.checkoutUrl;

            if (!orderURL) {
                throw new Error('Không nhận được liên kết thanh toán từ hệ thống');
            }

            sessionStorage.setItem('pendingPayment', id);
            window.location.href = orderURL;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Lỗi khi tạo đơn thanh toán';
            toast.error("Lỗi thanh toán", { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subscriptionType === 'system') {
            fetchSubscriptions();
        }
    }, [subscriptionType]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const response = await subscriptionService.getlistSubscription();
            const data = response?.result || response?.data || response || [];
            const sortedData = Array.isArray(data) ? data.sort((a, b) => a.price - b.price) : [];
            setSubscriptions(sortedData);
        } catch (error) {
            toast.error("Lỗi tải dữ liệu", { description: "Không thể lấy danh sách gói cước hệ thống" });
        } finally {
            setLoading(false);
        }
    };

    const handleCustomFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCustomForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (value === '' ? '' : Number(value))
        }));
    };

    const handleSubmitCustomPackage = async (e) => {
        e.preventDefault();

        if (!customForm.jobLimit || customForm.jobLimit <= 0) return toast.warning('Số lượng tin đăng không hợp lệ');
        if (!customForm.candidateViewLimit || customForm.candidateViewLimit <= 0) return toast.warning('Số lượt xem CV không hợp lệ');

        setSubmitting(true);
        try {
            const data = {
                jobLimit: Number(customForm.jobLimit),
                candidateViewLimit: Number(customForm.candidateViewLimit),
                hasPriorityDisplay: customForm.hasPriorityDisplay
            };

            await subscriptionService.createSubscriptionOfCompany(data, token);
            toast.success('Tạo gói thành công!', { description: 'Đang chuyển hướng về trang quản lý...' });

            setTimeout(() => navigate('/company/subscriptions'), 1500);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Không thể tạo gói đăng ký';
            toast.error('Lỗi tạo gói', { description: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    const getThemeClass = (planName) => {
        const name = planName?.toUpperCase() || '';
        if (name.includes('PREMIUM')) return 'theme-premium';
        if (name.includes('STANDARD')) return 'theme-standard';
        return 'theme-free';
    };

    return (
        <div className="subscription-admin-manager">
            <Toaster position="top-right" richColors />

            <div className="">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Quay lại
                </button>
            </div>

            {loading && <div className="loading-spinner">Đang tải dữ liệu lỏng...</div>}

            {/* HIỂN THỊ GÓI HỆ THỐNG */}
            {!loading && subscriptionType === 'system' && (
                <div className="admin-plans-grid">
                    {subscriptions.map((sub) => {
                        const themeClass = getThemeClass(sub.name);
                        return (
                            <div key={sub.id} className={`admin-plan-card ${themeClass}`}>
                                <div className="plan-header">
                                    <h2 className="plan-name">{sub.name}</h2>
                                    <div className="plan-price-box">
                                        <span className="price-value">
                                            {sub.price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(sub.price)}
                                        </span>
                                        {sub.price > 0 && <span className="price-unit">₫/tháng</span>}
                                    </div>
                                </div>

                                <div className="plan-body">
                                    <ul className="plan-features">
                                        <li><Check className="check-icon" size={18} /> <span><strong>{sub.jobLimit}</strong> Tin đăng / tháng</span></li>
                                        <li><Check className="check-icon" size={18} /> <span><strong>{sub.candidateViewLimit}</strong> Lượt xem hồ sơ</span></li>
                                        <li><Check className="check-icon" size={18} /> <span>Thời hạn: <strong>{sub.postingDuration || '30'} ngày</strong></span></li>
                                        <li><Check className="check-icon" size={18} /> <span>Duyệt ưu tiên: {sub.hasPriorityDisplay ? 'Có' : 'Không'}</span></li>
                                    </ul>
                                </div>

                                <div className="plan-footer">
                                    {sub.price > 0 ? (
                                        <button className="btn-edit-plan" onClick={() => postPayment(sub.id, 0)}>
                                            <ShoppingCart size={16} /> Chọn gói này
                                        </button>
                                    ) : (
                                        <div className="free-badge-glass">
                                            <Check size={16} /> Gói miễn phí
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* HIỂN THỊ FORM TÙY CHỈNH */}
            {!loading && subscriptionType === 'custom' && (
                <div className="custom-register-container">
                    <div className="custom-form-header">
                        <ShoppingCart size={56} style={{ color: 'var(--sf-blue)' }} />
                        <h2>Thiết lập gói cước riêng</h2>
                        <p>Tùy chỉnh các giới hạn để phù hợp với quy mô tuyển dụng</p>
                    </div>

                    <form onSubmit={handleSubmitCustomPackage}>
                        <div className="glass-input-group">
                            <label>Số lượng tin đăng / tháng *</label>
                            <input
                                type="number"
                                name="jobLimit"
                                value={customForm.jobLimit}
                                onChange={handleCustomFormChange}
                                min="1"
                                required
                                placeholder="Ví dụ: 10"
                            />
                            <small>Hệ thống cấp quyền đăng tin dựa trên con số này.</small>
                        </div>

                        <div className="glass-input-group">
                            <label>Lượt xem hồ sơ ứng viên *</label>
                            <input
                                type="number"
                                name="candidateViewLimit"
                                value={customForm.candidateViewLimit}
                                onChange={handleCustomFormChange}
                                min="1"
                                required
                                placeholder="Ví dụ: 50"
                            />
                            <small>Số lượng CV chi tiết bạn có thể mở khóa mỗi tháng.</small>
                        </div>

                        <label className="priority-feature-panel">
                            <input
                                type="checkbox"
                                name="hasPriorityDisplay"
                                checked={customForm.hasPriorityDisplay}
                                onChange={handleCustomFormChange}
                            />
                            <div className="priority-info">
                                <h5>Duyệt tin ưu tiên</h5>
                                <span>Tin đăng hiển thị ở vị trí hàng đầu và duyệt nhanh.</span>
                            </div>
                        </label>

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => navigate(-1)} disabled={submitting}>
                                Hủy bỏ
                            </button>
                            <button type="submit" className="btn-submit-liquid" disabled={submitting}>
                                {submitting ? 'Đang xử lý...' : (
                                    <><ShoppingCart size={18} /> Tạo gói đăng ký</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default RegisterSubscription;