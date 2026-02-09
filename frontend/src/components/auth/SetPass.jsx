import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import "./SetPass.css";


export function SetPass() {
    const navigate = useNavigate();
    const location = useLocation();
    const { email } = location.state || {};

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [region, setRegion] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fullName || !phone || !region) {
            toast.warning("Thiếu thông tin", {
                description: "Vui lòng điền đầy đủ thông tin",
            });
            return;
        }

        try {
            const res = await fetch("http://localhost:3001/auth/complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    fullName,
                    phone,
                    region,
                }),
            });

            if (!res.ok) throw new Error("Lỗi lưu thông tin");

            toast.success("Hoàn tất đăng ký", {
                description: "Bạn có thể đăng nhập ngay",
            });

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (err) {
            toast.error("Thất bại", {
                description: err.message,
            });
        }
    };

    return (
        <main className="welcome-container">
            <Toaster position="top-right" richColors />

            <div className="auth-card">
                <h1 className="auth-title">Hoàn thiện thông tin</h1>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Họ và tên</label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Số điện thoại</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Khu vực</label>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                        >
                            <option value="">-- Chọn khu vực --</option>
                            <option value="HN">Hà Nội</option>
                            <option value="HCM">TP.HCM</option>
                            <option value="DN">Đà Nẵng</option>
                        </select>
                    </div>

                    <button type="submit" className="submit-btn">
                        Hoàn tất
                    </button>
                </form>
            </div>
        </main>
    );
}