import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import applicationService from '../../services/api/applicationService';
import {
    FileText, User, Briefcase, CheckCircle, XCircle, ChevronLeft,
    Loader2, MapPin, Calendar, Award, Sparkles, ShieldCheck, Mail, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import './ApplicationDetailPage.css';

const ApplicationDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cvBlobUrl, setCvBlobUrl] = useState(null);
    const [cvError, setCvError] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState(""); // 'INTERVIEW' hoặc 'REJECTED'
    const [noteContent, setNoteContent] = useState("");

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
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const rawBlob = await response.blob();
                        const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
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

    const openModal = (type) => {
        setActionType(type);
        setNoteContent("");
        setIsModalOpen(true);
    };

    const handleRespond = async () => {
        try {
            const payload = {
                status: actionType,
                note: noteContent
            };

            await applicationService.respondToApplication(id, payload);

            toast.success(actionType === 'INTERVIEW' ? "Đã chấp nhận hồ sơ!" : "Đã từ chối hồ sơ!");
            setApp({ ...app, status: actionType });
            setIsModalOpen(false);

            setTimeout(() => navigate(`/recruiter/jobs/${app?.job?.id}/applications`), 1500);
        } catch (err) {
            toast.error("Thao tác thất bại!");
        }
    };

    // Hàm render màu trạng thái ứng tuyển
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'INTERVIEW':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Đã tiếp nhận / Phỏng vấn</span>;
            case 'REJECTED':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Từ chối hồ sơ</span>;
            default:
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Chờ duyệt hồ sơ</span>;
        }
    };

    // Hàm lấy màu cho Điểm AI Matching
    const getScoreColor = (score) => {
        if (!score) return 'text-gray-400';
        if (score >= 70) return 'text-green-600 bg-green-50 border border-green-200';
        if (score >= 40) return 'text-orange-500 bg-orange-50 border border-orange-200';
        return 'text-red-500 bg-red-50 border border-red-200';
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
            <p className="font-medium text-gray-600">Đang phân tích hồ sơ ứng viên...</p>
        </div>
    );

    if (!app) return <div className="p-10 text-center text-gray-500">Không tìm thấy dữ liệu ứng viên.</div>;

    // LẤY DỮ LIỆU TỪ ROOT PARSED_CONTENT_JSON THEO YÊU CẦU
    const aiParsed = app.parsedContentJson ? JSON.parse(app.parsedContentJson) : null;

    // Tách danh sách học vấn chuyên quy và chứng chỉ từ dữ liệu AI đã bóc tách
    const degreesList = aiParsed?.degrees?.filter(d => d.type === 'DEGREE') || [];
    const certificatesList = aiParsed?.degrees?.filter(d => d.type === 'CERTIFICATE') || [];

    return (
        <div className="apd-wrapper bg-gray-50 min-h-screen p-6 relative">
            <button
                onClick={() => window.history.back()}
                className="apd-btn-back flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6 font-medium"
            >
                <ChevronLeft size={20} /> Quay lại danh sách
            </button>

            <div className="apd-grid grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SIDEBAR */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="apd-sidebar-card p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="apd-profile text-center border-b border-gray-100 pb-5">
                            <div className="apd-avatar mx-auto mb-3 flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 text-blue-600">
                                <User size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{app.fullName}</h3>
                            <p className="text-sm font-medium text-blue-600 mb-3">{aiParsed?.category || "Ứng viên"}</p>

                            {/* 1. HIỂN THỊ TRẠNG THÁI HIỆN TẠI CỦA HỒ SƠ */}
                            <div className="mb-4">{renderStatusBadge(app.status)}</div>

                            <div className="text-left space-y-2 text-sm text-gray-600 pt-3">
                                <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {app.email}</p>
                                <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {app.phoneNumber}</p>
                                {aiParsed?.address && (
                                    <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {aiParsed.address}</p>
                                )}
                            </div>
                        </div>

                        {/* 2. HIỂN THỊ ĐIỂM AI MATCHING ĐỘC QUYỀN CỦA SKILLBRIDGE */}
                        {app.aiMatchingScore !== null && (
                            <div className={`mt-5 p-4 rounded-xl flex items-center justify-between ${getScoreColor(app.aiMatchingScore)}`}>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="animate-pulse" />
                                    <span className="font-semibold text-sm">Độ phù hợp AI</span>
                                </div>
                                <span className="text-2xl font-black">{app.aiMatchingScore}%</span>
                            </div>
                        )}

                        <div className="apd-actions mt-6 space-y-3">
                            <button onClick={() => openModal('INTERVIEW')} className="apd-btn-primary w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition flex justify-center items-center gap-2">
                                <CheckCircle size={16} /> Chấp nhận hồ sơ
                            </button>
                            <button onClick={() => openModal('REJECTED')} className="apd-btn-danger w-full py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition flex justify-center items-center gap-2">
                                <XCircle size={16} /> Từ chối hồ sơ
                            </button>
                        </div>
                    </div>

                    {/* HỌC VẤN CHUYÊN QUY */}
                    <div className="apd-card p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="apd-section-title text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Award size={18} className="text-blue-600" /> Học vấn & Bằng cấp
                        </h4>
                        <div className="apd-timeline space-y-4">
                            {degreesList.length > 0 ? degreesList.map((q, idx) => (
                                <div key={idx} className="apd-timeline-item relative pl-4 border-l border-blue-200">
                                    <p className="font-semibold text-sm text-gray-800">{q.degree}</p>
                                    <p className="text-xs text-gray-500">{q.institution} {q.graduationYear && `• Tốt nghiệp năm ${q.graduationYear}`}</p>
                                    {q.major && <p className="text-xs text-blue-600 mt-0.5 bg-blue-50 px-2 py-0.5 rounded w-max">{q.major}</p>}
                                </div>
                            )) : <p className="text-xs text-gray-400 italic">Chưa xác định thông tin học vấn</p>}
                        </div>
                    </div>

                    {/* 3. CHỨNG CHỈ QUỐC TẾ BÓC TÁCH RIÊNG TỪ AI_PARSED */}
                    <div className="apd-card p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="apd-section-title text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <ShieldCheck size={18} className="text-green-600" /> Chứng chỉ chuyên môn
                        </h4>
                        <div className="space-y-3">
                            {certificatesList.length > 0 ? certificatesList.map((c, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-2">
                                    <ShieldCheck size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-sm text-gray-800 leading-tight">{c.name}</p>
                                        {c.year && c.year !== "0" && <p className="text-xxs text-gray-400 mt-1">Năm cấp: {c.year}</p>}
                                    </div>
                                </div>
                            )) : <p className="text-xs text-gray-400 italic">Không tìm thấy chứng chỉ chuyên môn ngoài</p>}
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="lg:col-span-8 space-y-6">
                    {/* 4. HIỂN THỊ ĐOẠN TÓM TẮT/MÔ TẢ BẢN THÂN TRÍCH XUẤT TỪ CV */}
                    {aiParsed?.description && (
                        <div className="apd-card p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="apd-card-title text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <User size={18} className="text-indigo-500" /> Tóm tắt chuyên môn (AI Extracted)
                            </h4>
                            <p className="text-sm leading-relaxed text-gray-600 bg-indigo-50/40 p-4 rounded-xl border border-indigo-50 italic">
                                "{aiParsed.description}"
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="apd-card p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="apd-card-title text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <FileText size={18} className="text-orange-500" /> Thư giới thiệu
                            </h4>
                            <p className="apd-text text-sm italic text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {app.recommendationLetter ? `"${app.recommendationLetter}"` : "Ứng viên không gửi kèm thư giới thiệu."}
                            </p>
                        </div>
                        <div className="apd-card p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="apd-card-title text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CheckCircle size={18} className="text-emerald-500" /> Kỹ năng nổi bật
                            </h4>
                            <div className="apd-skill-list flex flex-wrap gap-2">
                                {aiParsed?.skills?.map((s, i) => (
                                    <span key={i} className="apd-skill bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2.5 py-1 rounded-md font-medium">
                                        {s}
                                    </span>
                                )) || <span className="apd-empty text-xs text-gray-400 italic">Chưa xác định được kỹ năng cụ thể</span>}
                            </div>
                        </div>
                    </div>

                    {/* KINH NGHIỆM LÀM VIỆC */}
                    <div className="apd-card p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="apd-card-title apd-border text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Briefcase size={18} className="text-blue-600" /> Kinh nghiệm làm việc chi tiết
                        </h4>
                        <div className="apd-exp-list space-y-4">
                            {aiParsed?.experience && aiParsed.experience.length > 0 ? aiParsed.experience.map((exp, idx) => (
                                <div key={idx} className="apd-exp-item p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="apd-exp-head flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-sm text-gray-800">Dự án / Vị trí chuyên môn #{idx + 1}</h5>
                                        <span className="apd-exp-date text-xs text-gray-500 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-100">
                                            <Calendar size={12} /> {exp.startDate} - {exp.endDate || 'Hiện tại'}
                                        </span>
                                    </div>
                                    <p className="apd-text text-sm text-gray-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                                </div>
                            )) : <p className="apd-empty text-xs text-gray-400 italic text-center py-4">Ứng viên chưa cập nhật thông tin kinh nghiệm làm việc</p>}
                        </div>
                    </div>

                    {/* BẢN GỐC CV */}
                    <div className="apd-card apd-cv bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="apd-cv-header bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                                <FileText size={20} className="text-red-500" />
                                <span>Bản gốc tập tin CV đính kèm</span>
                            </div>
                            {cvBlobUrl && (
                                <a href={cvBlobUrl} download={`${app.fullName}_CV.pdf`} className="apd-download text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition">
                                    Tải PDF Gốc
                                </a>
                            )}
                        </div>
                        <div className="apd-cv-body h-[550px] bg-gray-100">
                            {cvBlobUrl ? (
                                <iframe src={`${cvBlobUrl}#toolbar=0`} title="CV" className="w-full h-full border-none" />
                            ) : cvError ? (
                                <div className="apd-error flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                    <XCircle size={40} className="text-red-400" />
                                    <p className="text-sm font-medium">Không thể hiển thị bản xem trước của CV</p>
                                </div>
                            ) : (
                                <div className="apd-loading flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                    <Loader2 className="animate-spin text-blue-500" />
                                    <p className="text-sm font-medium">Đang chuẩn bị file xem trước...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* OVERLAY MODAL PHẢN HỒI (INTERVIEW / REJECT) */}
            {isModalOpen && (
                <div className="apd-modal-overlay fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
                    <div className="apd-modal-content bg-white p-6 rounded-xl w-full max-w-lg shadow-xl border border-gray-100 animate-in" onClick={(e) => e.stopPropagation()}>
                        <h3 className="apd-modal-title text-lg font-bold text-gray-800 mb-2">
                            {actionType === 'INTERVIEW' ? 'Chấp nhận hồ sơ & Hẹn phỏng vấn' : 'Từ chối yêu cầu ứng tuyển'}
                        </h3>
                        <p className="apd-modal-desc text-sm text-gray-500 mb-4 leading-relaxed">
                            {actionType === 'INTERVIEW'
                                ? 'Nhập ghi chú hoặc lời nhắn gửi trực tiếp đến ứng viên (ví dụ: thời gian/địa điểm phỏng vấn, link họp trực tuyến như Google Meet/Zoom).'
                                : 'Nhập lý do cụ thể để hệ thống gửi thư từ chối văn minh, giúp ích cho việc cải thiện của ứng viên.'}
                            <br />
                            <span className="text-gray-400 text-xs italic">(Không bắt buộc)</span>
                        </p>

                        <div className="apd-modal-form-group mb-5">
                            <label htmlFor="noteContent" className="apd-modal-label block text-sm font-semibold text-gray-700 mb-1.5">
                                {actionType === 'INTERVIEW' ? 'Nội dung lời nhắn lịch hẹn' : 'Lý do từ chối cụ thể'}
                            </label>
                            <textarea
                                id="noteContent"
                                className="apd-modal-textarea w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                rows={4}
                                placeholder={actionType === 'INTERVIEW' ? "Ví dụ: Trân trọng mời bạn tham gia buổi phỏng vấn chuyên môn vào 9h00 sáng Thứ Hai tuần tới tại văn phòng công ty..." : "Ví dụ: Số năm kinh nghiệm thực tế ở các dự án lớn chưa hoàn toàn tương thích với tiêu chí tuyển dụng hiện nay của phòng ban..."}
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                            />
                        </div>

                        <div className="apd-modal-actions flex justify-end gap-3 border-t border-gray-100 pt-4">
                            <button className="apd-btn-cancel px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsModalOpen(false)}>
                                Hủy bỏ
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition shadow-xs ${actionType === 'INTERVIEW' ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}`}
                                onClick={handleRespond}
                            >
                                {actionType === 'INTERVIEW' ? 'Xác nhận chấp nhận' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetailPage;