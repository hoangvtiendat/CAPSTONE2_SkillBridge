import React from 'react';
import {
    TrendingUp,
    ArrowUpRight,
    MessageSquare,
    Bot
} from 'lucide-react';
import '../../components/recruiter/Recruiter.css';

const RecruiterDashboardPage = () => {
    // Mock data for the dashboard as requested
    const stats = [
        { label: 'Tổng số lượt xem', value: '24,500', change: '+12% tuần này', trend: 'positive' },
        { label: 'Số lượng ứng tuyển', value: '1,240', change: '+5% tuần này', trend: 'positive' },
        { label: 'Buổi phỏng vấn', value: '48', change: 'Quy trình hoạt động', trend: 'neutral' },
        { label: 'Đã tuyển', value: '12', change: 'Tháng này', trend: 'neutral' },
    ];

    const pipelineData = {
        applied: [
            { id: 1, name: 'Nguyễn Văn A', role: 'Senior React Dev', exp: '5 năm kinh nghiệm', unread: true },
            { id: 2, name: 'Lê Thị B', role: 'Fullstack', exp: '3 năm kinh nghiệm', unread: false },
        ],
        review: [
            { id: 3, name: 'Trần Văn C', role: 'Đang đợi ký tên', exp: '-', unread: false },
        ],
        interview: [
            { id: 4, name: 'Phạm Thị D', role: 'Ngày mai, 10:00 SA', exp: '-', unread: false },
        ]
    };

    return (
        <div className="recruiter-dashboard animate-fade-in">
            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <p className="stat-label">{stat.label}</p>
                        <h3 className="stat-value">{stat.value}</h3>
                        <p className={`stat-change ${stat.trend}`}>
                            {stat.trend === 'positive' && <ArrowUpRight size={14} />}
                            {stat.change}
                        </p>
                    </div>
                ))}
            </div>

            {/* Candidate Pipeline */}
            <div className="dashboard-sections-header">
                <h3>Phễu ứng viên (Frontend Dev)</h3>
                <a href="/recruiter/candidates" className="btn-view-all">Xem tất cả</a>
            </div>

            <div className="pipeline-grid">
                {/* Applied Column */}
                <div className="pipeline-column">
                    <div className="column-header">
                        <span className="column-title">Hồ sơ mới</span>
                        <span className="column-count">{pipelineData.applied.length}</span>
                    </div>
                    {pipelineData.applied.map(candidate => (
                        <div key={candidate.id} className="candidate-card applied">
                            <div className="card-header">
                                <h4 className="candidate-name">{candidate.name}</h4>
                                {candidate.unread && <div className="unread-dot"></div>}
                            </div>
                            <p className="candidate-role">{candidate.role}</p>
                            <div className="candidate-meta">
                                <span className="meta-item">{candidate.exp}</span>
                            </div>
                        </div>
                    ))}
                    <div className="candidate-card applied" style={{ opacity: 0.5, borderStyle: 'dashed', borderWidth: '2px', backgroundColor: 'transparent', boxShadow: 'none' }}>
                        <p style={{ textAlign: 'center', fontSize: '13px', margin: '4px 0', color: '#94a3b8' }}>+ Thêm ứng viên</p>
                    </div>
                </div>

                {/* Review Column */}
                <div className="pipeline-column">
                    <div className="column-header">
                        <span className="column-title">Đang đánh giá</span>
                        <span className="column-count">{pipelineData.review.length}</span>
                    </div>
                    {pipelineData.review.map(candidate => (
                        <div key={candidate.id} className="candidate-card review">
                            <div className="card-header">
                                <h4 className="candidate-name">{candidate.name}</h4>
                            </div>
                            <p className="candidate-role">{candidate.role}</p>
                        </div>
                    ))}
                </div>

                {/* Interview Column */}
                <div className="pipeline-column">
                    <div className="column-header">
                        <span className="column-title">Phỏng vấn</span>
                        <span className="column-count">{pipelineData.interview.length}</span>
                    </div>
                    {pipelineData.interview.map(candidate => (
                        <div key={candidate.id} className="candidate-card interview">
                            <div className="card-header">
                                <h4 className="candidate-name">{candidate.name}</h4>
                            </div>
                            <p className="candidate-role">{candidate.role}</p>
                            <button className="btn-view-details">Xem chi tiết</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="bot-floating-btn" title="Trợ lý AI">
                <Bot size={28} />
            </div>
        </div>
    );
};

export default RecruiterDashboardPage;
