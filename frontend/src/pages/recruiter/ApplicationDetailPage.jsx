import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import applicationService from '../../services/api/applicationService';
import {
    FileText,
    User,
    Briefcase,
    CheckCircle,
    XCircle,
    ChevronLeft,
    Loader2,
    MapPin,
    Calendar,
    Award
} from 'lucide-react';
import {toast, Toaster} from 'sonner';
import './ApplicationDetailPage.css';

const ApplicationDetailPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cvBlobUrl, setCvBlobUrl] = useState(null);
    const [cvError, setCvError] = useState(false);

    // --- Thêm state quản lý Modal Từ Chối ---
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        let currentBlobUrl = null;

        const fetchData = async () => {
            try {
                const res = await applicationService.getApplicationDetail(id);
                const appData = res.result;
                setApp(appData);

                if (appData.cvUrl) {
                    const token = localStorage.getItem('accessToken');
                    const cleanPath = appData.cvUrl.startsWith('/') ? appData.cvUrl : `/${appData.cvUrl}`;
                    const fullUrl = `http://localhost:8081/identity${encodeURI(cleanPath)}`;

                    const response = await fetch(fullUrl, {
                        headers: {'Authorization': `Bearer ${token}`}
                    });

                    if (response.ok) {
                        const rawBlob = await response.blob();
                        const pdfBlob = new Blob([rawBlob], {type: 'application/pdf'});
                        currentBlobUrl = URL.createObjectURL(pdfBlob);
                        setCvBlobUrl(currentBlobUrl);
                    } else {
                        console.error("Lỗi tải CV. Status:", response.status);
                        setCvError(true);
                    }
                }
            } catch (err) {
                console.error("Lỗi API:", err);
                toast.error("Không thể tải thông tin hồ sơ");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
        };
    }, [id]);

    // Cập nhật hàm handleRespond nhận thêm tham số reason
    const handleRespond = async (status, reason = "") => {
        try {
            // Lưu ý: Cần truyền 1 object chứa cả status và reason xuống service
            await applicationService.respondToApplication(id, {status, reason});

            toast.success(status === 'INTERVIEW' ? "Đã chấp nhận hồ sơ!" : "Đã từ chối hồ sơ!");
            setApp({...app, status});

            if (status === 'REJECTED') {
                setIsRejectModalOpen(false); // Đóng modal nếu là từ chối
            }

            setTimeout(() => navigate(`/recruiter/jobs/${app?.job?.id}/applications`), 1500);
        } catch (err) {
            toast.error("Thao tác thất bại!");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={40}/>
            <p className="font-medium text-gray-600">Đang phân tích hồ sơ ứng viên...</p>
        </div>
    );

    if (!app) return <div className="p-10 text-center text-gray-500">Không tìm thấy dữ liệu ứng viên.</div>;

    const qualifications = JSON.parse(app.qualifications || "[]");
    const aiParsed = app.parsedContentJson ? JSON.parse(app.parsedContentJson) : null;

    return (
        <div className="apd-wrapper bg-gray-50 min-h-screen p-6 relative">
            <button
                onClick={() => window.history.back()}
                className="apd-btn-back flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6"
            >
                <ChevronLeft size={20}/> Quay lại danh sách
            </button>

            <div className="apd-grid grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SIDEBAR */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="apd-sidebar-card p-6">
                        <div className="apd-profile text-center">
                            <div className="apd-avatar">
                                <User size={48}/>
                            </div>
                            <h3 className="apd-name">{app.fullName}</h3>
                            <p className="apd-role">{aiParsed?.category || "Ứng viên"}</p>
                            <div className="apd-contact">
                                <p>📧 {app.email}</p>
                                <p>📞 {app.phoneNumber}</p>
                                {aiParsed?.address && (
                                    <p className="flex items-center gap-2">
                                        <MapPin size={14}/> {aiParsed.address}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="apd-actions">
                            <button onClick={() => handleRespond('INTERVIEW')} className="apd-btn-primary">
                                Chấp nhận hồ sơ
                            </button>
                            {/* Đổi onClick mở Modal thay vì gọi API ngay lập tức */}
                            <button onClick={() => {
                                setRejectReason("");
                                setIsRejectModalOpen(true);
                            }} className="apd-btn-danger">
                                Từ chối hồ sơ
                            </button>
                        </div>
                    </div>

                    {/* EDUCATION */}
                    <div className="apd-card p-6">
                        <h4 className="apd-section-title">
                            <Award size={18}/> Học vấn & Chứng chỉ
                        </h4>
                        <div className="apd-timeline">
                            {qualifications.map((q, idx) => (
                                <div key={idx} className="apd-timeline-item">
                                    <p className="apd-title">{q.degree || q.name}</p>
                                    <p className="apd-sub">{q.institution || q.year}</p>
                                    {q.major && <p className="apd-major">{q.major}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="apd-card p-6">
                            <h4 className="apd-card-title">
                                <FileText size={18}/> Thư giới thiệu
                            </h4>
                            <p className="apd-text italic">
                                "{app.recommendationLetter || "Ứng viên không gửi thư giới thiệu."}"
                            </p>
                        </div>
                        <div className="apd-card p-6">
                            <h4 className="apd-card-title">
                                <CheckCircle size={18}/> Kỹ năng nổi bật
                            </h4>
                            <div className="apd-skill-list">
                                {aiParsed?.skills?.map((s, i) => (
                                    <span key={i} className="apd-skill">{s}</span>
                                )) || <span className="apd-empty">Chưa xác định kỹ năng</span>}
                            </div>
                        </div>
                    </div>

                    {/* EXPERIENCE */}
                    <div className="apd-card p-6">
                        <h4 className="apd-card-title apd-border">
                            <Briefcase size={18}/> Kinh nghiệm làm việc
                        </h4>
                        <div className="apd-exp-list">
                            {aiParsed?.experience?.map((exp, idx) => (
                                <div key={idx} className="apd-exp-item">
                                    <div className="apd-exp-head">
                                        <h5>Vị trí #{idx + 1}</h5>
                                        <span className="apd-exp-date">
                                            <Calendar size={12}/> {exp.startDate} - {exp.endDate || 'Hiện tại'}
                                        </span>
                                    </div>
                                    <p className="apd-text">{exp.description}</p>
                                </div>
                            )) || <p className="apd-empty">Không có dữ liệu</p>}
                        </div>
                    </div>

                    {/* CV */}
                    <div className="apd-card apd-cv">
                        <div className="apd-cv-header">
                            <FileText size={20}/>
                            <span>Bản gốc CV</span>
                            {cvBlobUrl && (
                                <a href={cvBlobUrl} download={`${app.fullName}_CV.pdf`} className="apd-download">
                                    Tải PDF
                                </a>
                            )}
                        </div>
                        <div className="apd-cv-body">
                            {cvBlobUrl ? (
                                <iframe src={`${cvBlobUrl}#toolbar=0`} title="CV"/>
                            ) : cvError ? (
                                <div className="apd-error">
                                    <XCircle size={40}/>
                                    <p>Không thể hiển thị CV</p>
                                </div>
                            ) : (
                                <div className="apd-loading">
                                    <Loader2 className="animate-spin"/>
                                    <p>Đang tải...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* OVERLAY MODAL TỪ CHỐI HỒ SƠ */}
            {isRejectModalOpen && (
                <div className="apd-modal-overlay" onClick={() => setIsRejectModalOpen(false)}>
                    <div className="apd-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="apd-modal-title">Từ chối ứng viên</h3>
                        <p className="apd-modal-desc">
                            Nhập lý do từ chối để giúp ứng viên hiểu rõ hơn và cải thiện trong tương lai.<br/>
                            <span style={{color: '#94a3b8', fontStyle: 'italic'}}>(Không bắt buộc)</span>
                        </p>

                        <div className="apd-modal-form-group">
                            <label htmlFor="rejectReason" className="apd-modal-label">Lý do cụ thể</label>
                            <textarea
                                id="rejectReason"
                                className="apd-modal-textarea"
                                rows={4}
                                placeholder="Ví dụ: Kỹ năng chưa hoàn toàn phù hợp với định hướng dự án..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>

                        <div className="apd-modal-actions">
                            <button
                                className="apd-btn-cancel"
                                onClick={() => setIsRejectModalOpen(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                className="apd-btn-danger"
                                onClick={() => handleRespond('REJECTED', rejectReason)}
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetailPage;