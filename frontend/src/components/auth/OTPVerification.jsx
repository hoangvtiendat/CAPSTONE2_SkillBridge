import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "sonner";
import authService from "../../services/api/authService";

export function OTPVerification() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const { email: initialEmail, flow, userData } = location.state || {};

    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [currentStep, setCurrentStep] = useState(1);

    const isRegisterFlow = flow === "register";
    const isLoginFlow = flow === "login";
    const isForgotPasswordFlow = flow === "forgot-password";

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!initialEmail) {
            toast.error("Lỗi phiên làm việc, không tìm thấy email!");
            return;
        }

        if ((isRegisterFlow || isForgotPasswordFlow) && password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        let targetEndpoint = "";
        let requestBody = {};

        if (isRegisterFlow) {
            targetEndpoint = "http://localhost:8081/identity/auth/register/verify-otp";
            requestBody = {
                email: initialEmail,
                otp: otp.trim(),
                password: password,
                name: name,
                phoneNumber: phoneNumber,
                address: address
            };
        }
        else if (isLoginFlow) {
            targetEndpoint = "http://localhost:8081/identity/auth/login/verify-otp";
            requestBody = {
                email: initialEmail,
                otp: otp.trim()
            };
        }
        else if (isForgotPasswordFlow) {

            targetEndpoint = "http://localhost:8081/identity/auth/reset-password";
            requestBody = {
                email: initialEmail,
                otp: otp.trim(),
                password: password
            };
        }

        try {
            console.log("Sending to:", targetEndpoint);
            console.log("Body:", requestBody);

            const res = await fetch(targetEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Xác thực thất bại");
            }

            toast.success("Thành công!");

            setTimeout(() => {
                if (isRegisterFlow || isForgotPasswordFlow) {
                    navigate("/login");
                } else if (isLoginFlow) {
                    if (data.result) login(data.result);
                    else if (userData) login(userData);

                    navigate("/");
                }
            }, 1500);

        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!name || !phoneNumber || !address) {
                toast.error("Vui lòng điền đầy đủ thông tin cá nhân");
                return;
            }
        }
        if (currentStep === 2) {
            if (!password || !confirmPassword) {
                toast.error("Vui lòng nhập mật khẩu");
                return;
            }
            if (password !== confirmPassword) {
                toast.error("Mật khẩu xác nhận không khớp");
                return;
            }
        }
        setCurrentStep((prev) => prev + 1);
    };

    const handlePrevStep = () => {
        setCurrentStep((prev) => prev - 1);
    };

    if (!initialEmail) {
        return (
            <div style={{ padding: "50px", textAlign: "center" }}>
                <h2>Phiên làm việc không hợp lệ</h2>
                <button onClick={() => navigate("/login")}>Quay lại đăng nhập</button>
            </div>
        );
    }

    return (
        <main className="welcome-container">
            <Toaster position="top-right" richColors />
            <div className="auth-card">
                <h1 className="auth-title">
                    {isRegisterFlow ? "Hoàn tất hồ sơ" :
                     isForgotPasswordFlow ? "Đặt lại mật khẩu" : "Xác thực OTP"}
                </h1>

                {isRegisterFlow && (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", gap: "10px" }}>
                        <span style={{ fontWeight: currentStep === 1 ? "bold" : "normal", color: currentStep >= 1 ? "#2563eb" : "#ccc" }}>1. Thông tin</span>
                        <span>&rarr;</span>
                        <span style={{ fontWeight: currentStep === 2 ? "bold" : "normal", color: currentStep >= 2 ? "#2563eb" : "#ccc" }}>2. Bảo mật</span>
                        <span>&rarr;</span>
                        <span style={{ fontWeight: currentStep === 3 ? "bold" : "normal", color: currentStep >= 3 ? "#2563eb" : "#ccc" }}>3. Xác thực</span>
                    </div>
                )}

                <p style={{ textAlign: "center", marginBottom: 20, color: "#666", fontSize: "0.9rem" }}>
                    {currentStep === 3 || !isRegisterFlow
                        ? <>Mã xác thực đã được gửi đến <b>{initialEmail}</b></>
                        : "Vui lòng bổ sung thông tin để hoàn tất đăng ký."
                    }
                </p>

                <form onSubmit={handleVerify} className="auth-form">

                    {isRegisterFlow && currentStep === 1 && (
                        <div className="step-content animate-fade-in">
                            <div className="form-group">
                                <label>Họ và Tên</label>
                                <input type="text" placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input type="tel" placeholder="09xxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <input type="text" placeholder="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} />
                            </div>
                            <button type="button" onClick={handleNextStep} className="submit-btn" style={{marginTop: "10px"}}>Tiếp tục &rarr;</button>
                        </div>
                    )}

                    {isRegisterFlow && currentStep === 2 && (
                        <div className="step-content animate-fade-in">
                            <div className="form-group">
                                <label>Mật khẩu</label>
                                <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus />
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu</label>
                                <input type="password" placeholder="Xác nhận mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={handlePrevStep} className="toggle-btn" style={{ flex: 1 }}>&larr; Quay lại</button>
                                <button type="button" onClick={handleNextStep} className="submit-btn" style={{ flex: 1 }}>Tiếp tục &rarr;</button>
                            </div>
                        </div>
                    )}

                    {((isRegisterFlow && currentStep === 3) || isLoginFlow || isForgotPasswordFlow) && (
                        <div className="step-content animate-fade-in">

                            {isForgotPasswordFlow && (
                                <>
                                    <div className="form-group">
                                        <label>Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            placeholder="Nhập mật khẩu mới"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Xác nhận mật khẩu</label>
                                        <input
                                            type="password"
                                            placeholder="Nhập lại mật khẩu mới"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                    <hr style={{margin: "15px 0", borderTop: "1px dashed #ccc"}}/>
                                </>
                            )}

                            <div className="form-group">
                                <label style={{ color: "#2563eb", fontWeight: "bold" }}>Mã OTP</label>
                                <input
                                    type="text"
                                    placeholder="6 số"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    required
                                    autoFocus={!isForgotPasswordFlow}
                                    style={{
                                        letterSpacing: "5px",
                                        textAlign: "center",
                                        fontSize: "1.2rem",
                                        border: "2px solid #2563eb",
                                        fontWeight: "bold"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexDirection: isRegisterFlow ? "row" : "column" }}>
                                {isRegisterFlow && (
                                    <button type="button" onClick={handlePrevStep} className="toggle-btn" style={{ flex: 1 }}>
                                        &larr; Quay lại
                                    </button>
                                )}
                                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                                    {isRegisterFlow ? "Hoàn tất Đăng ký" : isForgotPasswordFlow ? "Đổi mật khẩu" : "Xác nhận OTP"}
                                </button>
                            </div>
                        </div>
                    )}

                </form>

                <div style={{marginTop: "15px", textAlign: "center"}}>
                     <button
                        onClick={() => navigate("/login")}
                        className="toggle-btn"
                        style={{ fontSize: "0.9rem", color: "#666" }}
                    >
                        Hủy bỏ
                    </button>
                </div>
            </div>
        </main>
    );
}
