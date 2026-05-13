import React, { useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../../services/api/subscriptionService';
import { toast } from 'sonner';
import { Check, Edit, Calendar, Info, Plus, X, MoreVertical, Trash2, CreditCard, Bell, Clock, Package, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateSubscriptionForm from './CreateSubscriptionForm';
import './SubscriptionManagerOfCompany.css';
import { ca } from 'date-fns/locale';

const SubscriptionManagerOfCompany = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.companyRole === 'ADMIN';
    const hasProcessedUrl = useRef(false);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('ALL');
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [pendingTransaction, setPendingTransaction] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [systemPackages, setSystemPackages] = useState([]);

    const pendingStatuses = ['PENDING_PAYMENT', 'PENDING', 'WAITING_PAYMENT'];

const fetchSystemPackages = async () => {
    try {
        const response = await subscriptionService.getlistSubscription();
        const data = response?.result || response?.data || response || [];
        console.log('Fetched system packages:', data);

        const packages = Array.isArray(data) ? data : [];

        const premiumPackage = packages.find(pkg =>
            pkg.name && pkg.name.toLowerCase() === "premium"
        );

        console.log('Premium package found:', premiumPackage);
        setSystemPackages(premiumPackage ? [premiumPackage] : []);
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Lỗi khi tải danh sách gói đăng ký';
        console.error(errorMessage, error);
        toast.error('Không thể tải gói Premium', { description: errorMessage });
    }
}
   const postPayment = async (id, type) => {
    try {
        setLoading(true);
        const res = await subscriptionService.postPayment(id, token, type);
        const orderURL =
            res?.checkoutUrl ||
            res?.result?.checkoutUrl ||
            res?.data?.checkoutUrl ||
            res?.postPayment;

        if (!orderURL) {
            throw new Error('Không nhận được checkoutUrl từ hệ thống thanh toán');
        }

        sessionStorage.setItem('pendingPayment', id);
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

            const urlParams = new URLSearchParams(window.location.search);
            const paymentStatus = urlParams.get('status');
            const returnFromPayment = urlParams.get('apptransid') || urlParams.get('return');

            const pendingPaymentId = sessionStorage.getItem('pendingPayment');

            if (returnFromPayment && !hasProcessedUrl.current) {
                hasProcessedUrl.current = true;
                
                window.history.replaceState({}, '', window.location.pathname);
                console.log("Safari Safety: URL Cleaned");
            }

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

            const pending = subscriptionList.find(
                sub => !sub.deleted && pendingStatuses.includes(sub.status)
            );

            if (returnFromPayment && paymentStatus !== '1' && pending) {
                toast.info('Thanh toán chưa hoàn tất. Giao dịch đã bị hủy.', {
                    description: 'Bạn có thể tạo đơn mới nếu muốn thanh toán lại.',
                    duration: 5000
                });

                setPendingTransaction(null);
                setCountdown(0);
                setShowNotification(false);
                sessionStorage.removeItem('pendingPayment');

                await handleDeleteSubscription(pending.id, {
                    skipConfirm: true,
                    silent: true,
                    refreshAfterDelete: false,
                });
                return;
            }

            if (returnFromPayment && paymentStatus === '1') {
                sessionStorage.removeItem('pendingPayment');
            }
            

            // Không tự động hủy giao dịch chỉ vì thiếu tham số return URL.
            // Nhiều cổng thanh toán dùng key khác, và giao dịch pending vẫn cần hiển thị để người dùng thao tác.

            if (pending && (!pendingTransaction || pendingTransaction.id !== pending.id)) {
                setPendingTransaction(pending);

                if (pending.createdAt) {
                    const createdTime = new Date(pending.createdAt).getTime();
                    const now = Date.now();
                    const elapsed = Math.floor((now - createdTime) / 1000);
                    const remaining = Math.max(900 - elapsed, 0);
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
            
            // Chỉ show error toast nếu là admin
            if (user?.companyRole === 'ADMIN') {
                toast.error("Lỗi dữ liệu", { description: errorMessage });
            }
            
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    };
const handleDeleteSubscription = async (id, options = {}) => {
    const {
        skipConfirm = false,
        silent = false,
        refreshAfterDelete = true,
        optimistic = false,
    } = options;

    console.log(' Attempting to delete subscription:', id);
    console.log('delete options:', options);

    if (!skipConfirm && !window.confirm('Bạn có chắc muốn xóa gói đăng ký này?')) return;

    const previousPendingTransaction = pendingTransaction;
    const previousCountdown = countdown;

    if (optimistic && pendingTransaction && pendingTransaction.id === id) {
        setPendingTransaction(null);
        setCountdown(0);
        setShowNotification(false);
    }

    try {
        console.log(' Calling API to delete subscription:', id);
        const response = await subscriptionService.deleteSubscriptionOfCompany(id, token);
        console.log(' Delete response:', response);

        if (!silent) {
            toast.success('Xóa gói đăng ký thành công');
        }

        if (pendingTransaction && pendingTransaction.id === id) {
            setPendingTransaction(null);
            setCountdown(0);
            setShowNotification(false);
            sessionStorage.removeItem('pendingPayment');
        }

        if (refreshAfterDelete) {
            await getListSubscriptionOfCompany();
        }
    } catch (error) {
        console.error(' Lỗi khi xóa:', error);
        console.error('Error response:', error.response);
        console.error('Error data:', error.response?.data);

        if (optimistic && previousPendingTransaction && previousPendingTransaction.id === id) {
            setPendingTransaction(previousPendingTransaction);
            setCountdown(previousCountdown);
        }

        if (!silent) {
            const errorMessage = error.response?.data?.message || 'Không thể xóa gói đăng ký';
            toast.error("Lỗi xóa", { description: errorMessage });
        }
    }
}

    useEffect(() => {
        getListSubscriptionOfCompany();
        fetchSystemPackages();
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
            if (hasProcessedUrl.current) return; // Đã xử lý URL callback, không làm lại

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
            handleDeleteSubscription(pendingTransaction.id, {
                skipConfirm: true,
                silent: true,
                refreshAfterDelete: true,
            });
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

    const getTransactionStatusMeta = (sub) => {
        if (sub?.deleted) {
            return {
                label: 'Đã hủy',
                bg: 'rgba(239, 68, 68, 0.12)',
                color: '#b91c1c',
                border: '1px solid rgba(239, 68, 68, 0.2)',
            };
        }

        switch (sub?.status) {
            case 'OPEN':
                return {
                    label: 'Đang hoạt động',
                    bg: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                };
            case 'PENDING_PAYMENT':
            case 'PENDING':
            case 'WAITING_PAYMENT':
                return {
                    label: 'Chờ thanh toán',
                    bg: 'rgba(245, 158, 11, 0.14)',
                    color: '#b45309',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                };
            case 'CLOSE':
                return {
                    label: 'Đã kết thúc',
                    bg: 'rgba(52, 199, 89, 0.12)',
                    color: '#16a34a',
                    border: '1px solid rgba(52, 199, 89, 0.2)',
                };
            default:
                return {
                    label: sub?.status || 'Không xác định',
                    bg: 'rgba(100, 116, 139, 0.12)',
                    color: '#475569',
                    border: '1px solid rgba(100, 116, 139, 0.2)',
                };
        }
    };

    const historyFilterOptions = [
        { key: 'ALL', label: 'Tất cả' },
        { key: 'PENDING', label: 'Chờ thanh toán' },
        { key: 'CLOSE', label: 'Đã kết thúc' },
        { key: 'CANCELLED', label: 'Đã hủy' },
    ];

    if (loading) return <div className="loading">Đang tải...</div>;

    const currentSubscription = subscriptions.find(sub => sub.status === 'OPEN');
    const transactionRows = subscriptions
        .filter((sub) => sub.status !== 'OPEN')
        .sort(
        (a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0)
    );
    const filteredTransactionRows = transactionRows.filter((sub) => {
        if (historyFilter === 'ALL') return true;
        if (historyFilter === 'CANCELLED') return !!sub.deleted;
        if (historyFilter === 'PENDING') return !sub.deleted && pendingStatuses.includes(sub.status);
        if (historyFilter === 'CLOSE') return !sub.deleted && sub.status === 'CLOSE';
        return true;
    });
    const premiumPkg = systemPackages.length > 0 ? systemPackages[0] : null;
    const currentSubscriptionName = currentSubscription?.name || currentSubscription?.subscriptionPlan?.name || 'Đang hoạt động';

    const hasPartialUsage = !!currentSubscription && (
        (Number(currentSubscription.currentJobCount || 0) > 0 && Number(currentSubscription.currentJobCount || 0) < Number(currentSubscription.jobLimit || 0)) ||
        (Number(currentSubscription.currentViewCount || 0) > 0 && Number(currentSubscription.currentViewCount || 0) < Number(currentSubscription.candidateViewLimit || 0))
    );

    const handleOpenUpgradeModal = () => {
        if (hasPartialUsage) {
            const confirmed = window.confirm(
                'Hiện tại Tin đăng + Săn nhân tài mới dùng một chút. Bạn có chắc là muốn thay đổi không?'
            );

            if (!confirmed) {
                return;
            }
        }

        setShowUpgradeModal(true);
    };
    return (
        <div className="sub-manager-container">
            {isAdmin && pendingTransaction && countdown > 0 && (
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
                                    <span className="transaction-id">Mã GD: {pendingTransaction.id.substring(0, 12)}...</span>
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
                                        postPayment(pendingTransaction.id, 1);
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
                                        handleDeleteSubscription(pendingTransaction.id, {
                                            skipConfirm: true,
                                            silent: false,
                                            refreshAfterDelete: true,
                                            optimistic: true,
                                        });
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Hủy giao dịch
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Banner */}
            <div className="sub-promo-banner">
                <div className="banner-text">
                    <h1 >SKILLBRIDGE:<br/>NẠP TIỀN & PHÁT TRIỂN</h1>
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
                            <h2 className="sub-name">{currentSubscriptionName}</h2>

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
                                    Đang sử dụng

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
                        <span className="sub-badge badge-yellow">Khuyên dùng</span>
                    </div>
                    <div className="sub-title-row">
                        <h2 className="sub-name">{premiumPkg?.name }</h2>
                        <div className="sub-price">
                            <strong>
                                {premiumPkg
                                    ? new Intl.NumberFormat('vi-VN').format(premiumPkg.price)
                                    : "loading..."}
                            </strong>
                            /tháng
                        </div>
                    </div>
                </div>

                <ul className="sub-features">
                    <li>
                        <Check size={18} className="icon-check" />
                        Đăng {premiumPkg?.jobLimit } tin/tháng
                    </li>
                    <li>
                        <Check size={18} className="icon-check" />
                        Tìm {premiumPkg?.candidateViewLimit } nhân tài/tháng
                    </li>
                    <li>
                        <Check size={18} className="icon-check" />
                        {premiumPkg?.hasPriorityDisplay || premiumPkg?.has_priority_display
                            ? 'Duyệt tin ưu tiên (SkillBridge)'
                            : 'Thời hạn: ' + (premiumPkg?.postingDuration || premiumPkg?.posting_duration) + ' tháng'}
                    </li>
                    {(premiumPkg?.hasPriorityDisplay || premiumPkg?.has_priority_display) && (
                        <li>
                            <Check size={18} className="icon-check" />
                            Hiển thị ưu tiên trong danh sách
                        </li>
                    )}
                </ul>

                <div className="sub-actions mt-4">
                    {isAdmin ? (
                        <button
                            className="btn-sub-yellow"
                            onClick={handleOpenUpgradeModal}
                        >
                            Nâng cấp ngay
                        </button>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px',
                            backgroundColor: 'rgba(148, 163, 184, 0.1)',
                            borderRadius: '8px',
                            color: '#64748b',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}>
                            <Lock size={18} />
                            <span>Chỉ Admin có thể nâng cấp</span>
                        </div>
                    )}
                </div>
            </div>
            </div>

            <div className="transaction-history-box">
                <div className="history-header">
                    <h3 className="history-title">Lịch sử giao dịch</h3>
                    <div className="history-filters">
                        {historyFilterOptions.map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                className={`history-filter-btn ${historyFilter === option.key ? 'active' : ''}`}
                                onClick={() => setHistoryFilter(option.key)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
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
                            {filteredTransactionRows.length > 0 ? (
                                filteredTransactionRows.map((sub) => {
                                    const statusMeta = getTransactionStatusMeta(sub);
                                    return (
                                    <tr key={sub.id}>
                                        <td>{sub.id}</td>
                                        <td>
                                            <span className="badge-history-pkg">
                                                {sub.name} ({sub.postingDuration || 'N/A'} ngày)
                                            </span>
                                        </td>
                                        <td>{new Date(sub.createdAt || sub.startDate || sub.endDate).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <span
                                                className="badge-history"
                                                style={{
                                                    background: statusMeta.bg,
                                                    color: statusMeta.color,
                                                    border: statusMeta.border,
                                                    padding: '6px 14px',
                                                    borderRadius: '999px',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                }}
                                            >
                                                <Check size={14} />
                                                {statusMeta.label}
                                            </span>
                                        </td>
                                        <td>
                                            {sub.price === 0 || sub.price === null ? (
                                                <span style={{color: '#10b981', fontWeight: '600'}}>Miễn phí</span>
                                            ) : (
                                                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sub.price)
                                            )}
                                        </td>
                                    </tr>
                                )})
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{textAlign: 'center', color: '#94a3b8'}}>
                                        Không có giao dịch 
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
                            <button
                                className="upgrade-option-btn"
                                onClick={() => {
                                    setShowUpgradeModal(false);
                                    navigate('/company/subscriptions/register?type=system');
                                }}
                            >
                                <div className="upgrade-option-icon">
                                    <Package size={28} />
                                </div>
                                <div className="upgrade-option-text">
                                    <h4>Đăng ký gói cước hệ thống</h4>
                                    <p>Chọn từ các gói có sẵn của SkillBridge</p>
                                </div>
                            </button>
                            <button
                                className="upgrade-option-btn"
                                onClick={() => {
                                    setShowUpgradeModal(false);
                                    navigate('/company/subscriptions/register?type=custom');
                                }}
                            >
                                <div className="upgrade-option-icon">
                                    <Sparkles size={28} />
                                </div>
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