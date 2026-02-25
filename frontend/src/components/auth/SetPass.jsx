import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import "./SetPass.css";

export function SetPass() {
    const navigate = useNavigate();
    const location = useLocation();

    const { email, flow } = location.state || {};

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (!email || !flow) {
            navigate("/login");
        }
    }, [email, flow, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.warning("Thiếu thông tin", {
                description: "Vui lòng nhập đầy đủ mật khẩu",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Mật khẩu không khớp", {
                description: "Vui lòng kiểm tra lại",
            });
            return;
        }

        if (flow === "register") {
            toast.success("Tạo mật khẩu thành công", {
                description: "Vui lòng bổ sung thông tin cá nhân",
            });

            setTimeout(() => {
                navigate("/auth/complete-profile", {
                    state: {
                        email,
                        password,
                    },
                });
            }, 1000);

            return;
        }

        try {
            const res = await fetch(
                `http://localhost:3001/Users?email=${email}`
            );
            const users = await res.json();

            if (!users.length) {
                toast.error("Không tìm thấy tài khoản");
                return;
            }

            const userId = users[0].id;

            const updateRes = await fetch(
                `http://localhost:3001/Users/${userId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        password,
                        two_fa_enabled: false,
                    }),
                }
            );

            if (!updateRes.ok) throw new Error();

            toast.success("Đổi mật khẩu thành công", {
                description: "Vui lòng đăng nhập lại",
            });

            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            toast.error("Có lỗi xảy ra", {
                description: "Vui lòng thử lại",
            });
        }
    };

    return (
        <main className="welcome-container">


            <div className="auth-card">
                <h1 className="auth-title">
                    {flow === "register"
                        ? "Tạo mật khẩu"
                        : "Đặt lại mật khẩu"}
                </h1>

                <p style={{ marginBottom: 20, color: "#666" }}>
                    Nhập mật khẩu cho tài khoản <b>{email}</b>
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        {flow === "register"
                            ? "Tiếp tục"
                            : "Đổi mật khẩu"}
                    </button>
                </form>
            </div>
        </main>
    );
}
