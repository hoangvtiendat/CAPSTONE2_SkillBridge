import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, ChevronLeft } from 'lucide-react'; // Thêm icon để đồng bộ
import "./SetPass.css";

export function SetPass() {
    const navigate = useNavigate();
    const location = useLocation();

    const { email, flow } = location.state || {};

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!email || !flow) {
            navigate("/login");
        }
    }, [email, flow, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.warning("Vui lòng nhập đầy đủ mật khẩu");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Mật khẩu không khớp", {
                description: "Vui lòng kiểm tra lại ô xác nhận",
            });
            return;
        }

        setIsLoading(true);

        if (flow === "register") {
            toast.success("Mật khẩu hợp lệ", {
                description: "Tiếp tục hoàn thiện hồ sơ của bạn",
            });

            setTimeout(() => {
                navigate("/auth/complete-profile", {
                    state: { email, password },
                });
            }, 1000);
            return;
        }

        try {
            // Giả định API endpoint của bạn
            const res = await fetch(`http://localhost:3001/Users?email=${email}`);
            const users = await res.json();

            if (!users.length) {
                toast.error("Không tìm thấy tài khoản");
                return;
            }

            const userId = users[0].id;

            const updateRes = await fetch(`http://localhost:3001/Users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password,
                    two_fa_enabled: false,
                }),
            });

            if (!updateRes.ok) throw new Error();

            toast.success("Đặt lại mật khẩu thành công", {
                description: "Hệ thống đang chuyển bạn về trang đăng nhập",
            });

            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            toast.error("Lỗi hệ thống", { description: "Vui lòng thử lại sau" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="welcome-container">
            {/* Nút quay lại kiểu Glass */}
            <button className="btn-back-nav" onClick={() => navigate(-1)}>
                <ChevronLeft size={18} /> Quay lại
            </button>

            <div className="auth-card">
                <div className="auth-header-icon">
                    <Lock size={32} strokeWidth={1.5} />
                </div>

                <h1 className="auth-title">
                    {flow === "register" ? "Tạo mật khẩu" : "Đặt lại mật khẩu"}
                </h1>

                <p className="auth-subtitle">
                    Thiết lập bảo mật cho tài khoản <br/>
                    <strong>{email}</strong>
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Mật khẩu mới</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? "Đang xử lý..." : flow === "register" ? "Tiếp tục" : "Cập nhật mật khẩu"}
                    </button>
                </form>
            </div>
        </main>
    );
}