import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BarChart3, Briefcase, Users, Eye, Download } from 'lucide-react';
import analyticsService from '../../services/api/analyticsService';
import './RecruiterAnalyticsPage.css';

const toNumber = (value) => Number(value || 0);

const RecruiterAnalyticsPage = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rangeDays, setRangeDays] = useState(30);

    const fetchSummary = async (days) => {
        setLoading(true);
        try {
            const response = await analyticsService.getRecruiterSummary({ days });
            setSummary(response?.result || response || null);
        } catch (error) {
            toast.error('Không thể tải dữ liệu phân tích');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary(rangeDays);
    }, [rangeDays]);

    const cards = useMemo(() => [
        { label: 'Tin đã đăng', value: toNumber(summary?.totalJobs), icon: Briefcase },
        { label: 'Ứng tuyển nhận được', value: toNumber(summary?.totalApplications), icon: Users },
        { label: 'Lượt xem tin', value: toNumber(summary?.totalViews), icon: Eye },
        { label: 'Tỉ lệ chuyển đổi', value: `${toNumber(summary?.conversionRate).toFixed(1)}%`, icon: BarChart3 }
    ], [summary]);

    const handleExport = async () => {
        try {
            await analyticsService.exportRecruiterCsv({ days: rangeDays });
            toast.success('Đang tải file CSV');
        } catch (error) {
            toast.error('Xuất file CSV thất bại');
        }
    };

    return (
        <div className="recruiter-analytics-page">
            <div className="analytics-header">
                <div>
                    <h1>Phan tich tuyen dung</h1>
                    <p>Theo doi hieu suat tuyen dung cua cong ty theo thoi gian thuc.</p>
                </div>
                <div className="analytics-actions">
                    <select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))}>
                        <option value={7}>7 ngay</option>
                        <option value={30}>30 ngay</option>
                        <option value={90}>90 ngay</option>
                    </select>
                    <button type="button" onClick={handleExport}>
                        <Download size={16} /> Xuat CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="analytics-loading">Dang tai du lieu...</div>
            ) : (
                <div className="analytics-grid">
                    {cards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <article key={card.label} className="analytics-card">
                                <div className="analytics-card-icon">
                                    <Icon size={18} />
                                </div>
                                <div className="analytics-card-content">
                                    <span>{card.label}</span>
                                    <strong>{card.value}</strong>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RecruiterAnalyticsPage;
