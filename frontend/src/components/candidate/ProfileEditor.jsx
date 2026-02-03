import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router";
import { KeyRound, ArrowLeft } from "lucide-react"; 
import { faker } from '@faker-js/faker'; 
import "./ProfileEditor.css";
export function ProfileEditor() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("aboutMe");
    const [Full_name, setFull_name] = useState("");
    const [Email, setEmail] = useState("");
    const [Phone_number, setPhone_number] = useState("");
    const [area, setArea] = useState("");
    const [description, setDescription] = useState("");
    const [avatar, setAvatar] = useState("https://via.placeholder.com/150");
    const [status, setStatus] = useState(true);
    const [protect_card, setProtect_card] = useState(false);

    const toastStyles = {
        warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
        success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
        error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
    };
    
    const fetchProfile = async () => {
        try {
            const response = await fetch("http://localhost:5001/candidate/profile");
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            
            setFull_name(data.Full_name || ""); 
            setEmail(data.Email || "");
            setPhone_number(data.Phone_number || "");
            setArea(data.area || "");
            setStatus(data.status ?? true); 
            setDescription(data.description || "");
            setAvatar(data.avatar || faker.image.avatar());
            setProtect_card(data.protect_card ?? false);
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const toggleMode = () => {
        setMode(mode === "aboutMe" ? "CV_writing_language" : "aboutMe");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!Full_name.trim() || !Email.trim() || !Phone_number.trim() || !area.trim()) {
            toast.warning("Thiếu thông tin", { description: "Vui lòng điền đầy đủ", style: toastStyles.warning });
            return;
        }
        try {
            const response = await fetch("http://localhost:5001/candidate/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Full_name, Email, Phone_number, area, description, avatar, status, protect_card
                }),
            });
            if (!response.ok) throw new Error("Update failed");
            toast.success("Cập nhật thành công", { style: toastStyles.success });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Cập nhật thất bại", { style: toastStyles.error });
        }
    };

    return (
        <main className="profile-container">
            <Toaster position="top-right" richColors />
            {mode === "aboutMe" ? (
                <div> 
                    <div className="Avatar_profile">
                        <img src={avatar} alt="Avatar" className="avatar-image" />
                        <button className="change-avatar-btn">Thay đổi ảnh đại diện</button>    
                        <div className="set_upStatus">
                            <button 
                                type="button"
                                onClick={() => setStatus(!status)} 
                                className={status ? "btn-active" : "btn-inactive"}
                            >
                                {status ? "Đang Công Khai" : "Đang Ẩn"}
                            </button>                
                        </div>
                    </div>

                    <div className="protect_card">
                        <label className="labe_protect">
                           <h1 className="text_protect_card">Bảo vệ thẻ cá nhân</h1>
                        </label>
                        <button
                            type="button"
                            onClick={() => setProtect_card(!protect_card)}
                            className={protect_card ? "btn-active" : "btn-inactive"}
                        >
                            {protect_card ? "Bảo vệ thẻ" : "Không bảo vệ thẻ"}
                        </button>
                        <div className="set-new-pass">
                            <button type="button" onClick={() => navigate("/forgot-password")}>
                                Đặt lại mật khẩu
                            </button>
                        </div>
                    </div>

                    <div className="in4_card">
                        <div className="form-group">
                            <label>Họ và tên</label>
                            <input type="text" value={Full_name} onChange={(e) => setFull_name(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={Email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input type="text" value={Phone_number} onChange={(e) => setPhone_number(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Khu vực</label>
                            <input type="text" value={area} onChange={(e) => setArea(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Giới thiệu bản thân</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                        </div>
                    </div>
                </div> 
            ) : (
                <div className="CV_writing_language">
                    <div className="Complete_the_level"></div>
                    <div className="CVAnalysisCard"></div>
                    <div className="in4_card_of_CV"></div>
                </div>
            )}
            
            <button type="button" className="submit-btn" onClick={handleSubmit}>
                {mode === "aboutMe" ? "Lưu thay đổi" : "Cập nhật CV"}
            </button>
            <button type="button" onClick={toggleMode} className="toggle-btn">
                {mode === "aboutMe" ? "Chuyển sang CV" : "Hồ sơ cá nhân"}
            </button> 
        </main>
    );
}