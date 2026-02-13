import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; 
import { useAuth } from "../../context/AuthContext";

function OAuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log("Dữ liệu nhận được từ URL:", window.location.search);
    const error = params.get("error");
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const nameFromGoogle = params.get("name");
    if (error) {
      
      toast.error("Lỗi đăng nhập", {
        description: decodeURIComponent(error),
      });
      
      navigate("/login");
      return;
    }

if (accessToken) {
    const userData = {
        accessToken: accessToken,
        refreshToken: refreshToken,
        name: nameFromGoogle ? decodeURIComponent(nameFromGoogle) : "Google User"
    };

    login(userData); 
    
    toast.success("Đăng nhập thành công!");
    
    setTimeout(() => {
        navigate("/");
    }, 100);
} else {
      navigate("/login");
    }
  }, [navigate, login]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Đang xác thực tài khoản...</p>
    </div>
  );
}

export default OAuthSuccess;