import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    ArrowUpRight,
    MessageSquare,
    Bot,
    Filter,
    Download,
    Calendar,
    ChevronDown,
    Activity,
    Briefcase,
    Clock
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, LineChart, Line, Legend, Cell, ComposedChart
} from 'recharts';
import '../../components/recruiter/Recruiter.css';
import analyticsService from '../../services/api/analyticsService';
import jobService from '../../services/api/jobService';
import useCompanyDeactivationCheck from '../../hooks/useCompanyDeactivationCheck';
import { toast } from 'sonner';

const RecruiterDashboardPage = () => {
    // Check if company is deactivated and prevent access
    useCompanyDeactivationCheck(['/recruiter/settings', '/recruiter/analytics']);

    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [filters, setFilters] = useState({
        jobId: '',
        timeRange: '30' // days
    });

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [filters]);

    const fetchJobs = async () => {
        try {
            const response = await jobService.getMyCompanyJobs();
            const jobList = response?.result || []; // Based on getMyCompanyJobs returning response.data
            setJobs(jobList);
        } catch (error) {
            console.error("Error fetching jobs:", error);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - parseInt(filters.timeRange));

            const params = {
                jobId: filters.jobId || undefined,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };

            const response = await analyticsService.getRecruiterSummary(params);
            setStatsData(response.result); // response is now the unwrapped ApiResponse object
        } catch (error) {
            console.error("Error fetching analytics:", error);
            // Fallback for demo if API fails
            toast.error("Không thể tải dữ liệu thống kê thực tế");
        } finally {
            setLoading(false);
        }
    };

    // Custom Select Component for better UX
    const CustomSelect = ({ label, icon: Icon, value, options, onChange, placeholder }) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find(opt => opt.value === value);

        return (
            <div className={`custom-select-container ${isOpen ? 'is-open' : ''}`}>
                <div className="custom-select-trigger" onClick={() => setIsOpen(!isOpen)}>
                    <div className="trigger-content">
                        <Icon size={18} className="filter-icon" />
                        <span className="selected-value">
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={14} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
                </div>

                {isOpen && (
                    <>
                        <div className="custom-select-overlay" onClick={() => setIsOpen(false)} />
                        <div className="custom-select-options">
                            {options.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`custom-option ${value === opt.value ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const handleExport = async () => {
        try {
            await analyticsService.exportRecruiterCsv({
                jobId: filters.jobId || undefined,
                timeRange: filters.timeRange
            });
            toast.success("Đã xuất báo cáo thành công");
        } catch (error) {
            toast.error("Lỗi khi xuất báo cáo");
        }
    };

    if (!statsData && loading) return <div className="loading-spinner">Đang tải dữ liệu...</div>;

    const summary = statsData?.summary || {
        totalViews: 0,
        totalApplications: 0,
        qualifiedCandidates: 0,
        totalInterviews: 0,
        successfulHires: 0,
        timeToHire: 0,
        timeToFill: 0
    };

    const funnelData = statsData?.conversionFunnel || [];
    const trendData = statsData?.trends || [];

    const statsCards = [
        { label: 'Số lượt xem', value: summary.totalViews.toLocaleString(), sub: 'Tổng lượt tương tác', trend: 'neutral' },
        { label: 'Ứng viên', value: summary.totalApplications.toLocaleString(), sub: `${summary.qualifiedCandidates} đạt yêu cầu`, trend: 'positive' },
        { label: 'Phỏng vấn', value: summary.totalInterviews.toLocaleString(), sub: 'Quy trình hoạt động', trend: 'neutral' },
        { label: 'Tuyển dụng', value: summary.successfulHires.toLocaleString(), sub: 'Thành công', trend: 'positive' },
    ];

    return (
        <div className="recruiter-dashboard animate-fade-in">
            {/* Filters Bar */}
            <div className="dashboard-filters-bar glass-morphism">
                <CustomSelect
                    icon={Briefcase}
                    value={filters.jobId}
                    options={[
                        { value: '', label: 'Tất cả bài đăng' },
                        ...jobs.map(j => ({ value: j.id, label: j.position }))
                    ]}
                    onChange={(val) => setFilters({ ...filters, jobId: val })}
                    placeholder="Chọn bài đăng"
                />

                <CustomSelect
                    icon={Calendar}
                    value={filters.timeRange}
                    options={[
                        { value: '7', label: '7 ngày qua' },
                        { value: '30', label: '30 ngày qua' },
                        { value: '90', label: '3 tháng qua' },
                        { value: '180', label: '6 tháng qua' }
                    ]}
                    onChange={(val) => setFilters({ ...filters, timeRange: val })}
                    placeholder="Khoảng thời gian"
                />

                <button className="btn-export-csv" onClick={handleExport}>
                    <Download size={18} />
                    <span>Xuất báo cáo</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {statsCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <p className="stat-label">{stat.label}</p>
                        <h3 className="stat-value">{stat.value}</h3>
                        <p className={`stat-change ${stat.trend}`}>
                            {stat.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="dashboard-charts-grid">
                <div className="chart-container glass-morphism">
                    <div className="chart-header">
                        <h4><TrendingUp size={18} /> Xu hướng ứng tuyển</h4>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--sf-blue)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--sf-blue)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#86868b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#86868b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="applications" stroke="var(--sf-blue)" fillOpacity={1} fill="url(#colorApps)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container glass-morphism">
                    <div className="chart-header">
                        <h4><Activity size={18} /> Tỷ lệ chuyển đổi</h4>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#007aff' : index === 1 ? '#34c759' : index === 2 ? '#ff9500' : '#ff3b30'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Efficiency Metrics */}
            <div className="efficiency-grid">
                <div className="efficiency-card">
                    <span className="eff-label">Time-to-Hire trung bình</span>
                    <span className="eff-value">{summary.timeToHire.toFixed(1)} ngày</span>
                </div>
                <div className="efficiency-card">
                    <span className="eff-label">Time-to-Fill trung bình</span>
                    <span className="eff-value">{summary.timeToFill.toFixed(1)} ngày</span>
                </div>
            </div>

            <div className="dashboard-sections-header" style={{ marginTop: '40px' }}>
                <h3>Phễu ứng viên gần đây</h3>
                <a href="/recruiter/candidates" className="btn-view-all">Quản lý ứng viên</a>
            </div>
            {/* The existing candidate pipeline columns could be kept or simplified */}
        </div>
    );
};

export default RecruiterDashboardPage;
