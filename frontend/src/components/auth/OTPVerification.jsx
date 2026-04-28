import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import {
    ChevronLeft,
    User,
    ShieldCheck,
    Mail,
    ArrowRight,
    Smartphone,
    MapPin
} from "lucide-react";
import "./OTPVerification.css";

export function OTPVerification() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy dữ liệu từ route state
    const { email: initialEmail, flow, userData } = location.state || {};

    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Info, Step 2: Security, Step 3: OTP
    const [currentStep, setCurrentStep] = useState(1);

    const isRegisterFlow = flow === "register";
    const isLoginFlow = flow === "login";
    const isForgotPasswordFlow = flow === "forgot-password";

    // Chặn truy cập trái phép
    if (!initialEmail) {
        return (
            <main className="welcome-container">
                <div className="auth-card">
                    <h2 className="auth-title">Phiên hết hạn</h2>
                    <p className="auth-subtitle">Vui lòng quay lại trang đăng nhập.</p>
                    <button onClick={() => navigate("/login")} className="submit-btn">Quay lại</button>
                </div>
            </main>
        );
    }

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);

        let targetEndpoint = "";
        let requestBody = {};

        if (isRegisterFlow) {
            targetEndpoint = "http://localhost:8081/identity/auth/register/verify-otp";
            requestBody = { email: initialEmail, otp: otp.trim(), password, name, phoneNumber, address };
        } else if (isLoginFlow) {
            targetEndpoint = "http://localhost:8081/identity/auth/login/verify-otp";
            requestBody = { email: initialEmail, otp: otp.trim() };
        } else if (isForgotPasswordFlow) {
            targetEndpoint = "http://localhost:8081/identity/auth/reset-password";
            requestBody = { email: initialEmail, otp: otp.trim(), password };
        }

        try {
            const res = await fetch(targetEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Xác thực không thành công");

            toast.success("Xác thực thành công!");

            setTimeout(() => {
                if (isRegisterFlow || isForgotPasswordFlow) {
                    navigate("/login");
                } else if (isLoginFlow) {
                    const finalUser = data.result || userData;
                    if (finalUser) login(finalUser);
                    const role = finalUser?.role?.toUpperCase();
                    navigate(role === 'ADMIN' ? "/admin" : role === 'RECRUITER' ? "/recruiter" : "/");
                }
            }, 1500);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 1 && (!name || !phoneNumber || !address)) {
            return toast.warning("Vui lòng điền đủ thông tin cá intelligence");
        }
        if (currentStep === 2 && (!password || password !== confirmPassword)) {
            return toast.warning("Mật khẩu không khớp");
        }
        setCurrentStep(prev => prev + 1);
    };

    return (
        <main className="welcome-container">
            <button className="btn-back-nav" onClick={() => navigate(-1)}>
                <ChevronLeft size={18} /> Quay lại
            </button>

            <div className="auth-card">
                <h1 className="auth-title">
                    {isRegisterFlow ? "Hoàn tất hồ sơ" : isForgotPasswordFlow ? "Đặt lại mật khẩu" : "Xác thực OTP"}
                </h1>

                {/* Stepper dành cho Đăng ký */}
                {isRegisterFlow && (
                    <div className="stepper-container">
                        <div className={`step-item ${currentStep >= 1 ? 'active' : ''}`}><User size={16}/></div>
                        <div className="step-line"></div>
                        <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}><ShieldCheck size={16}/></div>
                        <div className="step-line"></div>
                        <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}><Mail size={16}/></div>
                    </div>
                )}

                <p className="auth-subtitle">
                    {currentStep === 3 || !isRegisterFlow
                        ? <>Mã OTP đã được gửi tới <strong>{initialEmail}</strong></>
                        : "Vui lòng hoàn thiện các bước cuối cùng."}
                </p>

                <div className="auth-form-wrapper">
                    {/* BƯỚC 1: THÔNG TIN (Chỉ cho Register) */}
                    {isRegisterFlow && currentStep === 1 && (
                        <div className="step-content animate-in">
                            <div className="form-group">
                                <label>Họ và Tên</label>
                                <div className="input-with-icon">
                                    <User className="input-icon" size={18} />
                                    <input type="text" placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <div className="input-with-icon">
                                    <Smartphone className="input-icon" size={18} />
                                    <input type="tel" placeholder="09xxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g,''))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <div className="input-with-icon">
                                    <MapPin className="input-icon" size={18} />
                                    <input type="text" placeholder="TP. Đà Nẵng" value={address} onChange={(e) => setAddress(e.target.value)} />
                                </div>
                            </div>
                            <button onClick={nextStep} className="submit-btn">Tiếp tục <ArrowRight size={18}/></button>
                        </div>
                    )}

                    {/* BƯỚC 2: MẬT KHẨU (Cho Register & Forgot Password) */}
                    {((isRegisterFlow && currentStep === 2) || isForgotPasswordFlow) && (
                        <div className="step-content animate-in">
                            <div className="form-group">
                                <label>Mật khẩu mới</label>
                                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu</label>
                                <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </div>
                            {isRegisterFlow ? (
                                <div className="btn-group-dual">
                                    <button onClick={() => setCurrentStep(1)} className="btn-ghost">Quay lại</button>
                                    <button onClick={nextStep} className="submit-btn" style={{ width: '65%' }}>Tiếp tục</button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* BƯỚC 3: OTP (Luồng cuối cùng) */}
                    {((isRegisterFlow && currentStep === 3) || isLoginFlow || isForgotPasswordFlow) && (
                        <div className="step-content animate-in">
                            <div className="form-group otp-group">
                                <label className="label-center">Mã xác thực 6 số</label>
                                <input
                                    className="otp-input"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                            <div className="btn-group-dual">
                                {isRegisterFlow && <button onClick={() => setCurrentStep(2)} className="btn-ghost">Quay lại</button>}
                                <button onClick={handleVerify} className="submit-btn" disabled={isLoading}style={{width: '65%'}} >
                                    {isLoading ? "Đang xác thực..." : isRegisterFlow ? "Hoàn tất" : "Xác nhận"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={() => navigate("/login")} className="toggle-btn">Hủy bỏ</button>
            </div>
        </main>
    );
}