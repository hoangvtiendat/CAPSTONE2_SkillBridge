import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import subscriptionService from '../../services/api/subscriptionService';
import { toast } from 'sonner';
import { Check, ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './RegisterSubscription.css';

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
        hasPriorityDisplay: true
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
            const sortedData = Array.isArray(data)
                ? data
                    .filter((item) => (item?.isPublic ?? item?.is_public) === true)
                    .sort((a, b) => a.price - b.price)
                : [];
            setSubscriptions(sortedData);
        } catch (error) {
            toast.error("Lỗi tải dữ liệu", { description: "Không thể lấy danh sách gói cước hệ thống" });
        } finally {
            setLoading(false);
        }
    };

    const handleCustomFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'jobLimit') {
            const job = value === '' ? '' : Number(value);
            setCustomForm(prev => ({
                ...prev,
                jobLimit: job
            }));
            return;
        }

        if (name === 'hasPriorityDisplay') {
            setCustomForm(prev => ({ ...prev, hasPriorityDisplay: checked }));
            return;
        }

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
            const created = await subscriptionService.createSubscriptionOfCompany(data, token);
            const createdId =
                created?.id ||
                created?.result?.id ||
                created?.data?.id ||
                created?.subscriptionId ||
                created?.result?.subscriptionId ||
                created?.data?.subscriptionId;

            if (createdId) {
                toast.success('Tạo gói thành công!', { description: 'Đang chuyển hướng đến cổng thanh toán...' });
                await postPayment(createdId, 1);
                return;
            }

            toast.success('Tạo gói thành công!', { description: 'Không tìm thấy mã giao dịch để thanh toán tự động. Vui lòng thanh toán tại trang quản lý.' });
            setTimeout(() => navigate('/company/subscriptions'), 1200);
        } catch (error) {
            toast.error('Lỗi tạo gói', { description: error.response?.data?.message || 'Không thể tạo gói đăng ký' });
        } finally {
            setSubmitting(false);
        }
    };

    const getTierClass = (planName) => {
        const name = planName?.toUpperCase() || '';
        if (name.includes('PREMIUM')) return 'rs-tier-premium';
        if (name.includes('STANDARD')) return 'rs-tier-standard';
        if (name.includes('CUSTOM')) return 'rs-tier-custom';
        return 'rs-tier-free';
    };

    return (
        <div className="rs-page-wrapper">

            <div className="rs-header-nav">
                <button className="rs-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Quay lại
                </button>
            </div>

            {loading && <div className="rs-loading">Đang tải dữ liệu lỏng...</div>}

            {!loading && subscriptionType === 'system' && (
                <div className="rs-grid">
                    {subscriptions.map((sub) => {
                        const tierClass = getTierClass(sub.name);
                        return (
                            <div key={sub.id} className={`rs-card ${tierClass}`}>
                                <div className="rs-card-header">
                                    <h2 className="rs-plan-name">{sub.name}</h2>
                                    <div className="rs-price-box">
                                        <span className="rs-price-value">
                                            {sub.price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(sub.price)}
                                        </span>
                                        {sub.price > 0 && <span className="rs-price-unit">₫/tháng</span>}
                                    </div>
                                </div>

                                <div className="rs-card-body">
                                    <ul className="rs-features-list">
                                        <li><Check size={18} /> <span><strong>{sub.jobLimit}</strong> Tin đăng / tháng</span></li>
                                        <li><Check size={18} /> <span><strong>{sub.candidateViewLimit}</strong> Lượt xem hồ sơ</span></li>
                                        <li><Check size={18} /> <span>Thời hạn: <strong>{sub.postingDuration || '30'} ngày</strong></span></li>
                                    </ul>
                                </div>

                                <div className="rs-card-footer">
                                    {sub.price > 0 ? (
                                        <button className="rs-btn-tier" onClick={() => postPayment(sub.id, 0)}>
                                            <ShoppingCart size={16} /> Chọn gói này
                                        </button>
                                    ) : (
                                        <div className="rs-free-badge">
                                            <Check size={16} /> Gói miễn phí
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && subscriptionType === 'custom' && (
                <div className="rs-custom-form-plate">
                    <div className="rs-form-intro">
                        <ShoppingCart size={56} className="rs-form-icon" />
                        <h2>Tùy chỉnh Gói cước</h2>
                        <p>Thiết lập thông số phù hợp với nhu cầu riêng của doanh nghiệp</p>
                    </div>

                    <form onSubmit={handleSubmitCustomPackage} className="rs-form-content">
                        <div className="rs-input-group">
                            <label>Số lượng tin đăng / tháng *</label>
                            <input type="number" name="jobLimit" value={customForm.jobLimit} onChange={handleCustomFormChange} min="1" required placeholder="Ví dụ: 10" />
                        </div>

                        <div className="rs-input-group">
                            <label>Lượt xem hồ sơ ứng viên</label>
                            <input type="number" name="candidateViewLimit" value={customForm.candidateViewLimit} onChange={handleCustomFormChange} min="1" required placeholder="Ví dụ: 120" />
                        </div>

                        <div className="rs-form-actions">
                            <button type="button" className="rs-btn-cancel" onClick={() => navigate(-1)} disabled={submitting}>Hủy bỏ</button>
                            <button type="submit" className="rs-btn-submit" disabled={submitting}>
                                {submitting ? 'Đang tạo...' : <><ShoppingCart size={18} /> Xác nhận tạo gói</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default RegisterSubscription;