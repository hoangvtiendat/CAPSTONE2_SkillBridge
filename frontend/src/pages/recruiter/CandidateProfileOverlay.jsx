import React, { useState } from 'react';
import './CandidateProfileOverlay.css';
import candidateService from '../../services/api/candidateService';
import { toast } from 'sonner';

const CandidateProfileOverlay = ({ candidateData, jobId, onClose, onInviteSuccess }) => {
    const [evaluation, setEvaluation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    if (!candidateData) return null;

    // Lấy trạng thái hiện tại từ dữ liệu ứng viên
    const currentStatus = candidateData.jobStatus; // NONE, INVITED, EXPIRED, APPLIED

    const renderSmartText = (text) => {
        if (!text) return null;
        const cleanText = text.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
        const firstIndex = cleanText.search(/\d\.\s/);
        let intro = cleanText;
        let listItems = [];

        if (firstIndex !== -1) {
            intro = cleanText.substring(0, firstIndex).trim();
            const remainder = cleanText.substring(firstIndex);
            listItems = remainder.split(/(?=\d\.\s)/).map(item => item.trim());
        }

        return (
            <div className="eval-smart-container">
                <p className="eval-intro-text">{intro}</p>
                {listItems.length > 0 && (
                    <div className="eval-text-list">
                        {listItems.map((item, index) => {
                            const segments = item.split('**');
                            return (
                                <div key={index} className="eval-list-item">
                                    <span className="bullet">•</span>
                                    <span className="text">
                                        {segments.map((seg, i) => (
                                            i % 2 === 1 ?
                                                <strong key={i}>{seg}</strong> :
                                                seg.replace(/^\d\.\s*/, '').trim()
                                        ))}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const handleRateCandidate = async () => {
        setIsLoading(true);
        try {
            const response = await candidateService.evaluateByRecruiter(candidateData.id, jobId);
            if (response && response.result) {
                setEvaluation(response.result);
            }
        } catch (error) {
            toast.error("Không thể đánh giá ứng viên");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteAction = async () => {
        setIsInviting(true);
        try {
            const response = await candidateService.inviteCandidate(jobId, candidateData.id);
            if (response.code === 200) {
                toast.success(response.result || "Gửi lời mời thành công!");
                if (onInviteSuccess) onInviteSuccess(); // Gọi callback để refresh danh sách bên ngoài
                onClose(); // Đóng overlay sau khi mời thành công
            }
        } catch (error) {
            toast.error("Không thể gửi lời mời.");
        } finally {
            setIsInviting(false);
        }
    };

    const maskInfo = (info, type) => {
        if (!info) return "Chưa cập nhật";
        // Chỉ hiện thông tin thật nếu đã mời (INVITED) hoặc đã ứng tuyển (APPLIED)
        const isAuthorized = currentStatus === 'INVITED' || currentStatus === 'APPLIED';
        if (isAuthorized) return info;

        if (type === 'email') {
            const [name, domain] = info.split('@');
            return `${name[0]}••••@${domain}`;
        }
        if (type === 'phone') return `${info.slice(0, 3)}••••${info.slice(-2)}`;
        return "••••••••";
    };

    const matchScore = Number(((candidateData.aiMatchingScore || 0)).toFixed(0));

    const getScoreClass = (score) => {
        if (score < 50) return 'low';
        if (score < 80) return 'medium';
        return 'high';
    };
    const scoreClass = getScoreClass(matchScore);

    const degreesOnly = candidateData.degrees?.filter(d => d.type === 'DEGREE') || [];
    const certificatesOnly = candidateData.degrees?.filter(d => d.type === 'CERTIFICATE') || [];

    return (
        <div className="profile-overlay-backdrop" onClick={onClose}>
            {evaluation && (
                <div className="evaluation-result-panel" onClick={e => e.stopPropagation()}>
                    <div className="eval-header-main">
                        <div className="eval-title-area">
                            <h3>Phân tích ứng viên</h3>
                            <p>Kết quả đánh giá từ hệ thống AI</p>
                        </div>
                    </div>
                    <div className="eval-content-scroll">
                        <div className="eval-box strength">
                            <h4 className="box-title">
                                <span className="material-symbols-outlined">thumb_up</span> Điểm mạnh
                            </h4>
                            {renderSmartText(evaluation.strengths)}
                        </div>
                        <div className="eval-box weakness">
                            <h4 className="box-title">
                                <span className="material-symbols-outlined">thumb_down</span> Hạn chế
                            </h4>
                            {renderSmartText(evaluation.weaknesses)}
                        </div>
                    </div>
                </div>
            )}

            <div className="profile-bubble-content floating-bubble" onClick={e => e.stopPropagation()}>
                <button className="close-bubble-btn" onClick={onClose}>
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="bubble-scroll-area">
                    <header className="premium-header">
                        <div className="avatar-section">
                            <div className={`main-avatar-ring ${scoreClass}`}>
                                {candidateData.avatar ?
                                    <img src={candidateData.avatar} alt="Avatar" /> :
                                    <div className="avatar-alt">
                                        <span className="material-symbols-outlined" style={{fontSize: '48px', color: '#cbd5e1'}}>person</span>
                                    </div>
                                }
                                <div className={`score-float-badge ${scoreClass}`}>{matchScore}%</div>
                            </div>
                        </div>
                        <div className="header-text-info">
                            <h2>{candidateData.name}</h2>
                            <div className="status-row">
                                <span className="material-symbols-outlined verified-icon">verified_user</span>
                                <span className="category-label">
                                    {currentStatus === 'APPLIED' ? 'Ứng viên đã nộp đơn' : 'Ứng viên tiềm năng'}
                                </span>
                            </div>
                        </div>
                    </header>

                    <div className="modern-info-grid">
                        <div className="contact-item">
                            <div className="c-icon blue"><span className="material-symbols-outlined">mail</span></div>
                            <div className="c-text"><label>Email</label><p>{maskInfo(candidateData.email, 'email')}</p></div>
                        </div>
                        <div className="contact-item">
                            <div className="c-icon green"><span className="material-symbols-outlined">call</span></div>
                            <div className="c-text"><label>Điện thoại</label><p>{maskInfo(candidateData.phoneNumber, 'phone')}</p></div>
                        </div>
                        <div className="contact-item full">
                            <div className="c-icon orange"><span className="material-symbols-outlined">location_on</span></div>
                            <div className="c-text"><label>Địa chỉ</label><p>{candidateData.address}</p></div>
                        </div>
                    </div>

                    <div className="content-card">
                        <h4 className="card-title"><span className="material-symbols-outlined">work</span> Kinh nghiệm</h4>
                        <div className="rich-timeline">
                            {candidateData.experience?.length > 0 ? (
                                candidateData.experience.map((exp, i) => (
                                    <div key={i} className="experience-item">
                                        <div className="exp-content">
                                            <h5>{exp.description}</h5>
                                            <div className="exp-meta">
                                                <span className="material-symbols-outlined" style={{fontSize: '14px'}}>calendar_today</span>
                                                <span>{exp.startDate} — {exp.endDate || 'Hiện tại'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : <p className="empty-text-mini">Chưa có dữ liệu kinh nghiệm.</p>}
                        </div>
                    </div>

                    <div className="content-card">
                        <h4 className="card-title"><span className="material-symbols-outlined">school</span> Học vấn</h4>
                        <div className="education-list">
                            {degreesOnly.map((deg, i) => (
                                <div key={i} className="edu-card-item">
                                    <div className="edu-main-info">
                                        <h5>{deg.degree}</h5>
                                        <p className="major-text">{deg.major}</p>
                                        <p className="school-text">{deg.institution}</p>
                                    </div>
                                    <div className="edu-footer-tags">
                                        <span className="year-pill">{deg.graduationYear}</span>
                                        {deg.level && <span className="grade-pill">GPA: {deg.level}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="fixed-footer-action dual-actions">
                    <button
                        className={`btn-rate-candidate ${isLoading ? 'is-loading' : ''}`}
                        onClick={handleRateCandidate}
                        disabled={isLoading}
                    >
                        <span className="material-symbols-outlined">{isLoading ? 'sync' : 'person_search'}</span>
                        <span>{isLoading ? 'Đang chấm...' : 'Đánh giá AI'}</span>
                    </button>

                    {currentStatus === 'INVITED' ? (
                        <button className="btn-grand-invite success" disabled>
                            <span className="material-symbols-outlined">check_circle</span> Đã mời ứng tuyển
                        </button>
                    ) : (
                        <button
                            className={`btn-grand-invite ${isInviting ? 'is-loading' : ''}`}
                            onClick={handleInviteAction}
                            disabled={isInviting || currentStatus === 'APPLIED'}
                        >
                            {currentStatus === 'APPLIED' ? 'Đã nộp đơn' :
                             (currentStatus === 'NONE' ? 'Mời ứng tuyển' : 'Mời lại')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidateProfileOverlay;