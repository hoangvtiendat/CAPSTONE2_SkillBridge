import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./LoginForm.css";
import { API_BASE_URL } from "../../config/appConfig";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" hoặc "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. Xử lý lỗi từ URL (OAuth2 redirect error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const message = params.get("message");

    if (error && message) {
      toast.error("Lỗi đăng nhập", { description: decodeURIComponent(message) });
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // 2. Google OAuth Redirect
  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  // 3. Xử lý Đăng ký (Chỉ gửi Email)
  const handleRegister = async () => {
    if (!email.trim()) {
      toast.warning("Vui lòng nhập Email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }) // Không gửi password theo yêu cầu của bạn
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Đăng ký thất bại");

      toast.success("Thành công", { description: data.result });
      setTimeout(() => {
        navigate("/otp-verification", { state: { flow: "register", email } });
      }, 2000);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Xử lý Đăng nhập
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.warning("Thiếu thông tin đăng nhập");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.result) {
        const userData = data.result;

        if (userData.is2faEnabled === "1") {
          toast.info("Yêu cầu 2FA", { description: "Đang chuyển đến trang xác thực..." });
          navigate("/otp-verification", { state: { email, flow: "login", userData } });
        } else {
          login(userData);
          toast.success("Đăng nhập thành công");
          const target = userData.role === 'ADMIN' ? "/admin" : userData.role === 'RECRUITER' ? "/recruiter" : "/";
          setTimeout(() => navigate(target), 1000);
        }
      } else {
        throw new Error(data.message || "Email hoặc mật khẩu không đúng");
      }
    } catch (err) {
      toast.error("Thất bại", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mode === "login" ? handleLogin() : handleRegister();
  };

  const toggleMode = () => {
    setMode(prev => prev === "login" ? "register" : "login");
    setEmail("");
    setPassword("");
  };

  return (
      <main className="welcome-container">
        <div className="auth-card">
          <h1 className="auth-title">
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </h1>

          <button className="google-btn" type="button" onClick={handleGoogleAuth}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google icon" />
            <span>{mode === "login" ? "Tiếp tục với Google" : "Đăng ký bằng Google"}</span>
          </button>

          <div className="divider">
            <span>HOẶC</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
              />
            </div>

            {/* Chỉ hiện Mật khẩu khi Login */}
            {mode === "login" && (
                <>
                  <div className="form-group">
                    <label>Mật khẩu</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                  </div>
                  <div className="forgot-link">
                    <button type="button" onClick={() => navigate("/forgot-password")}>
                      Quên mật khẩu?
                    </button>
                  </div>
                </>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <button onClick={toggleMode} className="toggle-btn">
            {mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>
      </main>
  );
}