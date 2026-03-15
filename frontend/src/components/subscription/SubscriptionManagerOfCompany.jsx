import React, { useState, useEffect } from 'react';
import subscriptionService from '../../services/api/subscriptionService';
import { toast } from 'sonner';
import { Check, Edit, Calendar, Info, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateSubscriptionForm from './CreateSubscriptionForm';
import './SubscriptionManager.css';

const SubscriptionManagerOfCompany = () => {
    const { token } = useAuth();
    const [subscriptions, setSubscriptions] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

const getListSubscriptionOfCompany = async () => {
       
        try {
            setLoading(true);
            const data = await subscriptionService.listSubcriftionOfCompany(token);
            
            if (Array.isArray(data)) {
                setSubscriptions(data);
            } else if (data && data.result) {
                setSubscriptions(data.result);
            } else {
                setSubscriptions([]);
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
const handleDeleteSubscription = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa gói đăng ký này?')) return;
    
    try {
        await subscriptionService.deleteSubscriptionOfCompany(id, token);
        toast.success('Xóa gói đăng ký thành công');
        getListSubscriptionOfCompany(); 
    } catch (error) {
        console.error('Lỗi khi xóa:', error);
        const errorMessage = error.response?.data?.message || 'Không thể xóa gói đăng ký';
        toast.error("Lỗi xóa", { description: errorMessage });
    }
}

    useEffect(() => {
        getListSubscriptionOfCompany();
    }, [token]);

    const handleCreateSuccess = () => {
        getListSubscriptionOfCompany(); 
    };

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <div className="subscription-admin-manager">
            <div className="admin-header">
                <div>
                    <h1>Quản lý đăng ký</h1>
                    <p>Thông tin các gói dịch vụ của công ty</p>
                </div>
                <button 
                    className="btn-create-subscription"
                    onClick={() => setShowCreateForm(true)}
                >
                    <Plus size={20} /> Tạo gói đăng ký mới
                </button>
            </div>

            <div className="admin-plans-grid">
                {subscriptions && subscriptions.length > 0 ? (
                    subscriptions.map((sub) => (
                        <div key={sub.id} className={`admin-plan-card status-${sub.status.toLowerCase()}`}>
                            <div className="plan-header">
                                <div className="plan-header-top">
                                    <div className="plan-name-section">
                                        <h3 className="plan-name">{sub.name || 'Standard'}</h3>
                                    </div>
                                    <span className={`status-badge ${sub.status}`}>
                                        {sub.status === 'ACTIVE' ? 'Đang hoạt động' : 
                                         sub.status === 'EXPIRED' ? 'Hết hạn' : 
                                         sub.status === 'PENDING' ? 'Chở duyệt' : sub.status}
                                    </span>
                                </div>
                                <div className="plan-price-box">
                                    <span className="price-value">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sub.price)}
                                    </span>
                                </div>
                            </div>

                            <div className="plan-body">
                                <ul className="plan-features">
                                    <li><Check size={16}/> Giới hạn Job: <strong>{sub.jobLimit}</strong></li>
                                    <li><Check size={16}/> Lượt xem ứng viên: <strong>{sub.candidateViewLimit}</strong></li>
                                    <li><Info size={16}/> Đã dùng: {sub.currentJobCount} Jobs / {sub.currentViewCount} Views</li>
                                    <li><Calendar size={16}/> Hết hạn: {new Date(sub.endDate).toLocaleDateString('vi-VN')}</li>
                                    <li><Calendar size={16}/> Thời hạn đăng tin: {sub.postingDuration || 'N/A'} ngày</li>
                                    
                                    {sub.hasPriorityDisplay && (
                                        <li className="highlight"><Check size={16}/> Ưu tiên hiển thị trên hệ thống</li>
                                    )}
                                </ul>
                            </div>

                            <div className="plan-footer">
                                <button className="btn-edit-plan">
                                    <Edit size={16} /> Xem chi tiết thanh toán
                                </button>
                                <button className='btn-delete-plan' onClick={() => handleDeleteSubscription(sub.id)}>
                                    Xóa gói cước
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-data">Công ty chưa có gói đăng ký nào.</div>
                )}
            </div>

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