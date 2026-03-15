import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import { Briefcase, MapPin, DollarSign, Users, ChevronRight, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import './MyJobsPage.css';

const MyJobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Lấy token từ localStorage để truyền vào hàm của ông
                const token = localStorage.getItem('accessToken');
                const res = await jobService.getMyJd_of_Company(token);
                setJobs(res.result);
            } catch (err) {
                toast.error("Không thể tải danh sách công việc");
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Ông có chắc muốn xóa tin tuyển dụng này không?")) {
            try {
                await jobService.deleteJd(id);
                setJobs(jobs.filter(job => job.id !== id));
                toast.success("Xóa tin tuyển dụng thành công");
            } catch (err) {
                toast.error("Không thể xóa tin tuyển dụng");
            }
        }
    };

    const formatSalary = (min, max) => {
        if (!min || !max) return "Thỏa thuận";
        return `${(min / 1000000).toFixed(0)}tr - ${(max / 1000000).toFixed(0)}tr VND`;
    };

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang lấy danh sách tin tuyển dụng...</p>
        </div>
    );

    return (
        <div className="my-jobs-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Tin tuyển dụng của tôi</h1>
                    <p>Quản lý các vị trí đang tuyển dụng tại công ty của ông</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/recruiter/post-job')}>
                    <Plus size={20} /> Đăng tin mới
                </button>
            </header>

            <div className="jobs-list">
                {jobs.length > 0 ? (
                    jobs.map((job) => (
                        <div key={job.id} className="job-item-card">
                            <div className="job-main-info">
                                <div className="job-header">
                                    <h3 className="job-title">{job.title.vi || job.title.en}</h3>
                                    <span className={`status-badge ${job.status.toLowerCase()}`}>
                                        {job.status}
                                    </span>
                                </div>
                                <p className="job-pos">{job.position}</p>

                                <div className="job-meta">
                                    <div className="meta-item"><MapPin size={16}/> {job.location}</div>
                                    <div className="meta-item"><DollarSign size={16}/> {formatSalary(job.salaryMin, job.salaryMax)}</div>
                                    <div className="meta-item"><Briefcase size={16}/> {job.category.name}</div>
                                </div>
                            </div>

                            <div className="job-actions">
                                <button
                                    className="action-btn view-apps"
                                    onClick={() => navigate(`/recruiter/jobs/${job.id}/applications`)}
                                >
                                    <Users size={18} />
                                    <span>Xem ứng viên</span>
                                    <ChevronRight size={16} />
                                </button>

                                <div className="utility-btns">
                                    <button className="icon-btn edit" title="Sửa tin">
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        className="icon-btn delete"
                                        title="Xóa tin"
                                        onClick={() => handleDelete(job.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <Briefcase size={60} />
                        <p>Chưa có bài đăng tuyển dụng nào.</p>
                        <button onClick={() => navigate('/recruiter/post-job')}>Đăng tin ngay</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyJobsPage;