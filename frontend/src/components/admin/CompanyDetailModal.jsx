import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, X, FileCheck2, Globe, Shield, MapPin, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import adminService from '../../services/api/adminService';

const API_BASE_URL = "http://localhost:8081/identity";

const CompanyDetailModal = ({ isOpen, onClose, companyId }) => {
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!companyId || !isOpen) return;
            setDetailLoading(true);
            try {
                const data = await adminService.getCompanyDetail(companyId);
                if (data && data.result) {
                    setSelectedCompany(data.result);
                }
            } catch (error) {
                toast.error("Không thể lấy thông tin chi tiết");
                onClose();
            } finally {
                setDetailLoading(false);
            }
        };
        fetchDetail();
    }, [companyId, isOpen, onClose]);

    if (!isOpen) return null;

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    };

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
        }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}>
            <div className="modern-card" style={{
                width: '95%',
                maxWidth: '800px',
                maxHeight: '90vh',
                padding: 0,
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fcfcfd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="icon-box-primary">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Chi tiết doanh nghiệp</h2>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Thông vị đầy đủ và trạng thái pháp lý</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="action-btn"
                        style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ background: '#ffffff', padding: '32px', overflowY: 'auto', flex: 1 }}>
                    {detailLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                            <Loader2 className="spinning-icon" size={40} />
                        </div>
                    ) : selectedCompany ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Top Section */}
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div className="user-avatar-wrapper" style={{ width: '120px', height: '120px', borderRadius: '24px', flexShrink: 0 }}>
                                    {selectedCompany.imageUrl ? (
                                        <img src={getImageUrl(selectedCompany.imageUrl)} className="user-avatar" alt="" />
                                    ) : (
                                        <div className="user-avatar-placeholder" style={{ fontSize: '40px' }}>
                                            <Building2 size={48} />
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{selectedCompany.name}</h3>
                                        <div className={`status-indicator ${selectedCompany.status === 'ACTIVE' ? 'active' : selectedCompany.status === 'BAN' ? 'banned' : ''}`}>
                                            <div className="status-dot"></div>
                                            <span>{selectedCompany.status === 'ACTIVE' ? 'Đã xác thực' : selectedCompany.status === 'BAN' ? 'Đã khóa' : 'Chờ duyệt'}</span>
                                        </div>
                                    </div>
                                    <p style={{ margin: '8px 0', fontSize: '15px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileCheck2 size={16} /> MST: <b>{selectedCompany.taxId}</b>
                                    </p>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                        {selectedCompany.websiteUrl && (
                                            <a href={selectedCompany.websiteUrl} target="_blank" rel="noreferrer" className="action-btn" style={{ width: 'auto', padding: '0 16px', gap: '8px', fontSize: '13px', textDecoration: 'none' }}>
                                                <Globe size={16} /> Website
                                            </a>
                                        )}
                                        {selectedCompany.gpkdUrl && (
                                            <a href={getImageUrl(selectedCompany.gpkdUrl)} target="_blank" rel="noreferrer" className="action-btn" style={{ width: 'auto', padding: '0 16px', gap: '8px', fontSize: '13px', textDecoration: 'none', background: '#f5f3ff', color: '#6366f1', borderColor: '#e0e7ff' }}>
                                                <Shield size={16} /> Giấy phép kinh doanh
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: 0 }} />

                            {/* Grid Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Thông tin liên hệ</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div className="date-cell">
                                            <MapPin size={16} /> <span>{selectedCompany.address || 'Chưa cung cấp địa chỉ'}</span>
                                        </div>
                                        <div className="date-cell">
                                            <Calendar size={16} /> <span>Ngày tham gia: {new Date(selectedCompany.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Mô tả doanh nghiệp</h4>
                                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                                        {selectedCompany.description || "Doanh nghiệp này chưa cập nhật mô tả giới thiệu."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#fcfcfd' }}>
                    <button
                        onClick={onClose}
                        className="btn-primary"
                        style={{ borderRadius: '12px' }}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CompanyDetailModal;
