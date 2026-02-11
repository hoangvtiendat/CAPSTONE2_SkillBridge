import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router";
import "./LoginForm.css";
import { useAuth } from "../../context/AuthContext";
export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const mock_email = "quctonnn@gmail.com";
  const mock_password = "12345678";

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (mode === "register" && !confirmPassword.trim())) {
      toast.warning("Thiếu thông tin", { description: "Vui lòng điền đầy đủ thông tin", style: toastStyles.warning });
      return;
    }

    if (mode === "login") {
      try {
        const response = await fetch(`http://localhost:3001/Users?email=${email}&password=${password}`);
        const users = await response.json();

        if (users.length > 0) {
          const user = users[0];
          if (user.two_fa_enabled) {
            toast.info("Yêu cầu xác thực 2FA", { description: "Vui lòng nhập mã OTP" });
            navigate("/otp-verification", { state: { email: user.email, userData: user } }); // Pass userData
          } else {
            login(user); // Use context login
            toast.success("Đăng nhập thành công", { style: toastStyles.success });
            navigate("/");
          }
        } else {
          toast.error("Đăng nhập thất bại", { description: "Email hoặc mật khẩu không đúng", style: toastStyles.error });
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Lỗi kết nối", { description: "Không thể kết nối đến server" });
      }
    } else {
      if (password !== confirmPassword) {
        toast.error("Đăng ký thất bại", { description: "Mật khẩu không khớp", style: toastStyles.error });
        return;
      }
      toast.success("Đăng ký thành công", { style: toastStyles.success });
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setEmail(""); setPassword(""); setConfirmPassword("");
  };

  return (
    <main className="welcome-container">
      <Toaster position="top-right" richColors />
      <div className="auth-card">
        <h1 className="auth-title">
          {mode === "login" ? "Đăng nhập hệ thống" : "Đăng ký tài khoản"}
        </h1>

        <button className="google-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          {mode === "login" ? "Đăng nhập với Google" : "Đăng ký với Google"}
        </button>

        <div className="divider">
          <span>HOẶC</span>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="nguyenvan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {mode === "login" && (
            <div className="forgot-link">
              <button type="button" onClick={() => navigate("/forgot-password")}>
                Quên mật khẩu?
              </button>
            </div>
          )}

          <button type="submit" className="submit-btn">
            {mode === "login" ? "Đăng Nhập" : "Tạo tài khoản"}
          </button>
        </form>

        <button onClick={toggleMode} className="toggle-btn">
          {mode === "login" ? "Đăng ký tài khoản mới" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
    </main>
  );
}