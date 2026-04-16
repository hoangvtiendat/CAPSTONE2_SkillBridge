import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Inbox, Loader2 } from "lucide-react";
import candidateService from '../../services/api/candidateService';

const InvitationsPortal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const s = {
    overlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 9999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    backdrop: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },
    content: {
      position: 'relative',
      width: '100%',
      maxWidth: '460px',
      // Chiều cao này giữ cho Portal đứng form
      height: '620px',
      background: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: { padding: '24px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: {
      width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0',
      background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer'
    },
    filterWrapper: { padding: '8px 24px 16px' },
    segmentedControl: { display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' },
    segBtn: (isActive) => ({
      flex: 1, border: 'none', padding: '10px 0', fontSize: '13px', fontWeight: '600',
      background: isActive ? '#ffffff' : 'transparent',
      color: isActive ? '#2563eb' : '#64748b',
      borderRadius: '8px', cursor: 'pointer',
      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
      transition: 'all 0.2s'
    }),
    body: {
      flex: 1,
      // FIX: Luôn cho phép cuộn nhưng giữ chiều cao cố định
      overflowY: 'auto',
      padding: '0 24px 24px',
      display: 'flex',
      flexDirection: 'column',
      scrollbarWidth: 'thin', // Cho Firefox
    },
    card: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px', border: '1px solid #f1f5f9', borderRadius: '16px',
      marginBottom: '12px', cursor: 'pointer', background: '#fff', transition: '0.2s',
      height: '80px', // Chiều cao cố định của card
      flexShrink: 0, // Quan trọng: Không cho card bị bóp méo khi cuộn
      boxSizing: 'border-box'
    },
    title: {
      fontSize: '15px', margin: 0, color: '#1e293b', fontWeight: 600,
      maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
    },
    badge: (isExpired) => ({
      fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px',
      textTransform: 'uppercase',
      background: isExpired ? '#fee2e2' : '#dcfce7',
      color: isExpired ? '#991b1b' : '#166534'
    }),
    emptyState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8'
    }
  };

  useEffect(() => {
    if (isOpen) {
      const fetchInvitations = async () => {
        setIsLoading(true);
        try {
          const response = await candidateService.getMyInvitations();
          setInvitations(response.result || []);
        } catch (error) {
          console.error("Lỗi lấy lời mời:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInvitations();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const filteredData = useMemo(() => {
    const now = new Date();
    // Bỏ .slice(0, 5) để lấy toàn bộ dữ liệu cho phép cuộn
    return invitations.filter(inv => {
      const isExpired = new Date(inv.expiresAt) < now;
      if (filter === 'ACTIVE') return !isExpired;
      if (filter === 'EXPIRED') return isExpired;
      return true;
    });
  }, [filter, invitations]);

  const activeCount = useMemo(() =>
    invitations.filter(inv => new Date(inv.expiresAt) >= new Date()).length
  , [invitations]);

  if (!isOpen) return null;

  return createPortal(
    <div style={s.overlay}>
      {/* Thêm style cho thanh cuộn đẹp hơn */}
      <style>{`
        .portal-body::-webkit-scrollbar { width: 6px; }
        .portal-body::-webkit-scrollbar-track { background: transparent; }
        .portal-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .portal-body::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      <div style={s.backdrop} onClick={onClose} />

      <div style={s.content}>
        <div style={s.header}>
          <div>
            <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700, color: '#0f172a' }}>Lời mời làm việc</h2>
            <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#64748b' }}>
              {isLoading ? 'Đang tải dữ liệu...' : `Bạn có ${activeCount} lời mời còn hạn`}
            </p>
          </div>
          <button style={s.closeBtn} onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div style={s.filterWrapper}>
          <div style={s.segmentedControl}>
            {['ALL', 'ACTIVE', 'EXPIRED'].map((type) => (
              <button key={type} style={s.segBtn(filter === type)} onClick={() => setFilter(type)}>
                {type === 'ALL' ? 'Tất cả' : type === 'ACTIVE' ? 'Còn hạn' : 'Hết hạn'}
              </button>
            ))}
          </div>
        </div>

        <div style={s.body} className="portal-body">
          {isLoading ? (
            <div style={s.emptyState}>
              <Loader2 size={32} style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((inv) => {
              const isExpired = new Date(inv.expiresAt) < new Date();
              return (
                <div key={inv.id} style={s.card} onClick={() => { onClose(); navigate(`/jobs/${inv.job.id}`); }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={s.title} title={inv.job.title}>{inv.job.title}</h4>
                    <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                      {inv.job.companyName} • {inv.job.location}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px' }}>
                    <span style={s.badge(isExpired)}>
                      {isExpired ? 'Hết hạn' : 'Còn hạn'}
                    </span>
                    <ChevronRight size={16} color="#cbd5e1" />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={s.emptyState}>
              <Inbox size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>Không có lời mời nào</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InvitationsPortal;