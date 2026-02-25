import React from 'react';
import {
    Users,
    Building2,
    Briefcase,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import '../../components/admin/Admin.css';

const AdminDashboardPage = () => {
    const stats = [
        { title: 'Người dùng', value: '1,234', change: '+12%', icon: <Users size={20} />, color: '#2563eb', bg: '#eff6ff' },
        { title: 'Công ty', value: '86', change: '+5%', icon: <Building2 size={20} />, color: '#9333ea', bg: '#faf5ff' },
        { title: 'Tin tuyển dụng', value: '450', change: '+24%', icon: <Briefcase size={20} />, color: '#059669', bg: '#ecfdf5' },
        { title: 'Giao dịch mới', value: '12M VNĐ', change: '+8%', icon: <TrendingUp size={20} />, color: '#d97706', bg: '#fffbeb' },
    ];

    return (
        <div className="admin-dashboard">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', margin: 0, fontWeight: '900', color: '#0f172a' }}>Hệ thống Quản trị</h1>
                    <p style={{ margin: '8px 0 0', color: '#64748b' }}>Chào mừng quay trở lại, đây là những gì đang diễn ra trong hôm nay.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button style={{
                        backgroundColor: 'white',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#475569'
                    }}>
                        <Clock size={16} />
                        Lịch sử
                    </button>
                    <button className="btn-primary" style={{ boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)' }}>
                        Tải báo cáo
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="flex-between" style={{ marginBottom: '16px' }}>
                            <div className="stat-icon-container" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                {stat.icon}
                            </div>
                            <span className="stat-change">
                                {stat.change}
                            </span>
                        </div>
                        <p className="stat-title">{stat.title}</p>
                        <h3 className="stat-value">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginTop: '32px' }}>
                {/* Recent Activities */}
                <div className="data-card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ backgroundColor: '#4f46e5', color: 'white', padding: '10px', borderRadius: '12px' }}>
                                <Clock size={20} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Hoạt động gần đây</h2>
                                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>12 hoạt động mới trong 24h qua</p>
                            </div>
                        </div>
                        <button style={{ color: '#4f46e5', fontWeight: '700', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>Xem tất cả</button>
                    </div>
                    <div style={{ padding: '12px' }}>
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', color: '#94a3b8' }}>
                                    <CheckCircle2 size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                                        <span style={{ fontWeight: '800', color: '#0f172a' }}>Admin</span> đã duyệt yêu cầu từ <span style={{ color: '#4f46e5', fontWeight: '800' }}>FPT Software</span>
                                    </p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>10 phút trước • Hệ thống tự động</p>
                                </div>
                                <div style={{ display: 'none' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#64748b' }}>Approved</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications/Alerts */}
                <div className="data-card">
                    <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '10px', borderRadius: '12px' }}>
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Cần xử lý</h2>
                                <p style={{ margin: 0, fontSize: '11px', color: '#ef4444', fontWeight: '800' }}>Yêu cầu khẩn cấp</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ padding: '20px', backgroundColor: '#fff1f2', borderRadius: '24px', border: '1px solid #ffe4e6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ background: 'white', color: '#e11d48', border: '1px solid #ffe4e6', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800' }}>Doanh nghiệp</span>
                            </div>
                            <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>3 yêu cầu xác minh mã số thuế đang chờ xử lý</p>
                            <button className="btn-primary" style={{ width: '100%', backgroundColor: '#e11d48' }}>Bắt đầu xử lý</button>
                        </div>

                        <div style={{ padding: '20px', backgroundColor: '#fffbeb', borderRadius: '24px', border: '1px solid #fef3c7' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ background: 'white', color: '#d97706', border: '1px solid #fef3c7', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800' }}>Tin tuyển dụng</span>
                            </div>
                            <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>15 tin đăng cần rà soát lại nội dung vi phạm</p>
                            <button className="btn-primary" style={{ width: '100%', backgroundColor: '#0f172a' }}>Xem chi tiết</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
