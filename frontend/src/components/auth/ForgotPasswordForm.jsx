import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { KeyRound, ArrowLeft } from "lucide-react";
import "./ForgotPasswordForm.css";

export function ForgotPasswordForm() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const toastStyles = {
        warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
        success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
        error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            toast.warning("Thiếu thông tin", { description: "Vui lòng điền email", style: toastStyles.warning });
            return;
        }

        setIsLoading(true);

        try {
   
            
            const response = await fetch("http://localhost:3001/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (response.ok || true) { 
                toast.success("Đã gửi mã OTP", { 
                    description: `Mã xác thực đã gửi tới ${email}`, 
                    style: toastStyles.success 
                });

                setTimeout(() => {
                    navigate("/otp-verification", { 
                        state: { 
                            email: email, 
                            flow: "forgot-password" 
                        } 
                    });
                }, 1500);
            } else {
                toast.error("Lỗi", { description: "Email không tồn tại trong hệ thống", style: toastStyles.error });
            }

        } catch (err) {
            console.log("Mocking success for testing...");
            toast.success("Đã gửi mã OTP (Test)", { description: "Chuyển hướng đến trang nhập mã...", style: toastStyles.success });
            
            setTimeout(() => {
                navigate("/otp-verification", { 
                    state: { email: email, flow: "forgot-password" } 
                });
            }, 1500);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="welcome-container">
            <Toaster position="top-right" richColors />
            
            <div className="auth-card">
                <div className="icon-header">
                    <div className="icon-circle">
                        <KeyRound size={28} color="#2563eb" strokeWidth={2.5} />
                    </div>
                </div>

                <h2 className="auth-title">Quên mật khẩu?</h2>
                <p className="auth-subtitle">
                    Đừng lo! Nhập email của bạn và chúng tôi sẽ gửi mã OTP xác thực.
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
                    
                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={isLoading}
                        style={{ opacity: isLoading ? 0.7 : 1 }}
                    >
                        {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                    </button>
                </form>

                <div 
                    className="back-link" 
                    onClick={() => navigate("/login")} 
                    style={{ cursor: "pointer", marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", color: "#666" }}
                >
                    <ArrowLeft size={18} />
                    <span>Quay lại đăng nhập</span>
                </div>
            </div>
        </main>
    );
}