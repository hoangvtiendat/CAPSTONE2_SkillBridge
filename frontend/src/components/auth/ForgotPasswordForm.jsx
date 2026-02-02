import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router";
import { KeyRound, ArrowLeft } from "lucide-react"; // Import icon đẹp
import "./ForgotPasswordForm.css";

export function ForgotPasswordForm() {
    const navigate = useNavigate();
    const mock_email = "quctonnn@gmail.com";
    const [email, setEmail] = useState("");

    const toastStyles = {
        warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
        success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
        error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.warning("Thiếu thông tin", { description: "Vui lòng điền email", style: toastStyles.warning });
            return;
        }
        if (email !== mock_email) {
            toast.error("Email không tồn tại", { description: "Vui lòng kiểm tra lại email", style: toastStyles.error });
            return;
        }
        toast.success("Email đã được gửi", { description: "Vui lòng kiểm tra hộp thư đến", style: toastStyles.success });
        setTimeout(() => {
            navigate("/login");
        }, 4200);
    }

    return (
        <main className="welcome-container">
            <Toaster position="top-right" richColors />
            
            <div className="auth-card">
                {/* Icon chìa khóa với nền tròn nhạt */}
                <div className="icon-header">
                    <div className="icon-circle">
                        <KeyRound size={28} color="#2563eb" strokeWidth={2.5} />
                    </div>
                </div>

                <h2 className="auth-title">Quên mật khẩu?</h2>
                <p className="auth-subtitle">
                    Đừng lo! Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="nguyenvan@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <button type="submit" className="submit-btn">
                        Gửi Email
                    </button>
                </form>

                <div className="back-link" onClick={() => navigate("/login")}>
                    <ArrowLeft size={18} />
                    <span>Quay lại đăng nhập</span>
                </div>
            </div>
        </main>
    );
}