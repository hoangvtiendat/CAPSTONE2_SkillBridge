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
            const data = response?.result || response?.data || response || [];
            
            const sortedData = Array.isArray(data) ? data.sort((a, b) => a.price - b.price) : [];
            setSubscriptions(sortedData);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Lỗi khi tải danh sách gói đăng ký';
            toast.error(errorMessage, { style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPackage = async (packageId) => {
        toast.info('Chức năng đang phát triển', {
            description: 'Vui lòng quay lại trang trước để đăng ký theo nhu cầu'
        });
    };

    const handleCustomFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCustomForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleSubmitCustomPackage = async (e) => {
        e.preventDefault();
        
        if (!customForm.jobLimit || customForm.jobLimit <= 0) {
            toast.error('Vui lòng nhập số lượng tin đăng hợp lệ');
            return;
        }
        
        if (!customForm.candidateViewLimit || customForm.candidateViewLimit <= 0) {
            toast.error('Vui lòng nhập số lượt xem CV hợp lệ');
            return;
        }
        
        setSubmitting(true);
        try {
            const data = {
                jobLimit: Number(customForm.jobLimit),
                candidateViewLimit: Number(customForm.candidateViewLimit),
                hasPriorityDisplay: customForm.hasPriorityDisplay
            };
            
            await subscriptionService.createSubscriptionOfCompany(data, token);
            
            toast.success('Tạo gói đăng ký thành công!', {
                description: 'Bạn sẽ được chuyển về trang quản lý gói cước'
            });
            
            setTimeout(() => {
                navigate('/company/subscriptions');
            }, 1500);
            
        } catch (error) {
            console.error('Error creating custom subscription:', error);
            const errorMessage = error.response?.data?.message || 'Không thể tạo gói đăng ký';
            toast.error('Lỗi tạo gói đăng ký', {
                description: errorMessage
            });
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
            
            <div className="admin-header">
                <button 
                    className="btn-back"
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#475569',
                        marginBottom: '16px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                >
                    <ArrowLeft size={18} />
                    Quay lại
                </button>
                
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {subscriptionType === 'system' ? (
                        <>
                            <Package size={32} />
                            Đăng ký Gói cước Hệ thống
                        </>
                    ) : (
                        <>
                            <ShoppingCart size={32} />
                            Đăng ký Gói cước theo Nhu cầu
                        </>
                    )}
                </h1>
                <p style={{ 
                    color: '#64748b', 
                    fontSize: '15px', 
                    marginTop: '8px',
                    fontWeight: '400'
                }}>
                    {subscriptionType === 'system' 
                      
                    }
                </p>
            </div>

            {loading && <div className="loading-spinner">Đang tải dữ liệu...</div>}

            {!loading && subscriptionType === 'system' && (
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
                                            {sub.price === 0 
                                                ? 'Miễn phí' 
                                                : new Intl.NumberFormat('vi-VN').format(sub.price)
                                            }
                                        </span>
                                        {sub.price > 0 && <span className="price-unit">₫/tháng</span>}
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
                                            <span>Thời hạn đăng: <strong>{sub.postingDuration || 'N/A'} ngày</strong></span>
                                        </li>
                                        <li>
                                            <Check className="check-icon" size={18} />
                                            <span>Duyệt tin ưu tiên: {sub.hasPriorityDisplay ? 'Có' : 'Không'}</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="plan-footer">
                                    {sub.price > 0 ? (
                                        <button 
                                            className="btn-edit-plan"
                                            onClick={() => postPayment(sub.id, 0)}
                                            style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <ShoppingCart size={16} /> Chọn gói này
                                        </button>
                                    ) : (
                                        <div style={{
                                            padding: '12px 16px',
                                            background: '#f1f5f9',
                                            borderRadius: '8px',
                                            color: '#64748b',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            textAlign: 'center'
                                        }}>
                                            <Check size={16} style={{ 
                                                display: 'inline-block', 
                                                marginRight: '6px',
                                                verticalAlign: 'middle',
                                                color: '#10b981'
                                            }} />
                                            Gói miễn phí
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && subscriptionType === 'custom' && (
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '40px',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <ShoppingCart size={48} style={{ color: '#667eea', marginBottom: '16px' }} />
                        <h2 style={{ 
                            fontSize: '24px', 
                            fontWeight: '700',
                            color: '#1e293b',
                            marginBottom: '8px'
                        }}>
                            Tạo gói đăng ký theo nhu cầu
                        </h2>
                        <p style={{ 
                            color: '#64748b',
                            fontSize: '15px'
                        }}>
                            Điền thông tin chi tiết gói cước bạn muốn đăng ký
                        </p>
                    </div>

                    <form onSubmit={handleSubmitCustomPackage}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#334155',
                                marginBottom: '8px'
                            }}>
                                Số lượng tin đăng / tháng <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="number"
                                name="jobLimit"
                                value={customForm.jobLimit}
                                onChange={handleCustomFormChange}
                                min="1"
                                required
                                placeholder="Ví dụ: 10"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: '15px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <small style={{ color: '#64748b', fontSize: '13px', display: 'block', marginTop: '4px' }}>
                                Số lượng tin tuyển dụng bạn có thể đăng mỗi tháng
                            </small>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#334155',
                                marginBottom: '8px'
                            }}>
                                Lượt xem hồ sơ ứng viên / tháng <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="number"
                                name="candidateViewLimit"
                                value={customForm.candidateViewLimit}
                                onChange={handleCustomFormChange}
                                min="1"
                                required
                                placeholder="Ví dụ: 50"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: '15px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <small style={{ color: '#64748b', fontSize: '13px', display: 'block', marginTop: '4px' }}>
                                Số lượt xem chi tiết CV của ứng viên mỗi tháng
                            </small>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                padding: '16px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                            >
                                <input
                                    type="checkbox"
                                    name="hasPriorityDisplay"
                                    checked={customForm.hasPriorityDisplay}
                                    onChange={handleCustomFormChange}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        accentColor: '#667eea'
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: '#1e293b',
                                        marginBottom: '4px'
                                    }}>
                                        Duyệt tin ưu tiên
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#64748b'
                                    }}>
                                        Tin đăng của bạn sẽ được xét duyệt ưu tiên và hiển thị nổi bật
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                disabled={submitting}
                                style={{
                                    padding: '12px 24px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    opacity: submitting ? 0.5 : 1
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    padding: '12px 24px',
                                    background: submitting ? '#94a3b8' : '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {submitting ? (
                                    <>
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart size={18} />
                                        <span>Tạo gói đăng ký</span>
                                    </>
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