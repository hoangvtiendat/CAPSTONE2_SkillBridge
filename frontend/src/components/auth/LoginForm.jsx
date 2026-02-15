import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css";
import { useAuth } from "../../context/AuthContext";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register_Google = () => {
  window.location.href = "http://localhost:8081/identity/oauth2/authorization/google";
  }

  const handleRegister = async (e) => {
  setIsLoading(true);
  if (!email.trim()) {
    toast.warning("Thiếu thông tin");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8081/identity/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );
    const data = await response.json();

    if (!response.ok) {

      toast.error(data.message || "Đăng ký thất bại");

      if (data.code === 2004) {
         console.log("Xử lý riêng cho lỗi trùng email ở đây");
      }
      return;
    }
    console.log("Register Response:", data);
    toast.success(data.result); 
    setTimeout(() => {
      navigate("/otp-verification", {
        state: {
          flow: "register",
          email: email, 
        }
      });
    }, 3000);

  } catch (err) {
    console.error(err);
    toast.error("Không thể kết nối backend");
  }
    finally {
    setIsLoading(false);
    }
};

const login_Google = () => {
    window.location.href = "http://localhost:8081/identity/oauth2/authorization/google";

}
  const handleLogin = async () => {
    setIsLoading(true); // Set loading state to true

    if (!email.trim() || !password.trim()) {
        toast.warning("Thiếu thông tin", { description: "Vui lòng điền email và mật khẩu" });
        setIsLoading(false); // Reset loading state
        return;
    }

    try {
        const response = await fetch("http://localhost:8081/identity/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        console.log("Login Response:", data);
        if (response.ok && data.result) {
            const userData = data.result;

            if (userData.is2faEnabled === "1") {
                toast.success("Yêu cầu xác thực 2 bước", { description: "Chuyển đến trang xác thực OTP" });
                setTimeout(() => {
                    navigate("/otp-verification", {
                        state: {
                            email: email,
                            flow: "login",
                            userData: userData
                        }
                    });
                }, 1000);
            } else {
                login(userData);
                toast.success("Đăng nhập thành công");
                setTimeout(() => { navigate("/"); }, 1000);
            }

        } else {
            throw new Error(data.message || "Email hoặc mật khẩu không đúng");
        }

    } catch (err) {
        console.error("Login error:", err);
        toast.error("Đăng nhập thất bại", { description: err.message });
    } finally {
        setIsLoading(false); // Reset loading state
    }
};
  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      handleLogin();
    } else {
      handleRegister();
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

        <button className="google-btn" type="button" onClick={mode === "login" ? login_Google : register_Google}>
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