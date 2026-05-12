import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import applicationService from '../../services/api/applicationService';
import { Eye, Mail, Tag, Users } from 'lucide-react';
import { toast } from 'sonner';
import './RecruiterApplications.css'; // Đảm bảo đã import file này

const RecruiterApplications = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await applicationService.getApplicationsByJob(jobId);
                setApplications(res.result);
            } catch (err) {
                toast.error("Không thể tải danh sách ứng viên");
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [jobId]);

    // Hàm helper để map status từ DB sang class CSS
    const getStatusClass = (status) => {
        if (!status) return 'status-badge';
        return `status-badge status-${status.toLowerCase()}`;
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="loader-spinner"></div>
            <p className="ml-3 text-gray-500">Đang tìm kiếm nhân tài...</p>
        </div>
    );

    return (
        <div className="recruiter-apps-container">
            <h2 className="page-title">
                Danh sách ứng viên nộp hồ sơ
            </h2>

            <div className="table-card">
                <table className="apps-table">
                    <thead>
                    <tr>
                        <th>Ứng viên</th>
                        <th>Trạng thái</th>
                        <th>Ngày nộp</th>
                        <th>AI Matching</th>
                        <th>Ghi chú</th>
                        <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {applications.length > 0 ? (
                        applications.map((app) => (
                            <tr key={app.id}>
                                <td>
                                    <div className="candidate-name"
                                         onClick={() => navigate(`/recruiter/applications/${app.id}`)}>
                                        {app.fullName}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                        <Mail size={12}/> {app.email}
                                    </div>
                                </td>
                                <td>
                                        <span className={getStatusClass(app.status)}>
                                            {app.status}
                                        </span>
                                </td>
                                <td className="text-sm text-gray-600">
                                    {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                </td>
                                <td>
                                    <div className="ai-score-tag">
                                        {app.aiMatchingScore}%
                                    </div>
                                </td>
                                <td>
                                    <div className="candidate-note" title={app.note}>
                                        {app.note ? (
                                            <span className="note-text">{app.note}</span>
                                        ) : (
                                            <span className="text-slate-400 italic">Không có ghi chú</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/recruiter/applications/${app.id}`)}
                                        className="btn-view-detail"
                                    >
                                        Chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center py-10 text-gray-400">
                                Chưa có ai nộp hồ sơ cho vị trí này.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecruiterApplications;