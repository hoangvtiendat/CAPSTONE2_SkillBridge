import React from 'react';
import { Settings, Clock } from 'lucide-react';
import '../../components/admin/Admin.css';

const SkillManagementPage = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '24px' }}>
            <div style={{ backgroundColor: '#eef2ff', padding: '24px', borderRadius: '50%', color: '#6366f1', border: '1px solid #e0e7ff' }}>
                <Settings size={48} className="spinning-icon" />
            </div>
            <div style={{ maxWidth: '400px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Quản lý Kỹ năng</h1>
                <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
                    Tính năng đang được phát triển. Phần này sẽ cho phép admin quản lý danh mục kĩ năng chuyên môn.
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '8px 16px', borderRadius: '20px', border: '1px solid #e0e7ff' }}>
                <Clock size={16} />
                <span>Coming Soon</span>
            </div>
            <style>
                {`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spinning-icon {
                    animation: spin-slow 4s linear infinite;
                }
                `}
            </style>
        </div>
    );
};

export default SkillManagementPage;
