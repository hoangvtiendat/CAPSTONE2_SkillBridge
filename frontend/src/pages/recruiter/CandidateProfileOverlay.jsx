import React from 'react';
import { X, Mail, Phone, MapPin, Briefcase, GraduationCap, ShieldCheck, User, Star, Calendar, Zap, Link as LinkIcon } from 'lucide-react';
import './CandidateProfileOverlay.css';

const CandidateProfileOverlay = ({ candidateData, isInvited, onClose }) => {
    // Nếu không có dữ liệu thì không hiển thị
    if (!candidateData) return null;

    /**
     * Hàm ẩn thông tin khi chưa gửi lời mời
     */
    const maskInfo = (info, type) => {
        if (!info) return "Chưa cập nhật";
        if (isInvited) return info; // Đã mời thì hiện full thông tin

        if (type === 'email') {
            const [name, domain] = info.split('@');
            return `${name[0]}••••@${domain}`;
        }
        if (type === 'phone') {
            return `${info.slice(0, 3)}••••${info.slice(-2)}`;
        }
        // Địa chỉ: Ẩn hoàn toàn bằng dãy dấu chấm
        return "••••••••••••••••••••";
    };

    const matchScore = ((candidateData.aiMatchingScore || 0) * 100).toFixed(0);

    return (
        <div className="profile-overlay-backdrop" onClick={onClose}>
            <div className="profile-bubble-content" onClick={e => e.stopPropagation()}>
                {/* Nút đóng góc trên bên phải */}
                <button className="close-bubble-btn" onClick={onClose} aria-label="Close">
                    <X size={18} />
                </button>

                <div className="bubble-scroll-area">

                    {/* 1. BONG BÓNG LIÊN KẾT JOB (BUBBLE LINK) */}
                    <div className="job-connection-bubble">
                        <div className="bubble-pulse"></div>
                        <LinkIcon size={14} />
                        <span>Phù hợp cho: <strong>{candidateData.category || "Vị trí đang tuyển"}</strong></span>
                    </div>

                    {/* 2. HEADER SECTION (Đã xóa chữ PRO) */}
                    <header className="premium-header">
                        <div className="avatar-section">
                            <div className="main-avatar-ring">
                                {candidateData.avatar ?
                                    <img src={candidateData.avatar} alt={candidateData.name} /> :
                                    <div className="avatar-alt"><User size={32} /></div>
                                }
                                <div className="score-float-badge">
                                    {matchScore}%
                                </div>
                            </div>
                        </div>

                        <div className="header-text-info">
                            <h2>{candidateData.name}</h2>
                            <div className="status-row">
                                <ShieldCheck size={14} className="verified-icon" />
                                <span className="category-label">Hồ sơ đã xác thực bởi AI</span>
                            </div>
                        </div>
                    </header>

                    {/* 3. CONTACT INFO GRID (Địa chỉ được ẩn bằng mask) */}
                    <div className="modern-info-grid">
                        <div className="contact-item">
                            <div className="c-icon blue"><Mail size={14} /></div>
                            <div className="c-text">
                                <label>Email</label>
                                <p>{maskInfo(candidateData.email, 'email')}</p>
                            </div>
                        </div>
                        <div className="contact-item">
                            <div className="c-icon green"><Phone size={14} /></div>
                            <div className="c-text">
                                <label>Điện thoại</label>
                                <p>{maskInfo(candidateData.phoneNumber, 'phone')}</p>
                            </div>
                        </div>
                        <div className="contact-item full">
                            <div className="c-icon orange"><MapPin size={14} /></div>
                            <div className="c-text">
                                <label>Địa chỉ</label>
                                <p className={!isInvited ? "masked-text" : ""}>
                                    {maskInfo(candidateData.address, 'address')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isInvited && (
                        <div className="premium-unlock-bar">
                            <Zap size={14} fill="currentColor" />
                            <span>Mời ứng tuyển để xem đầy đủ thông tin liên hệ</span>
                        </div>
                    )}

                    {/* 4. GIỚI THIỆU */}
                    <div className="content-card">
                        <h4 className="card-title"><Star size={14} /> Giới thiệu</h4>
                        <p className="bio-text">
                            {candidateData.description || "Ứng viên chưa cập nhật phần giới thiệu bản thân."}
                        </p>
                    </div>

                    {/* 5. KỸ NĂNG (Đã đổi y -> năm) */}
                    <div className="content-card">
                        <h4 className="card-title"><Zap size={14} /> Kỹ năng chuyên môn</h4>
                        <div className="skill-pills-container">
                            {candidateData.skills?.map((s, idx) => (
                                <div key={idx} className="skill-pill">
                                    <span className="s-name">{s.skillName}</span>
                                    <span className="s-badge">{s.experienceYears} năm</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. KINH NGHIỆM & HỌC VẤN */}
                    <div className="content-card">
                        <h4 className="card-title"><Briefcase size={14} /> Hành trình sự nghiệp</h4>
                        <div className="simple-timeline">
                            {/* Kinh nghiệm */}
                            {candidateData.experience?.map((exp, i) => (
                                <div key={`exp-${i}`} className="tl-row">
                                    <div className="tl-dot blue"></div>
                                    <div className="tl-body">
                                        <h5>{exp.description}</h5>
                                        <p>{exp.startDate} — {exp.endDate || 'Hiện tại'}</p>
                                    </div>
                                </div>
                            ))}
                            {/* Học vấn */}
                            {candidateData.degrees?.map((deg, i) => (
                                <div key={`deg-${i}`} className="tl-row">
                                    <div className="tl-dot green"></div>
                                    <div className="tl-body">
                                        <h5>{deg.major || deg.name}</h5>
                                        <p>{deg.graduationYear || deg.year} • {deg.institution}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 7. FOOTER ACTION */}
                <div className="fixed-footer-action">
                    <button
                        className={`btn-grand-invite ${isInvited ? 'success' : ''}`}
                        disabled={isInvited}
                    >
                        {isInvited ? 'Đã gửi lời mời ứng tuyển' : 'Mời ứng tuyển ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CandidateProfileOverlay;