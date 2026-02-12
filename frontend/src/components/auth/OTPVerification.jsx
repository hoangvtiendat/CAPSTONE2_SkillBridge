import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Fixed import
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "sonner";
import authService from "../../services/api/authService";

export function OTPVerification() {
    const { login, fetchProfile } = useAuth();
    const [otp, setOtp] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { email, userData } = location.state || {};

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const response = await authService.verifyOtp(email, otp);
            if (response && response.result) {
                // Check for accessToken or token in the result
                const { accessToken, token } = response.result;
                const finalToken = accessToken || token;

                if (finalToken) {
                    localStorage.setItem('token', finalToken);
                    if (typeof fetchProfile === 'function') {
                        await fetchProfile();
                    }
                    toast.success("Xác thực thành công", { description: "Đang chuyển hướng..." });
                    setTimeout(() => {
                        navigate("/");
                    }, 1000);
                } else {
                    // Fallback if no token found but success (unlikely for auth endpoint)
                    toast.error("Lỗi xác thực", { description: "Không nhận được token đăng nhập" });
                }
            }
        } catch (error) {
            console.error("OTP Verification failed", error);
            const errorMsg = error.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn";
            toast.error("Xác thực thất bại", { description: errorMsg });
        }
    };

    return (
        <main className="welcome-container">
            <Toaster position="top-right" richColors />
            <div className="auth-card">
                <h1 className="auth-title">Xác thực 2FA</h1>
                <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
                    Mã xác thực đã được gửi đến {email}
                </p>

                <form onSubmit={handleVerify} className="auth-form">
                    <div className="form-group">
                        <label>Mã OTP</label>
                        <input
                            type="text"
                            placeholder="Nhập mã 6 số"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            style={{ letterSpacing: "5px", textAlign: "center", fontSize: "1.2rem" }}
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        Xác nhận
                    </button>
                </form>

                <button onClick={() => navigate("/auth/login")} className="toggle-btn">
                    Quay lại đăng nhập
                </button>
            </div>
        </main>
    );
}
