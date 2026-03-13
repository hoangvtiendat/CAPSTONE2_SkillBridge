import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import applicationService from '../../services/api/applicationService';
import { FileText, User, Briefcase, CheckCircle, XCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import './ApplicationDetailPage.css';

const ApplicationDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cvBlobUrl, setCvBlobUrl] = useState(null);
    const [cvError, setCvError] = useState(false);

    useEffect(() => {
        let currentBlobUrl = null;

        const fetchData = async () => {
            try {
                // 1. Lấy thông tin chi tiết
                const res = await applicationService.getApplicationDetail(id);
                const appData = res.result;
                setApp(appData);

                // 2. Tải CV bằng Token
                if (appData.cvUrl) {
                    const token = localStorage.getItem('accessToken');
                    // Kiểm tra xem cvUrl có bắt đầu bằng / chưa để tránh double slash
                    const cleanPath = appData.cvUrl.startsWith('/') ? appData.cvUrl : `/${appData.cvUrl}`;
                    const fullUrl = `http://localhost:8081/identity${cleanPath}`;

                    console.log("🚀 Đang thử tải CV từ:", fullUrl);

                    const response = await fetch(fullUrl, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        // Kiểm tra xem file trả về có đúng là PDF không
                        console.log("Tải file thành công, kiểu file:", blob.type);

                        currentBlobUrl = URL.createObjectURL(blob);
                        setCvBlobUrl(currentBlobUrl);
                    } else {
                        console.error("❌ Lỗi tải file. Status:", response.status);
                        setCvError(true);
                    }
                }
            } catch (err) {
                console.error(" Lỗi API:", err);
                toast.error("Không thể tải thông tin hồ sơ");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Dọn dẹp bộ nhớ
        return () => {
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }
        };
    }, [id]);

    const handleRespond = async (status) => {
        try {
            await applicationService.respondToApplication(id, status);
            toast.success(status === 'INTERVIEW' ? "Đã chấp nhận hồ sơ!" : "Đã từ chối hồ sơ!");
            setApp({ ...app, status });
            setTimeout(() => navigate(`/recruiter/jobs/${app?.job?.id}/applications`), 1500);
        } catch (err) {
            toast.error("Thao tác thất bại!");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
            <p>Đang tải hồ sơ ứng viên...</p>
        </div>
    );

    if (!app) return <div className="p-10 text-center">Không tìm thấy dữ liệu.</div>;

    const qualifications = JSON.parse(app.qualifications || "[]");

    return (
        <div className="app-detail-wrapper">
            <button onClick={() => window.history.back()} className="btn-back">
                <ChevronLeft size={20}/> Quay lại
            </button>

            <div className="detail-grid">
                {/* Sidebar Trái */}
                <div className="sidebar-card">
                    <div className="profile-header text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <User size={40} className="text-gray-400"/>
                        </div>
                        <h3 className="text-xl font-bold mt-4">{app.fullName}</h3>
                        <p className="text-gray-500 text-sm">{app.email}</p>
                        <p className="text-gray-500 text-sm">{app.phoneNumber}</p>
                    </div>

                    <div className="action-group mt-6">
                        <button onClick={() => handleRespond('INTERVIEW')} className="btn-accept">Chấp nhận hồ sơ</button>
                        <button onClick={() => handleRespond('REJECTED')} className="btn-reject">Từ chối hồ sơ</button>
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <div className="mt-8 border-t pt-6">
                            <h4 className="section-title text-sm uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                <Briefcase size={16}/> Học vấn & Chứng chỉ
                            </h4>
                            <div className="mt-6 ml-2">
                                {qualifications.map((q, idx) => (
                                    <div key={idx}
                                         className="qualification-item border-l-2 border-blue-200 pl-6 pb-6 relative">
                                        <p className="font-bold text-sm text-gray-800">{q.degree || q.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{q.institution || q.year}</p>
                                        {q.major &&
                                            <p className="text-xs text-gray-400 mt-1">Chuyên ngành: {q.major}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Phải */}
                <div className="main-content-area">
                    <div className="info-card">
                        <h4 className="flex items-center gap-2 font-bold mb-4 text-gray-700">
                            Thư giới thiệu
                        </h4>
                        <p className="text-gray-600 leading-relaxed italic">
                            "{app.recommendationLetter || "Ứng viên không gửi thư giới thiệu."}"
                        </p>
                    </div>

                    <div className="info-card">
                        <div
                            className="cv-viewer-header flex justify-between items-center mb-4 bg-slate-800 p-3 rounded-t-lg text-white">
                            <span className="font-bold">CV ứng viên</span>
                            {cvBlobUrl && (
                                <a href={cvBlobUrl} download={`${app.fullName}_CV.pdf`} className="text-xs bg-white text-slate-800 px-3 py-1 rounded hover:bg-gray-200 transition">
                                    Tải về hồ sơ
                                </a>
                            )}
                        </div>

                        <div className="bg-gray-100 rounded-b-lg border min-h-[600px] w-full block">
                            {cvBlobUrl ? (
                                <iframe src={cvBlobUrl} className="cv-iframe-responsive"/>
                            ) : cvError ? (
                                <div className="text-center p-10">
                                    <p className="text-red-500 mb-2">Không thể hiển thị bản xem trước.</p>
                                    <p className="text-sm text-gray-500">Vui lòng kiểm tra lại quyền truy cập file trên
                                        Server.</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Loader2 className="animate-spin mx-auto text-blue-500 mb-2"/>
                                    <p className="text-gray-500">Đang chuẩn bị bản xem trước CV...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationDetailPage;