import React, { useEffect, useState } from 'react';
import adminService from '../../services/api/adminService';
import {
    Users, Building2, Briefcase, DollarSign,
    TrendingUp, TrendingDown, Clock3
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminService.getOverviewStats();
                if (response.code === 200) setData(response.result);
            } catch (error) {
                console.error("Lỗi fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="admin-loading">Đang tải dữ liệu hệ thống...</div>;
    if (!data) return <div>Không có dữ liệu.</div>;

    const { overview, growth, pending, charts, topCompanies } = data;

    // Helper để format tiền tệ
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Hệ thống Quản trị</h1>
                    <p>Chào mừng trở lại, Admin</p>
                </div>
                <div className="pending-alerts">
                    <div className="alert-badge">
                        <Building2 size={18} /> <span>{pending.pendingCompanies} Công ty chờ duyệt</span>
                    </div>
                    <div className="alert-badge">
                        <Briefcase size={18} /> <span>{pending.pendingJobs} Tin tuyển dụng chờ duyệt</span>
                    </div>
                </div>
            </header>

            {/* 1. STAT CARDS */}
            <div className="stats-grid">
                <StatCard
                    title="Tổng người dùng" value={overview.totalUsers}
                    growth={growth.userGrowthPercent} icon={<Users color="#6366f1" />}
                />
                <StatCard
                    title="Tổng doanh nghiệp" value={overview.totalCompanies}
                    growth={growth.companyGrowthPercent} icon={<Building2 color="#10b981" />}
                />
                <StatCard
                    title="Tổng tin đăng" value={overview.totalJobs}
                    growth={growth.jobGrowthPercent} icon={<Briefcase color="#f59e0b" />}
                />
                <StatCard
                    title="Tổng doanh thu" value={formatCurrency(overview.totalRevenue)}
                    growth={growth.revenueGrowthPercent} icon={<DollarSign color="#ef4444" />}
                />
            </div>

            <div className="charts-section">
                {/* 2. REVENUE CHART */}
                <div className="chart-container">
                    <h3>Biến động doanh thu (6 tháng gần nhất)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={charts.revenueByMonth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickFormatter={(val) => `Tháng ${val}`} />
                            <YAxis tickFormatter={(val) => `${val/1000000}M`} />
                            <Tooltip formatter={(val) => formatCurrency(val)} />
                            <Line type="monotone" dataKey="revenue" stroke="#001F3F" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. JOB GROWTH CHART */}
                <div className="chart-container">
                    <h3>Tăng trưởng tin tuyển dụng</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={charts.jobGrowthByMonth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickFormatter={(val) => `Tháng ${val}`} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalJobs" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4. TOP COMPANIES TABLE */}
            <div className="top-companies">
                <h3>Top Doanh nghiệp nổi bật</h3>
                <div className="table-wrapper">
                    <table>
                        <thead>
                        <tr>
                            <th>Tên công ty</th>
                            <th>ID</th>
                            <th>Tổng tin đăng</th>
                            <th>Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {topCompanies.map((company, index) => (
                            <tr key={index}>
                                <td><strong>{company.companyName}</strong></td>
                                <td className="text-muted">{company.companyId}</td>
                                <td><span className="job-count-badge">{company.totalJobs} tin</span></td>
                                <td><button className="btn-view">Chi tiết</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, growth, icon }) => (
    <div className="stat-card">
        <div className="stat-card-header">
            <div className="stat-icon">{icon}</div>
            <div className={`growth-indicator ${growth >= 0 ? 'up' : 'down'}`}>
                {growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(growth)}%
            </div>
        </div>
        <div className="stat-card-body">
            <h4>{value}</h4>
            <p>{title}</p>
        </div>
    </div>
);

export default AdminDashboard;