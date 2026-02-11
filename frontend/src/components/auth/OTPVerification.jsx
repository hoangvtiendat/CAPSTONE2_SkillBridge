import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Fixed import
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "sonner";

export function OTPVerification() {
    const { login } = useAuth();
    const [otp, setOtp] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { email, userData } = location.state || {};

    const handleVerify = (e) => {
        e.preventDefault();
        if (otp === "123456") {
            if (userData) login(userData);
            toast.success("Xác thực thành công", { description: "Đang chuyển hướng..." });
            // Simulate login success
            setTimeout(() => {
                navigate("/");
            }, 1000);
        } else {
            toast.error("Mã OTP không đúng", { description: "Vui lòng thử lại (Mã mặc định: 123456)" });
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
