import React, { useEffect, useState } from 'react';
import subscriptionService from '../../services/api/subscriptionService';
import { toast, Toaster } from 'sonner';
import { Check, Edit, X } from 'lucide-react';
import './SubscriptionManager.css';

const SubscriptionManager = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editForm, setEditForm] = useState({});

    const toastStyles = {
        warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
        success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
        error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const response = await subscriptionService.getlistSubscription();
            // Điều chỉnh lại tuỳ theo data backend trả về (response.result hoặc response)
            const data = response?.result || response?.data || response || [];
            
            // Sắp xếp các gói theo giá tiền từ thấp đến cao (Free -> Standard -> Premium)
            const sortedData = Array.isArray(data) ? data.sort((a, b) => a.price - b.price) : [];
            setSubscriptions(sortedData);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách gói đăng ký', { style: toastStyles.error });
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
            setEditForm(data); // Đổ dữ liệu vào form
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết gói đăng ký', { style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleUpdateSubscription = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Chú ý: đảm bảo payload và id truyền đi khớp với backend yêu cầu
            await subscriptionService.UpdateSubcription(selectedSubscription.id, editForm, token);
            toast.success('Cập nhật gói đăng ký thành công', { style: toastStyles.success });
            setSelectedSubscription(null); // Đóng modal
            fetchSubscriptions(); // Tải lại danh sách
        } catch (error) {
            toast.error('Lỗi khi cập nhật gói đăng ký', { style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    };

    // --- HÀM HỖ TRỢ HIỂN THỊ GIAO DIỆN ---
    const getThemeClass = (planName) => {
        const name = planName?.toUpperCase() || '';
        if (name.includes('PREMIUM')) return 'theme-premium';
        if (name.includes('STANDARD')) return 'theme-standard';
        return 'theme-free';
    };

    return (
        <div className="subscription-admin-manager">
            <Toaster position="top-right" />
            
            <div className="admin-header">
                <h1>Quản lý Cấu hình Gói cước</h1>
                <p>Xem và chỉnh sửa giới hạn, giá tiền của các gói đăng ký trên hệ thống.</p>
            </div>

            {loading && !selectedSubscription && <div className="loading-spinner">Đang tải dữ liệu...</div>}

            {!loading && (
                <div className="admin-plans-grid">
                    {subscriptions.map((sub) => {
                        const themeClass = getThemeClass(sub.name);
                        return (
                            <div key={sub.id} className={`admin-plan-card ${themeClass}`}>
                                {themeClass === 'theme-premium' }
                                
                                <div className="plan-header">
                                    <h2 className="plan-name">{sub.name}</h2>
                                    <div className="plan-price-box">
                                        <span className="price-value">
                                            {sub.price === 0 ? 'Miễn phí' : `${(sub.price / 1000000).toLocaleString()}tr`}
                                        </span>
                                        {sub.price > 0 && <span className="price-unit">/tháng</span>}
                                    </div>
                                </div>

                                <div className="plan-body">
                                    <ul className="plan-features">
                                        <li>
                                            <Check className="check-icon" size={18} />
                                            <span><strong>{sub.jobLimit}</strong> Tin đăng / tháng</span>
                                        </li>
                                        <li>
                                            <Check className="check-icon" size={18} />
                                            <span><strong>{sub.candidateViewLimit}</strong> Lượt xem hồ sơ</span>
                                        </li>
                                        <li>
                                            <Check className="check-icon" size={18} />
                                            <span>Duyệt tin ưu tiên: {sub.hasPriorityDisplay ? 'Có' : 'Không'}</span>
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
                        );
                    })}
                </div>
            )}

            {/* ================= MODAL CẬP NHẬT GÓI ================= */}
            {selectedSubscription && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Cập nhật gói: <span className="text-highlight">{selectedSubscription.name}</span></h2>
                            <button className="btn-close" onClick={() => setSelectedSubscription(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubscription} className="modal-body">
                            <div className="form-group">
                                <label>Tên gói cước</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>Giá tiền (VND)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={editForm.price ?? ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                    className="form-control"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giới hạn Bài đăng</label>
                                    <input
                                        type="number"
                                        name="jobLimit"
                                        value={editForm.jobLimit ?? ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        required
                                        className="form-control"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Lượt xem CV</label>
                                    <input
                                        type="number"
                                        name="candidateViewLimit"
                                        value={editForm.candidateViewLimit ?? ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        required
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        name="hasPriorityDisplay"
                                        checked={editForm.hasPriorityDisplay || false}
                                        onChange={handleInputChange}
                                    />
                                    <span className="checkbox-text">Kích hoạt tính năng Duyệt tin ưu tiên (Đèn xanh)</span>
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setSelectedSubscription(null)}>
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
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