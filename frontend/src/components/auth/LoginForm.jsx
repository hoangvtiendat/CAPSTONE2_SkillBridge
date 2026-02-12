import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router";
import "./LoginForm.css";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/api/authService";

export function LoginForm() {
  const navigate = useNavigate();
  const { login, fetchProfile } = useAuth(); // Destructure fetchProfile

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
        const response = await authService.login(email, password);

        if (response && response.result) {
          const { is2faEnabled, accessToken } = response.result;

          if (String(is2faEnabled) === "1" || is2faEnabled === true) { // Handle both string "1" or boolean from backend if it changes
            toast.info("Yêu cầu xác thực 2FA", { description: "Vui lòng nhập mã OTP" });
            // Pass email to OTP page. userData might not be fully available yet if 2FA is on depending on backend flow, 
            // but we need email for verify-otp endpoint.
            navigate("/otp-verification", { state: { email: email } });
          } else {
            // Standard Login
            if (accessToken) {
              localStorage.setItem('token', accessToken);
              // Retrieve full profile
              await fetchProfile();
              toast.success("Đăng nhập thành công", { style: toastStyles.success });
              navigate("/");
            } else {
              toast.error("Lỗi đăng nhập", { description: "Không nhận được token" });
            }
          }
        }
      } catch (error) {
        console.error("Login error:", error);
        // Handle specific error codes if available in error object (e.g. error.response.data.code)
        toast.error("Đăng nhập thất bại", { description: error.response?.data?.message || "Email hoặc mật khẩu không đúng", style: toastStyles.error });
      }
    } else {
      // REGISTER
      if (password !== confirmPassword) {
        toast.error("Đăng ký thất bại", { description: "Mật khẩu không khớp", style: toastStyles.error });
        return;
      }
      try {
        await authService.register({ email, password, name: email.split('@')[0], role: "CANDIDATE" }); // Simple default mapping
        toast.success("Đăng ký thành công", { description: "Vui lòng kiểm tra email để xác thực", style: toastStyles.success });
        setMode("login");
      } catch (error) {
        console.error("Register error:", error);
        toast.error("Đăng ký thất bại", { description: error.response?.data?.message || "Lỗi hệ thống" });
      }
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