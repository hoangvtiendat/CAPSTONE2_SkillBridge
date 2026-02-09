import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom"; // Fixed import for react-router-dom
import "./ResetPass.css";

export function ResetPass() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!password.trim() || !confirmPassword.trim()) {
        toast.warning("Thiếu thông tin", { description: "Vui lòng điền đầy đủ thông tin", style: toastStyles.warning });
        return;
    }

    if (password !== confirmPassword) {
        toast.error("Mật khẩu không khớp", { description: "Vui lòng kiểm tra lại mật khẩu", style: toastStyles.error });
        return;
    }

    try {

        const response = await fetch('http://localhost:5001/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        });

        const data = await response.json();

        if (response.ok) {
            toast.success("Đặt lại mật khẩu thành công", { description: "Bạn có thể đăng nhập với mật khẩu mới", style: toastStyles.success });
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } else {
            console.error("Password reset failed:", data);
            toast.error("Đặt lại mật khẩu thất bại", { description: data.message || "Có lỗi xảy ra", style: toastStyles.error });
        }
    } catch (err) {
        console.error("Error resetting password:", err);
        toast.error("Đặt lại mật khẩu thất bại", { description: "Có lỗi xảy ra", style: toastStyles.error });
    }
};

return (
        <main className="welcome-container">
          <Toaster position="top-right" richColors />
             <div className="resetPass-container">

        <div className="header_pass">
            <h1>Đặt lại mật khẩu</h1>
        </div>
        <form onSubmit={handleSubmit} className="form-container">
            <label htmlFor="password">Mật khẩu</label>
            <input
                id="password"
                type="password"
                placeholder="Vui lòng nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
                id="confirmPassword"
                type="password"
                placeholder="Xác nhận lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit" className="Button_submit">Đặt lại mật khẩu</button>
        </form>
    </div>
        </main>
 
);
}