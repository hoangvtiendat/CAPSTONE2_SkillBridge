import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import { Briefcase, MapPin, DollarSign, Users, ChevronRight, Plus, Trash2, Edit, ChevronLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import './MyJobsPage.css';
import confirmAction from '../../utils/confirmAction';

const MyJobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Lấy token từ localStorage để truyền vào hàm của ông
                const token = localStorage.getItem('accessToken');
                const res = await jobService.getMyJd_of_Company(token);
                setJobs(Array.isArray(res.result) ? res.result : []);
            } catch (err) {
                toast.error("Không thể tải danh sách công việc");
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const handleDelete = async (id) => {
        const confirmed = await confirmAction({
            title: 'Xóa tin tuyển dụng?',
            text: 'Tin tuyển dụng sẽ chuyển sang trạng thái khóa.',
            confirmText: 'Xóa tin',
            icon: 'warning',
            confirmButtonColor: '#ef4444'
        });
        if (!confirmed) return;

        try {
            await jobService.deleteJd(id);
            setJobs(prev => prev.filter(job => job.id !== id));
            toast.success("Xóa tin tuyển dụng thành công");
        } catch (err) {
            toast.error("Không thể xóa tin tuyển dụng");
        }
    };

    const formatSalary = (min, max) => {
        if (!min || !max) return "Thỏa thuận";
        return `${(min / 1000000).toFixed(0)}tr - ${(max / 1000000).toFixed(0)}tr VND`;
    };

    const filteredJobs = jobs.filter((job) => {
        const title = job?.title?.vi || job?.title?.en || job?.position || '';
        const searchMatch = title.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'ALL' || job.status === statusFilter;
        return searchMatch && statusMatch;
    });

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
                    <button className="my-jobs-back-btn" onClick={() => navigate('/recruiter/dashboard')}>
                        <ChevronLeft size={16} /> Quay lại Dashboard
                    </button>
                    <h1>Tin tuyển dụng của tôi</h1>
                    <p>Quản lý các vị trí đang tuyển dụng của doanh nghiệp</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/create-jd')}>
                    <Plus size={20} /> Đăng tin mới
                </button>
            </header>

            <div className="my-jobs-toolbar">
                <div className="my-jobs-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Tìm theo tiêu đề hoặc vị trí..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="my-jobs-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="OPEN">Đang mở</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="CLOSED">Đã đóng</option>
                    <option value="LOCK">Đã khóa</option>
                </select>
            </div>

            <div className="jobs-list">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <div key={job.id} className="job-item-card">
                            <div className="job-main-info">
                                <div className="job-header">
                                    <h3 className="job-title">{job?.title?.vi || job?.title?.en || job?.position || 'Tin tuyển dụng'}</h3>
                                    <span className={`status-badge ${(job?.status || 'UNKNOWN').toLowerCase()}`}>
                                        {job?.status || 'UNKNOWN'}
                                    </span>
                                </div>
                                <p className="job-pos">{job?.position || 'Chưa cập nhật vị trí'}</p>

                                <div className="job-meta">
                                    <div className="meta-item"><MapPin size={16}/> {job?.location || 'Chưa cập nhật địa điểm'}</div>
                                    <div className="meta-item"><DollarSign size={16}/> {formatSalary(job?.salaryMin, job?.salaryMax)}</div>
                                    <div className="meta-item"><Briefcase size={16}/> {job?.category?.name || 'Chưa phân loại'}</div>
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
                                    <button
                                        className="icon-btn edit"
                                        title="Xem / chỉnh sửa tin"
                                        onClick={() => navigate(`/detail-jd/${job.id}`)}
                                    >
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
                        <p>{jobs.length === 0 ? 'Chưa có bài đăng tuyển dụng nào.' : 'Không có kết quả phù hợp bộ lọc.'}</p>
                        <button onClick={() => navigate('/create-jd')}>Đăng tin ngay</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyJobsPage;