import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom"; // Sửa lại import đúng
import "./LoginForm.css";
import { useAuth } from "../../context/AuthContext";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState("login"); // 'login' hoặc 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() ){
      toast.warning("Thiếu thông tin", { description: "Vui lòng nhập email và mật khẩu", style: toastStyles.warning });
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/auth/register", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      toast.success("Đăng ký thành công", { description: "Vui lòng xác thực OTP", style: toastStyles.success });

      setTimeout(() => {
        navigate("/otp-verification", {
          state: { flow: "register", email: email },
        });
      }, 1000);

    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Lỗi đăng ký", { description: err.message, style: toastStyles.error });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.warning("Thiếu thông tin", {
        description: "Vui lòng điền đầy đủ thông tin",
        style: toastStyles.warning
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
      
        console.log("Thông tin đăng nhập đúng, chuyển sang bước OTP...");

        toast.success("Xác thực tài khoản thành công", { 
          description: "Vui lòng nhập mã OTP đã được gửi về email.",
          style: toastStyles.success 
        });

        setTimeout(() => {
          navigate("/otp-verification", { 
            state: { 
              email: email,      
              flow: "login"       
            } 
          }); 
        }, 1500);

      } else {
        console.log("Login failed response:", data);
        const errorMessage = data.message || "Email hoặc mật khẩu không đúng";
        
        toast.error("Đăng nhập thất bại", {
          description: errorMessage,
          style: toastStyles.error
        });
      }

    } catch (err) {
      console.error("Network error:", err);
      toast.error("Lỗi kết nối", {
          description: "Không thể kết nối đến máy chủ.",
          style: toastStyles.error
      });
    }
  };

  const handleSubmit = (e) => {
    if (mode === "login") {
      handleLogin(e);
    } else {
      handleRegister(e);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setEmail(""); 
    setPassword(""); 
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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="nguyenvan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode === "login" && (
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder={mode === "register" ? "Tạo mật khẩu" : "Nhập mật khẩu"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {mode === "login" ? "Đăng Nhập" : "Đăng ký tài khoản"}
          </button>
        </form>

        <button onClick={toggleMode} className="toggle-btn">
          {mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
    </main>
  );
}