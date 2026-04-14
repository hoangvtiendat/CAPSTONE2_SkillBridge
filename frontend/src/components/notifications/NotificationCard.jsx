import React from "react";
import {
  Bell,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import "./NotificationCard.css";
import { toast } from "sonner";
import DOMPurify from 'dompurify';

const NotificationCard = ({
  title,
  content,
  link,
  navigate,
  t,
  type = "info",
}) => {
  // 1. Cấu hình các loại thông báo
  const config = {
    success: {
      icon: <CheckCircle size={18} />,
      class: "notif-green",
      tag: "Thành công",
      bg: "bg-green",
    },
    error: {
      icon: <AlertCircle size={18} />,
      class: "notif-red",
      tag: "Lỗi hệ thống",
      bg: "bg-red",
    },
    warning: {
      icon: <AlertTriangle size={18} />,
      class: "notif-yellow",
      tag: "Cảnh báo",
      bg: "bg-yellow",
    },
    info: {
      icon: <Bell size={18} />,
      class: "notif-blue",
      tag: "Thông báo",
      bg: "bg-blue",
    },
  };

  // 2. Tự động nhận diện nếu là thông báo "Từ chối" từ Server (giữ logic cũ của ông)
  const isRejected =
    content?.toLowerCase().includes("từ chối") ||
    content?.toLowerCase().includes("không phù hợp");

  // 3. Chọn config hiện tại (Nếu là Rejected thì ép về màu đỏ)
  const currentStatus = isRejected ? config.error : config[type] || config.info;

  return (
    <div className={`sb-notification-card ${currentStatus.class}`}>
      <div className="sb-notif-icon">
        <div className={`icon-inner ${currentStatus.bg}`}>
          {currentStatus.icon}
        </div>
      </div>

      <div className="sb-notif-body">
        <div className="sb-notif-header">
          <span className="sb-notif-source">
            {title ? "Hệ thống SkillBridge" : currentStatus.tag}
          </span>
          <button className="sb-notif-close" onClick={() => toast.dismiss(t)}>
            <X size={16} />
          </button>
        </div>

        <h4 className="sb-notif-title">{title || currentStatus.tag}</h4>
        {/* <p className="sb-notif-text">{content}</p> */}
        <p
          className="sb-notif-text"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />

        {link && navigate && (
          <button
            className="sb-notif-btn"
            onClick={() => {
              navigate(link);
              toast.dismiss(t);
            }}
          >
            Xem chi tiết <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
