import React, {useEffect, useState} from 'react';
import adminService from '../../services/api/adminService';
import {
    Users, Building2, Briefcase, DollarSign,
    TrendingUp, TrendingDown, Calendar, Filter, ChevronDown
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- STATE CHO BỘ LỌC ---
    const [filterType, setFilterType] = useState('thisMonth'); // Mặc định: Tháng này
    const [customRange, setCustomRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Helper: Định dạng Date thành YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Logic tính toán khoảng ngày dựa trên FilterType
    const calculateDates = () => {
        const now = new Date();
        let startDate, endDate = now;

        switch (filterType) {
            case 'thisWeek':
                const day = now.getDay();
                const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
                startDate = new Date(now.setDate(diffToMonday));
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                return {start: customRange.start, end: customRange.end};
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        return {start: formatDate(startDate), end: formatDate(endDate)};
    };

    const fetchStats = async () => {
        setLoading(true);
        const {start, end} = calculateDates();
        try {
            const response = await adminService.getOverviewStats(start, end);
            if (response.code === 200) setData(response.result);
        } catch (error) {
            console.error("Lỗi fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    // Gọi lại API khi filterType thay đổi hoặc khi customRange thay đổi
    useEffect(() => {
        fetchStats();
    }, [filterType]);

    // Riêng cho custom range, có nút "Áp dụng" để tránh gọi API liên tục khi đang gõ
    const handleApplyCustomRange = () => {
        fetchStats();
    };

    if (loading) return <div className="admin-loading">Đang cập nhật dữ liệu...</div>;
    if (!data) return <div className="admin-error">Không thể kết nối dữ liệu.</div>;

    const {overview, growth, pending, charts, topCompanies} = data;
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(val);

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <div className="header-title">
                    <h1>Hệ thống Quản trị</h1>
                    <p>Chào mừng trở lại, Admin</p>
                </div>


                {/* --- BỘ LỌC THỜI GIAN --- */}
                <div className="filter-section">
                    <div className="filter-control">
                        <Filter size={16}/>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="filter-select"
                        >
                            <option value="thisWeek">Tuần này</option>
                            <option value="thisMonth">Tháng này</option>
                            <option value="thisYear">Năm nay</option>
                            <option value="custom">Tùy chỉnh</option>
                        </select>
                    </div>

                    {filterType === 'custom' && (
                        <div className="custom-range animate-in">
                            <input
                                type="date"
                                value={customRange.start}
                                onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                                className="date-input"
                            />
                            <span>đến</span>
                            <input
                                type="date"
                                value={customRange.end}
                                onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                                className="date-input"
                            />
                            <button onClick={handleApplyCustomRange} className="btn-apply">Lọc</button>
                        </div>
                    )}

                    <div className="pending-alerts">
                        <div className="alert-badge">
                            <Building2 size={18}/> <span>{pending.pendingCompanies} Công ty chờ duyệt</span>
                        </div>
                        <div className="alert-badge">
                            <Briefcase size={18}/> <span>{pending.pendingJobs} Tin tuyển dụng chờ duyệt</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 1. STAT CARDS */}
            <div className="stats-grid">
                <StatCard title="Người dùng" value={overview.totalUsers} growth={growth.userGrowthPercent}
                          icon={<Users color="#6366f1"/>}/>
                <StatCard title="Công ty" value={overview.totalCompanies} growth={growth.companyGrowthPercent}
                          icon={<Building2 color="#10b981"/>}/>
                <StatCard title="Tin tuyển dụng" value={overview.totalJobs} growth={growth.jobGrowthPercent}
                          icon={<Briefcase color="#f59e0b"/>}/>
                <StatCard title="Doanh thu" value={formatCurrency(overview.totalRevenue)}
                          growth={growth.revenueGrowthPercent} icon={<DollarSign color="#ef4444"/>}/>
            </div>

            {/* 2 & 3. CHARTS */}
            <div className="charts-section">
                <div className="chart-container glass-morphism">
                    <div className="chart-header" style={{marginBottom: '20px'}}>
                        <h3>Biến động doanh thu</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={charts.revenueByMonth}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
                            <XAxis
                                dataKey="month"
                                tickFormatter={(v) => `T${v}`}
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 12, fill: '#86868b'}}
                            />
                            <YAxis
                                tickFormatter={(v) => `${v / 1000000}M`}
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 12, fill: '#86868b'}}
                            />
                            <Tooltip
                                formatter={(v) => formatCurrency(v)}
                                contentStyle={{
                                    borderRadius: '15px',
                                    border: 'none',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container glass-morphism">
                    <div className="chart-header" style={{marginBottom: '20px'}}>
                        <h3>Tăng trưởng tin đăng</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={charts.jobGrowthByMonth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
                            <XAxis
                                dataKey="month"
                                tickFormatter={(v) => `T${v}`}
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 12, fill: '#86868b'}}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 12, fill: '#86868b'}}
                            />
                            <Tooltip
                                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                                contentStyle={{
                                    borderRadius: '15px',
                                    border: 'none',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Bar
                                dataKey="totalJobs"
                                fill="#34c759"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4. TOP COMPANIES */}
            <div className="top-companies">
                <h3>Doanh nghiệp hàng đầu</h3>
                <div className="table-wrapper">
                    <table>
                        <thead>
                        <tr>
                            <th>Tên công ty</th>
                            <th>Số tin đăng</th>
                            <th>Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {topCompanies.map((company, index) => (
                            <tr key={index}>
                                <td><strong>{company.companyName}</strong></td>
                                <td><span className="job-count-badge">{company.totalJobs} tin</span></td>
                                <td>
                                    <button className="btn-view"
                                            onClick={() => window.location.href = `/admin/companies/${company.companyId}`}>Chi
                                        tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({title, value, growth, icon}) => (
    <div className="stat-card">
        <div className="stat-card-header">
            <div className="stat-icon">{icon}</div>
            <div className={`growth-indicator ${growth >= 0 ? 'up' : 'down'}`}>
                {growth >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                {Math.abs(growth).toFixed(1)}%
            </div>
        </div>
        <div className="stat-card-body">
            <h4>{value}</h4>
            <p>{title}</p>
        </div>
    </div>
);

export default AdminDashboard;