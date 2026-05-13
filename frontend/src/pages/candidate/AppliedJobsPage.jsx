import React, { useEffect, useState } from 'react';
import jobService from '../../services/api/jobService';
import { MapPin, DollarSign, Calendar, Building2, Video, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AppliedJobsPage.css';
import { toast } from 'sonner';

const AppliedJobsPage = () => {
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Modal Rút hồ sơ
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);
    const [withdrawReason, setWithdrawReason] = useState("");

    const navigate = useNavigate();
    const API_IMAGE_BASE = "http://localhost:8081/identity";

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await jobService.getAppliedJobs();
                setAppliedJobs(data);
            } catch (err) {
                console.error("Lỗi lấy danh sách:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const getStatusClass = (status) => {
        if (status === 'PENDING') return 'status-pending';
        if (status === 'HIRED') return 'status-hired';
        if (status === 'REJECTED') return 'status-rejected';
        return '';
    };

    const getLogoUrl = (logoPath) => {
        if (!logoPath) return 'https://via.placeholder.com/150?text=No+Logo';
        return logoPath.startsWith('http') ? logoPath : `${API_IMAGE_BASE}${logoPath}`;
    };

    const handleGoToBooking = (e, jobId) => {
        e.stopPropagation();
        navigate(`/interviews/book/${jobId}`);
    };

    // Mở Modal
    const handleOpenWithdrawModal = (e, applicationId) => {
        e.stopPropagation(); // Ngăn sự kiện click vào card (chuyển trang)
        setSelectedApplicationId(applicationId);
        setWithdrawReason(""); // Reset lại lý do
        setIsModalOpen(true);
    };

    // Đóng Modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedApplicationId(null);
        setWithdrawReason("");
    };

    // Xử lý khi xác nhận rút hồ sơ trong Modal
    const handleConfirmWithdraw = async () => {
        if (!selectedApplicationId) return;

        try {
            // Truyền thêm withdrawReason vào hàm withdrawApplication
            const response = await jobService.withdrawApplication(selectedApplicationId, withdrawReason);
            if (response.code === 200) {
                toast.success(response.result || "Rút hồ sơ thành công!");
                // Cập nhật lại UI bằng cách lọc bỏ hồ sơ đã rút
                setAppliedJobs(prev => prev.filter(item => item.applicationId !== selectedApplicationId));
                handleCloseModal(); // Đóng Modal
            }
        } catch (err) {
            toast.error("Không thể rút hồ sơ. Vui lòng thử lại!");
            console.error("Lỗi rút hồ sơ:", err);
        }
    };

    if (loading) return (
        <div className="applied-loading">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
        </div>
    );

    return (
        <div className="applied-container">
            <div className="applied-header">
                <h1 className="applied-title">Việc làm đã ứng tuyển</h1>
                <p className="applied-subtitle">Bạn đã nộp <strong>{appliedJobs.length}</strong> hồ sơ</p>
            </div>

            <div className="job-grid">
                {appliedJobs.map((item) => (
                    <div
                        key={item.applicationId}
                        className="job-card-item"
                        onClick={() => navigate(`/jobs/${item.jobId}`)}
                    >
                        {/* Nhóm Badge và Nút ở góc phải */}
                        <div className="card-top-right">
                            <span className={`status-badge-v2 ${getStatusClass(item.status)}`}>
                                {item.status}
                            </span>
                            <div className="action">
                                {/* ĐÃ BỎ ĐIỀU KIỆN item.status === 'PENDING' */}
                                <button
                                    className="btn-withdraw-icon"
                                    onClick={(e) => handleOpenWithdrawModal(e, item.applicationId)}
                                    title="Rút hồ sơ"
                                    style={{ color: '#ef4444' }} // Màu đỏ minimalist
                                >
                                    <UserX size={14} />
                                </button>

                                {item.status !== 'PENDING' && (
                                    <button
                                        className="btn-book-icon-v3"
                                        onClick={(e) => handleGoToBooking(e, item.jobId)}
                                        title="Đặt lịch phỏng vấn"
                                    >
                                        <Video size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="job-logo-v2">
                            <img
                                src={getLogoUrl(item.companyLogo)}
                                alt={item.companyName}
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/150?text=Error';
                                }}
                            />
                        </div>

                        <div className="job-content-v2">
                            <h3 className="job-position-v2" title={item.jobPosition}>
                                {item.jobPosition}
                            </h3>

                            <div className="job-company-v2 text-truncate">
                                <Building2 size={14} />
                                <span>{item.companyName}</span>
                            </div>

                            <div className="job-meta-v2">
                                <div className="meta-row">
                                    <MapPin size={14} /> <span>{item.location}</span>
                                </div>
                                <div className="meta-row salary">
                                    <DollarSign size={14} />
                                    <span>{item.salaryMin.toLocaleString()} - {item.salaryMax.toLocaleString()}</span>
                                </div>
                                <div className="meta-row date">
                                    <Calendar size={14} />
                                    <span>{new Date(item.appliedAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* OVERLAY MODAL RÚT HỒ SƠ */}
            {isModalOpen && (
                <div className="withdraw-modal-overlay" onClick={handleCloseModal}>
                    <div className="withdraw-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Rút hồ sơ ứng tuyển</h3>
                        <p>Bạn có chắc chắn muốn rút hồ sơ này không?</p>

                        <div className="withdraw-reason-container">
                            <label htmlFor="reason">Lý do rút hồ sơ (Không bắt buộc):</label>
                            <textarea
                                id="reason"
                                rows={4}
                                placeholder="Nhập lý do của bạn để nhà tuyển dụng có thể hiểu rõ hơn..."
                                value={withdrawReason}
                                onChange={(e) => setWithdrawReason(e.target.value)}
                            />
                        </div>

                        <div className="withdraw-modal-actions">
                            <button className="btn-cancel" onClick={handleCloseModal}>
                                Hủy bỏ
                            </button>
                            <button className="btn-confirm" onClick={handleConfirmWithdraw}>
                                Xác nhận rút
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppliedJobsPage;