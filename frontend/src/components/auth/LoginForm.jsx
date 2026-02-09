import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router";
import "./LoginForm.css";
export function LoginForm() {
  const navigate = useNavigate();


  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
  };
  const handleAuth_register = async(e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.warning("Thiếu thông tin", { description: "Vui lòng điền đầy đủ thông tin", style: toastStyles.warning });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Đăng ký thất bại", { description: "Mật khẩu không khớp", style: toastStyles.error });
      return;
    }
    try{
      const response = await fetch('http://localhost:5001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({email, password}),
      });
      const data = await response.json();
      if(response.ok){
        console.log("Registration successful:", data);
      setTimeout(() => {
          navigate("/login"); 
      }, 3000);
        toast.success("Đăng ký thành công", { style: toastStyles.success });
     

      }
      else{
        console.log("Registration failed:", data);
        const errorData = await response.json();
        toast.error("Đăng ký thất bại", { description: errorData.message || "Có lỗi xảy ra", style: toastStyles.error });
      }
    }catch(err){
      console.error("Registration error:", err);
    }
  }
  const handleAuth_login = async (e) => {
  e.preventDefault();

  if (!email.trim() || !password.trim()) {
    toast.warning("Thiếu thông tin", {
      description: "Vui lòng điền đầy đủ thông tin",
      style: toastStyles.warning
    });
    return;
  }

  try {
    const response = await fetch('http://localhost:5001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Login successful:", data);

      if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
      }

      toast.success("Đăng nhập thành công", { style: toastStyles.success });

    

      setTimeout(() => {
          navigate("/"); 
      }, 1500);

    } else {
   
      console.log("Login failed response:", data);
      
      const errorMessage = data.message || (typeof data === 'string' ? data : "Email hoặc mật khẩu không đúng");
      
      toast.error("Đăng nhập thất bại", {
        description: errorMessage,
        style: toastStyles.error
      });
    }

  } catch (err) {
    console.error("Network error:", err);
    toast.error("Lỗi kết nối", {
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        style: toastStyles.error
    });
  }
};

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setEmail(""); setPassword(""); setConfirmPassword("");
  };

  const handleAuth = (e) => {
    if (mode === "login") {
      handleAuth_login(e);
    } else {
      handleAuth_register(e);
    }
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

          
          {mode === "login" ? (
            <button 
            onClick={handleAuth_login}
            type="submit" 
            className="submit-btn">
            Đăng Nhập 
          </button>
          ) : (
             <button 
            onClick={handleAuth_register}
            type="submit" 
            className="submit-btn">
            Đăng ký tài khoản 
          </button>
          )}
        </form>

        <button onClick={toggleMode} className="toggle-btn">
          {mode === "login" ? "Đăng ký tài khoản mới" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
    </main>
  );
}