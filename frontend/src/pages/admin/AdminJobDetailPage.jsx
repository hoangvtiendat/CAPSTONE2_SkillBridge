import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import './AdminJobDetail.css';

const AdminJobDetailPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobDetail();
    }, [jobId]);

    const fetchJobDetail = async () => {
        try {
            const data = await jobService.getJobDetail(jobId);
            setJob(data);
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết công việc:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            await jobService.changeStatus(jobId, newStatus);
            fetchJobDetail(); // Refresh data
        } catch (error) { alert("Cập nhật trạng thái thất bại"); }
    };

    const handleUpdateMod = async (newMod) => {
        try {
            await jobService.changeModerationStatus(jobId, newMod);
            fetchJobDetail();
        } catch (error) { alert("Cập nhật kiểm duyệt thất bại"); }
    };

    const handleDelete = async () => {
        if (window.confirm("Bạn có chắc chắn muốn xoá công việc này?")) {
            try {
                await jobService.deleteJob(jobId);
                navigate('/admin/jobs'); // Quay lại danh sách sau khi xoá
            } catch (error) { alert("Xoá thất bại"); }
        }
    };

    if (loading) return <div className="admin-loader">Đang tải...</div>;
    if (!job) return <div>Không tìm thấy công việc</div>;

    return (
        <div className="admin-job-detail-container">
            {/* Header Section: Chứa cả Info và Admin Controls */}
            <div className="detail-card header-combined">
                <div className="header-main-content">
                    {/* Cột trái: Logo + Thông tin + Skills */}
                    <div className="company-info-section">
                        <img
                            src={job.companyImageUrl || '/default-logo.png'}
                            alt="logo"
                            className="company-logo-large"
                        />
                        <div className="job-title-info">
                            <h1>{job.title?.en || job.title?.vi || job.title}</h1>
                            <p className="company-name-text">{job.companyName}</p>

                            <div className="job-meta-tags">
                                <span>📍 {job.location}</span>
                                <span>💰 {job.salaryMin} - {job.salaryMax}</span>
                                <span>📂 {job.categoryName}</span>
                            </div>

                            {/* Skills hiển thị ngay dưới Meta Tags */}
                            <div className="skills-tags-container inline-skills">
                                {job.skills?.map((s, index) => (
                                    <span key={index} className="skill-tag">{s.skillName || s}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Bộ nút của Admin */}
                    <div className="admin-action-bar side-panel">
                        <div className="control-item">
                            <label>Trạng thái Job:</label>
                            <select
                                value={job.status}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                className={`select-status s-${job.status?.toLowerCase()}`}
                            >
                                <option value="OPEN">OPEN</option>
                                <option value="CLOSED">CLOSED</option>
                                <option value="PENDING">PENDING</option>
                            </select>
                        </div>

                        <div className="control-item">
                            <label>Kiểm duyệt:</label>
                            <select
                                value={job.moderationStatus}
                                onChange={(e) => handleUpdateMod(e.target.value)}
                                className={`select-mod mod-${job.moderationStatus}`}
                            >
                                <option value="GREEN">GREEN (Duyệt)</option>
                                <option value="YELLOW">YELLOW (Chờ)</option>
                                <option value="RED">RED (Vi phạm)</option>
                            </select>
                        </div>

                        <button onClick={handleDelete} className="btn-delete-job">
                            XOÁ CÔNG VIỆC
                        </button>
                    </div>
                </div>
            </div>


            <div className="detail-grid">
                <div className="detail-card section">
                    <h3>Mô Tả Công Việc</h3>
                    <div className="content-text">{job.description}</div>
                </div>

                <div className="detail-card section">
                    <h3>Thông tin bổ sung</h3>
                    <ul className="info-list">
                        <li><strong>Gói đăng bài:</strong> {job.subscriptionPlanName}</li>
                        <li><strong>Ngày tạo:</strong> {new Date(job.createdAt).toLocaleDateString('vi-VN')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminJobDetailPage;