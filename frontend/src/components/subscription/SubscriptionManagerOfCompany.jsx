import React, { useState, useEffect } from 'react';
import subscriptionService from '../../services/api/subscriptionService';
import { toast } from 'sonner';
import { Check, Edit, Calendar, Info, Plus, X, MoreVertical, Trash2, CreditCard, Bell, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateSubscriptionForm from './CreateSubscriptionForm';
import './SubscriptionManagerOfCompany.css';

const SubscriptionManagerOfCompany = () => {
    const { token } = useAuth();
    const [subscriptions, setSubscriptions] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('CLOSE');
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [pendingTransaction, setPendingTransaction] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [showNotification, setShowNotification] = useState(false);


const postPayment = async (id) => {
    try {
        setLoading(true);
        const res = await subscriptionService.postPayment(id, token);
        const orderURL = res.result?.orderurl;
        if (orderURL) {
            window.location.href = orderURL;
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        const errorMessage =
            error.response?.data?.message || 'Lỗi khi tạo đơn thanh toán';
        toast.error('Lỗi khi tạo đơn thanh toán', {
            description: errorMessage,
        });
    } finally {
        setLoading(false);
    }
};
const getListSubscriptionOfCompany = async () => {
       
        try {
            setLoading(true);
            const data = await subscriptionService.listSubcriftionOfCompany(token);
            
            let subscriptionList = [];
            if (Array.isArray(data)) {
                subscriptionList = data;
            } else if (data && data.result) {
                subscriptionList = data.result;
            } else {
                subscriptionList = [];
            }
            
            setSubscriptions(subscriptionList);
            
            const pending = subscriptionList.find(sub => sub.status === 'PENDING_PAYMENT');
            
            if (pending && (!pendingTransaction || pendingTransaction.id !== pending.id)) {
                setPendingTransaction(pending);
                
                if (pending.createdAt) {
                    const createdTime = new Date(pending.createdAt).getTime();
                    const now = Date.now();
                    const elapsed = Math.floor((now - createdTime) / 1000);
                    const remaining = Math.max(900 - elapsed, 0); // 900 seconds = 15 minutes
                    setCountdown(remaining);
                } else {
                    setCountdown(900); 
                }
            } else if (!pending && pendingTransaction) {
                setPendingTransaction(null);
                setCountdown(0);
            }
        } catch (error) {
            console.error("Lỗi khi fetch:", error);
            const errorMessage = error.response?.data?.message || 'Không thể tải danh sách';
            toast.error("Lỗi dữ liệu", { description: errorMessage });
            setSubscriptions([]); 
        } finally {
            setLoading(false);
        }
    };
const handleDeleteSubscription = async (id, isAutoDelete = false) => {
    console.log(' Attempting to delete subscription:', id);
    console.log('isAutoDelete:', isAutoDelete);
    
    if (!isAutoDelete && !window.confirm('Bạn có chắc muốn xóa gói đăng ký này?')) return;
    
    try {
        console.log(' Calling API to delete subscription:', id);
        const response = await subscriptionService.deleteSubscriptionOfCompany(id, token);
        console.log(' Delete response:', response);
        
        if (!isAutoDelete) {
            toast.success('Xóa gói đăng ký thành công');
        }
        
        // Clear pending transaction if it's the one being deleted
        if (pendingTransaction && pendingTransaction.id === id) {
            setPendingTransaction(null);
            setCountdown(0);
        }
        
        getListSubscriptionOfCompany(); 
    } catch (error) {
        console.error('❌ Lỗi khi xóa:', error);
        console.error('Error response:', error.response);
        console.error('Error data:', error.response?.data);
        
        if (!isAutoDelete) {
            const errorMessage = error.response?.data?.message || 'Không thể xóa gói đăng ký';
            toast.error("Lỗi xóa", { description: errorMessage });
        }
    }
}

    useEffect(() => {
        getListSubscriptionOfCompany();
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickInsideDropdown = event.target.closest('.action-dropdown-menu-wrapper');
            const isClickOnRow = event.target.closest('tr.clickable-row');
            const isClickOnNotification = event.target.closest('.pending-notification-fixed') || 
                                         event.target.closest('.notification-dropdown');
            
            if (openDropdownId && !isClickInsideDropdown && !isClickOnRow && !isClickOnNotification) {
                setOpenDropdownId(null);
            }

            if (showNotification && !isClickOnNotification) {
                setShowNotification(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId, showNotification]);

    useEffect(() => {
        if (countdown > 0 && pendingTransaction) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && pendingTransaction) {
            handleDeleteSubscription(pendingTransaction.id, true);
            setPendingTransaction(null);
        }
    }, [countdown, pendingTransaction]);

    const handleCreateSuccess = (newSubscription) => {
        getListSubscriptionOfCompany();
        toast.success('Gói đăng ký đã được tạo! Vui lòng thanh toán trong 15 phút', {
            duration: 5000
        });
    };

    const formatCountdown = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="loading">Đang tải...</div>;

    const currentSubscription = subscriptions.find(sub => sub.status === 'OPEN');
    const allHistorySubscriptions = subscriptions.filter(sub => sub.status === 'CLOSE');
    
    const historySubscriptions = allHistorySubscriptions.filter(sub => sub.status === 'CLOSE');

    return (
        <div className="sub-manager-container">
            {pendingTransaction && countdown > 0 && (
                <div className={`pending-notification-fixed ${countdown <= 180 ? 'urgent' : ''}`}
                    onClick={() => setShowNotification(!showNotification)}
                >
                    <div className="notification-icon-wrapper">
                        <Bell size={22} className="bell-icon" />
                        {countdown <= 180 && <span className="urgent-dot"></span>}
                    </div>
                    <div className="notification-info">
                        <span className="notification-label">Giao dịch chờ thanh toán</span>
                        <span className="notification-badge">
                            <Clock size={12} />
                            {formatCountdown(countdown)}
                        </span>
                    </div>
                    {showNotification && (
                        <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div className="notification-header">
                                <div>
                                    <h4>Giao dịch chờ thanh toán</h4>
                                    <span className="transaction-id">Mã GD: {pendingTransaction.id.substring(0, 16)}...</span>
                                </div>
                                <span className={`countdown-text ${countdown <= 180 ? 'urgent' : ''}`}>
                                    <Clock size={16} />
                                    {formatCountdown(countdown)}
                                </span>
                            </div>
                            <div className="notification-details">
                                <div className="detail-row">
                                    <span className="detail-label">Gói cước:</span>
                                    <span className="detail-value"><strong>{pendingTransaction.name}</strong></span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Thời hạn:</span>
                                    <span className="detail-value">{pendingTransaction.postingDuration} tháng</span>
                                </div>
                                <div className="detail-row price-row">
                                    <span className="detail-label">Tổng tiền:</span>
                                    <span className="notification-price">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pendingTransaction.price)}
                                    </span>
                                </div>
                            </div>
                            {countdown <= 180 && (
                                <div className="warning-message">
                                    <Info size={14} />
                                    Chỉ còn {Math.floor(countdown / 60)} phút! Giao dịch sẽ tự động hủy nếu không thanh toán.
                                </div>
                            )}
                            <div className="notification-actions">
                                <button 
                                    className="notification-btn btn-payment"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        postPayment(pendingTransaction.id);
                                    }}
                                >
                                    <CreditCard size={16} />
                                    Thanh toán ngay
                                </button>
                                <button 
                                    className="notification-btn btn-delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowNotification(false);
                                        handleDeleteSubscription(pendingTransaction.id);
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Xóa giao dịch
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Banner */}
            <div className="sub-promo-banner">
                <div className="banner-text">
                    <h1>SKILLBRIDGE:<br/>NẠP TIỀN & PHÁT TRIỂN</h1>
                    <p>Thanh toán an toàn, học ngay, nhận ưu đãi đặc biệt.</p>
                </div>
            </div>

            <div className="sub-plans-grid">
                <div className="sub-card theme-light">
                    <div className="sub-card-header">
                        <div className="sub-subtitle">
                            <span className="subtitle-text">GÓI HIỆN TẠI</span>
                            <span className="sub-badge badge-gray">
                                {currentSubscription ? currentSubscription.status : 'Chưa kích hoạt'}
                            </span>
                        </div>
                        <div className="sub-title-row">
                            <h2 className="sub-name">{currentSubscription?.name || 'Standard'}</h2>
                            <div className="sub-price">
                                <strong>{currentSubscription ? 
                                    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentSubscription.price) 
                                    : 'Free'
                                }</strong>
                            </div>
                        </div>
                    </div>

                    {currentSubscription ? (
                        <>
                            <div className="progress-section">
                                <div className="progress-labels">
                                    <span>Tin đăng</span>
                                    <span>{currentSubscription.currentJobCount}/{currentSubscription.jobLimit}</span>
                                </div>
                                <div className="progress-track">
                                    <div 
                                        className="progress-fill fill-dark" 
                                        style={{width: `${(currentSubscription.currentJobCount / currentSubscription.jobLimit) * 100}%`}}
                                    ></div>
                                </div>
                            </div>

                            <div className="progress-section">
                                <div className="progress-labels">
                                    <span>Săn nhân tài</span>
                                    <span>{currentSubscription.currentViewCount}/{currentSubscription.candidateViewLimit}</span>
                                </div>
                                <div className="progress-track">
                                    <div 
                                        className="progress-fill fill-green" 
                                        style={{width: `${(currentSubscription.currentViewCount / currentSubscription.candidateViewLimit) * 100}%`}}
                                    ></div>
                                </div>
                            </div>

                            <div className="sub-actions mt-4">
                                <button className="btn-sub-outline">
                                    Đang sử dụng
                                </button>
                                <button 
                                    className="btn-sub-text text-danger"
                                    onClick={() => handleDeleteSubscription(currentSubscription.id)}
                                >
                                    Hủy gói cước
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-subscription-message">
                            <p>Bạn chưa có gói đăng ký nào đang hoạt động.</p>
                        </div>
                    )}
                </div>

                <div className="sub-card theme-dark">
                    <div className="sub-card-header">
                        <div className="sub-subtitle">
                            <span className="subtitle-text">NÂNG CẤP LÊN</span>
                            <span className="sub-badge badge-yellow">Khuyến dùng</span>
                        </div>
                        <div className="sub-title-row">
                            <h2 className="sub-name">Premium</h2>
                            <div className="sub-price">
                                <strong>2tr</strong>/tháng
                            </div>
                        </div>
                    </div>

                    <ul className="sub-features">
                        <li>
                            <Check size={18} className="icon-check" />
                            Đăng 30 tin/tháng
                        </li>
                        <li>
                            <Check size={18} className="icon-check" />
                            Tìm 60 nhân tài/tháng
                        </li>
                        <li>
                            <Check size={18} className="icon-check" />
                            Duyệt tin ưu tiên (Đen xanh)
                        </li>
                    </ul>

                    <div className="sub-actions mt-4">
                        <button 
                            className="btn-sub-yellow"
                            onClick={() => setShowUpgradeModal(true)}
                        >
                            Nâng cấp ngay
                        </button>
                    </div>
                </div>
            </div>

            {/* Lịch sử giao dịch */}
            <div className="transaction-history-box">
                <div className="history-header">
                    <h3 className="history-title">Lịch sử giao dịch</h3>
                </div>
                <div className="table-responsive">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Mã giao dịch</th>
                                <th>Gói</th>
                                <th>Ngày giao dịch</th>
                                <th>Trạng thái</th>
                                <th>Số tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historySubscriptions.length > 0 ? (
                                historySubscriptions.map((sub) => (
                                    <tr key={sub.id}>
                                        <td>{sub.id}</td>
                                        <td>
                                            <span className="badge-history-pkg">
                                                {sub.name} ({sub.postingDuration || 'N/A'} tháng)
                                            </span>
                                        </td>
                                        <td>{new Date(sub.startDate || sub.endDate).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <span className="badge-history status-close">
                                                <Check size={14} />
                                                Đã hoàn thành
                                            </span>
                                        </td>
                                        <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sub.price)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{textAlign: 'center', color: '#94a3b8'}}>
                                        Chưa có lịch sử giao dịch
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showUpgradeModal && (
                <div className="upgrade-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
                    <div className="upgrade-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="upgrade-modal-header">
                            <h3>Chọn hình thức đăng ký</h3>
                            <button 
                                className="close-modal-btn"
                                onClick={() => setShowUpgradeModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="upgrade-modal-body">
                            <button className="upgrade-option-btn disabled" disabled>
                                <div className="upgrade-option-icon">📦</div>
                                <div className="upgrade-option-text">
                                    <h4>Đăng ký gói cước hệ thống</h4>
                                    <p>Chọn từ các gói có sẵn của SkillBridge</p>
                                </div>
                                <span className="coming-soon-badge">Sắp ra mắt</span>
                            </button>
                            <button 
                                className="upgrade-option-btn"
                                onClick={() => {
                                    setShowUpgradeModal(false);
                                    setShowCreateForm(true);
                                }}
                            >
                                <div className="upgrade-option-icon">✨</div>
                                <div className="upgrade-option-text">
                                    <h4>Đăng ký gói cước theo nhu cầu</h4>
                                    <p>Tùy chỉnh gói cước phù hợp với nhu cầu của bạn</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateForm && (
                <CreateSubscriptionForm
                    onClose={() => setShowCreateForm(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default SubscriptionManagerOfCompany;