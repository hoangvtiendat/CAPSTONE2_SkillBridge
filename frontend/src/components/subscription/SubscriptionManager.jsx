import React, { useState, useEffect } from 'react';
import subscriptionService from '../../services/api/subscriptionService';
import { toast } from 'sonner';
import { Check, Edit, X, ShieldCheck, Zap, Star, Crown } from 'lucide-react';
import './SubscriptionManager.css';

const SubscriptionManager = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Cấu hình Toast đồng bộ phong cách kính
    const toastStyles = {
        success: { borderRadius: '15px', background: 'rgba(52, 199, 89, 0.9)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' },
        error: { borderRadius: '15px', background: 'rgba(255, 59, 48, 0.9)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const response = await subscriptionService.getlistSubscription();
            const data = response?.result || response?.data || response || [];
            // Sắp xếp theo giá tăng dần
            const sortedData = Array.isArray(data) ? data.sort((a, b) => a.price - b.price) : [];
            setSubscriptions(sortedData);
        } catch (error) {
            toast.error('Không thể tải danh sách gói', { style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    };

    const handDetailSubscription = async (id) => {
        setLoading(true);
        try {
            const response = await subscriptionService.getDetailSubscription(id);
            const data = response?.result || response?.data || response;
            setSelectedSubscription(data);
            setEditForm(data);
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết gói', { style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox'
                ? checked
                : (type === 'number' ? (value === '' ? '' : Number(value)) : value)
        }));
    };

    const handleUpdateSubscription = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await subscriptionService.UpdateSubcription(selectedSubscription.id, editForm, token);
            toast.success('Cập nhật cấu hình thành công!', { style: toastStyles.success });
            setSelectedSubscription(null);
            fetchSubscriptions();
        } catch (error) {
            toast.error('Cập nhật thất bại', { style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    };

    // Hàm lấy Icon tương ứng với từng gói
    const getPlanIcon = (planName) => {
        const name = planName?.toUpperCase() || '';
        if (name.includes('PREMIUM')) return <Crown size={24} />;
        if (name.includes('STANDARD')) return <Star size={24} />;
        if (name.includes('CUSTOM')) return <ShieldCheck size={24} />;
        return <Zap size={24} />;
    };

    // Hàm đồng bộ Class màu sắc từ CSS
    const getThemeClass = (planName) => {
        const name = planName?.toUpperCase() || '';
        if (name.includes('PREMIUM')) return 'plan-card-PREMIUM';
        if (name.includes('STANDARD')) return 'plan-card-STANDARD';
        if (name.includes('CUSTOM')) return 'plan-card-CUSTOM';
        return 'plan-card-FREE';
    };

    const formatPlanPrice = (price) => {
        const amount = Number(price) || 0;
        if (amount === 0) return 'Miễn phí';
        return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
    };

    return (
        <div className="subscription-admin-manager animate-in">
            <div className="sub-manager-header">
                <div className="header-content">
                    <h1>Quản lý Cấu hình Gói cước</h1>
                    <p>Thiết lập giới hạn và đặc quyền cho từng phân khúc khách hàng</p>
                </div>
            </div>

            {loading && !selectedSubscription ? (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang xử lý dữ liệu...</p>
                </div>
            ) : (
                <div className="admin-plans-grid">
                    {subscriptions.map((sub) => (
                        <div key={sub.id} className={`admin-plan-card ${getThemeClass(sub.name)}`}>
                            <div className="plan-header">
                                <div className="plan-header-top">
                                    <div className="plan-icon-wrapper">
                                        {getPlanIcon(sub.name)}
                                    </div>
                                    <h2 className="plan-name">{sub.name}</h2>
                                </div>
                                <div className="plan-price-box">
                                    <span className="price-value">
                                        {formatPlanPrice(sub.price)}
                                    </span>
                                    {sub.price > 0 && <span className="price-unit">/ tháng</span>}
                                </div>
                            </div>

                            <div className="plan-body">
                                <ul className="plan-features">
                                    <li>
                                        <Check size={18} />
                                        <span><strong>{sub.jobLimit}</strong> Tin đăng tối đa</span>
                                    </li>
                                    <li>
                                        <Check size={18} />
                                        <span><strong>{sub.candidateViewLimit}</strong> Lượt xem hồ sơ</span>
                                    </li>
                                    <li>
                                        <Check size={18} />
                                        <span>Hiệu lực tin: <strong>{sub.postingDuration} ngày</strong></span>
                                    </li>
                                    <li className={sub.hasPriorityDisplay ? "highlight" : "dimmed"}>
                                        <Check size={18} />
                                        <span>Duyệt tin ưu tiên: {sub.hasPriorityDisplay ? 'Có' : 'Không'}</span>
                                    </li>
                                    <li className={(sub.isPublic ?? sub.is_public) ? "highlight" : "dimmed"}>
                                        <Check size={18} />
                                        <span>Công khai gói: {(sub.isPublic ?? sub.is_public) ? 'Có' : 'Không'}</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="plan-footer">
                                <button
                                    className="btn-edit-plan"
                                    onClick={() => handDetailSubscription(sub.id)}
                                >
                                    <Edit size={16} /> Chỉnh sửa cấu hình
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal chỉnh sửa phong cách Water Glass */}
            {selectedSubscription && (
                <div className="modal-overlay animate-in" onClick={() => setSelectedSubscription(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Cấu hình gói: <span className="text-highlight">{selectedSubscription.name}</span></h2>
                            <button className="btn-close" onClick={() => setSelectedSubscription(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubscription} className="modal-body">
                            {/* Input Giá tiền */}
                            <div className="form-group">
                                <label>Giá gói cước (VND)</label>
                                <input
                                    type="number"
                                    name="price"
                                    min="0"
                                    step="1000"
                                    value={editForm.price ?? ''}
                                    onChange={handleInputChange}
                                    required
                                    className="form-control"
                                    placeholder="Nhập giá tiền..."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giới hạn bài đăng</label>
                                    <input
                                        type="number"
                                        name="jobLimit"
                                        value={editForm.jobLimit ?? ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Lượt xem CV</label>
                                    <input
                                        type="number"
                                        name="candidateViewLimit"
                                        value={editForm.candidateViewLimit ?? ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Thời hạn hiển thị tin (Ngày)</label>
                                <input
                                    type="number"
                                    name="postingDuration"
                                    value={editForm.postingDuration ?? ''}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                />
                            </div>

                            {!editForm.name?.toUpperCase().includes('FREE') && (
                                <div className="form-group" style={{marginTop: '10px'}}>
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            name="hasPriorityDisplay"
                                            checked={editForm.hasPriorityDisplay || false}
                                            onChange={handleInputChange}
                                        />
                                        <span className="checkbox-text">Kích hoạt Ưu tiên hiển thị (Priority)</span>
                                    </label>
                                </div>
                            )}

                            <div className="form-group" style={{marginTop: '10px'}}>
                                <label className="checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        name="isPublic"
                                        checked={Boolean(editForm.isPublic ?? editForm.is_public)}
                                        onChange={handleInputChange}
                                    />
                                    <span className="checkbox-text">Hiển thị công khai gói (isPublic)</span>
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setSelectedSubscription(null)}>
                                    Đóng
                                </button>
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Đang lưu...' : 'Lưu cấu hình'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionManager;