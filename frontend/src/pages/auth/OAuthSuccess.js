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
    const message = params.get("message");

    console.log("Error parameter:", error);
    console.log("Message parameter:", message);

    if (error || message) {
      const errorMessage = message ? decodeURIComponent(message) : "Đã xảy ra lỗi không xác định.";
      console.log("Error from URL:", errorMessage);
      toast.error("Lỗi đăng nhập", {
        description: errorMessage,
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const nameFromGoogle = params.get("name");

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