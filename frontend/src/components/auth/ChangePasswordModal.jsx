import React, { useState } from 'react';
import { toast } from "sonner";
import { Lock, X, ShieldCheck } from 'lucide-react';
import authService from '../../services/api/authService';
import "./ChangePasswordModal.css";
import ReactDOM from 'react-dom';

export function ChangePasswordModal({ isOpen, onClose }) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu mới không khớp");
            return;
        }

        setIsLoading(true);
        try {
            await authService.changePassword(oldPassword, newPassword);
            toast.success("Đổi mật khẩu thành công");
            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Mật khẩu cũ không chính xác";
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container profile-animate-up" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="auth-card-modal">
                    <div className="auth-header-icon-modal">
                        <ShieldCheck size={32} strokeWidth={1.5} />
                    </div>

                    <h1 className="auth-title">Đổi mật khẩu</h1>
                    <p className="auth-subtitle">Nhập thông tin bên dưới để cập nhật bảo mật</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Xác nhận mật khẩu</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}