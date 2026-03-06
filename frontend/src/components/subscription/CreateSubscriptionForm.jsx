import React, { useState } from 'react';
import subscriptionService from '../../services/api/subscriptionService';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './CreateSubscriptionForm.css';

const CreateSubscriptionForm = ({ onClose, onSuccess }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        jobLimit: 12,
        candidateViewLimit: 120,
        hasPriorityDisplay: true
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.jobLimit <= 0) {
            toast.error('Giới hạn Job phải lớn hơn 0');
            return;
        }
        if (formData.candidateViewLimit <= 0) {
            toast.error('Giới hạn xem ứng viên phải lớn hơn 0');
            return;
        }

        try {
            setLoading(true);
            await subscriptionService.createSubscriptionOfCompany(formData, token);
            toast.success('Tạo gói đăng ký thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating subscription:', error);
            const errorMessage = error.response?.data?.message || 'Không thể tạo gói đăng ký';
            toast.error('Lỗi', { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tạo Gói Đăng Ký Mới</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="subscription-form">
                    <div className="form-group">
                        <label htmlFor="jobLimit">
                            Giới hạn số lượng Job <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="jobLimit"
                            name="jobLimit"
                            value={formData.jobLimit}
                            onChange={handleChange}
                            min="1"
                            required
                            className="form-control"
                        />
                        <small className="form-text">Số lượng job tối đa có thể đăng</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="candidateViewLimit">
                            Giới hạn lượt xem ứng viên <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="candidateViewLimit"
                            name="candidateViewLimit"
                            value={formData.candidateViewLimit}
                            onChange={handleChange}
                            min="1"
                            required
                            className="form-control"
                        />
                        <small className="form-text">Số lượt xem hồ sơ ứng viên tối đa</small>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="hasPriorityDisplay"
                                checked={formData.hasPriorityDisplay}
                                onChange={handleChange}
                            />
                            <span>Ưu tiên hiển thị trên hệ thống</span>
                        </label>
                        <small className="form-text">Job của công ty sẽ được hiển thị ưu tiên hơn</small>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span> Đang tạo...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} /> Tạo gói đăng ký
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSubscriptionForm;
