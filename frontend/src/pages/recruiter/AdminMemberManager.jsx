import React, { useState, useEffect, useCallback } from 'react';
import companyService from '../../services/api/companyService';
import './AdminMemberManager.css';
import { toast, Toaster } from "sonner";
import { UserCheck, UserPlus, Shield, XCircle, CheckCircle, Phone, MapPin } from 'lucide-react';

const AdminMemberManager = () => {
    const [members, setMembers] = useState([]);
    const [pendingMembers, setPendingMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [memberRes, pendingRes] = await Promise.all([
                companyService.getMembers(),
                companyService.getMemberPending()
            ]);
            setMembers(memberRes.result || []);
            setPendingMembers(pendingRes.result || []);
        } catch (err) {
            toast.error("Không thể tải danh sách nhân viên");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAction = async (requestId, status) => {
        const actionText = status === 'APPROVED' ? "Chấp nhận" : "Từ chối";
        const toastId = toast.loading(`Đang ${actionText.toLowerCase()}...`);
        try {
            await companyService.respondJoinRequest(requestId, status);
            toast.success(`${actionText} thành công!`, { id: toastId });
            loadData();
        } catch (err) {
            toast.error("Thao tác thất bại", { id: toastId });
        }
    };

    return (
        <div className="member-manager-container">
            <Toaster position="top-right" richColors />

            <div className="manager-header">
                <div className="header-info">
                    <h2>Quản lý nhân sự</h2>
                </div>
            </div>

            {pendingMembers.length > 0 && (
                <div className="section-card pending-section">
                    <h3 className="section-title"><UserPlus size={18} color="#f59e0b" /> Yêu cầu đang chờ ({pendingMembers.length})</h3>
                    <div className="member-table-wrapper">
                        <table className="member-table">
                            <thead>
                                <tr>
                                    <th>Nhân viên</th>
                                    <th>Vai trò yêu cầu</th>
                                    <th>Thông tin liên hệ</th>
                                    <th style={{ textAlign: 'right' }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingMembers.map(m => (
                                    <tr key={m.memberId || m.id} className="row-pending">
                                        <td>
                                            <div className="user-info">
                                                <div className="avatar-small">{m.recruiterName?.charAt(0) || 'U'}</div>
                                                <div>
                                                    <div className="name">{m.recruiterName}</div>
                                                    <div className="email-sub">{m.recruiterEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge-role">{m.role}</span></td>
                                        <td>
                                            <div className="contact-info">
                                                <div className="contact-item"><Phone size={14} color="#6366f1" /> {m.recruiterPhoneNumber || 'N/A'}</div>
                                                <div className="contact-item"><MapPin size={14} color="#ef4444" /> <span className="address-text">{m.recruiterAddress || 'Chưa cập nhật'}</span></div>
                                            </div>
                                        </td>
                                        <td className="action-cell">
                                            <button className="btn-approve-icon" title="Duyệt" onClick={() => handleAction(m.memberId || m.id, 'APPROVED')}>
                                                <CheckCircle size={20} />
                                            </button>
                                            <button className="btn-reject-icon" title="Từ chối" onClick={() => handleAction(m.memberId || m.id, 'REJECTED')}>
                                                <XCircle size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PHẦN 2: THÀNH VIÊN CHÍNH THỨC */}
            <div className="section-card">
                <h3 className="section-title"><UserCheck size={18} color="#10b981" /> Thành viên công ty ({members.length})</h3>
                <div className="member-table-wrapper">
                    <table className="member-table">
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Vai trò</th>
                                <th>Thông tin liên hệ</th>
                                <th className="text-center">Số tin đã đăng</th>
                                <th style={{ textAlign: 'right' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m.memberId || m.id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="avatar-small">{m.recruiterName?.charAt(0) || 'U'}</div>
                                            <div>
                                                <div className="name">{m.recruiterName}</div>
                                                <div className="email-sub">{m.recruiterEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-role ${m.role === 'ADMIN' ? 'role-admin' : ''}`}>
                                            {m.role === 'ADMIN' ? <Shield size={12} /> : null} {m.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="contact-info">
                                            <div className="contact-item"><Phone size={14} color="#6366f1" /> {m.recruiterPhoneNumber || 'N/A'}</div>
                                            <div className="contact-item"><MapPin size={14} color="#ef4444" /> <span className="address-text">{m.recruiterAddress || 'Chưa cập nhật'}</span></div>
                                        </div>
                                    </td>
                                    <td className="text-center">{m.totalPosts || 0}</td>
                                    <td className="action-cell">
                                        {m.role !== 'ADMIN' && (
                                            <button className="btn-delete-text" onClick={() => toast.error("Xác nhận xóa nhân viên?")}>
                                                Xóa
                                            </button>
                                        )}
                                        {m.role === 'ADMIN' && <span className="owner-text">Chủ sở hữu</span>}
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

export default AdminMemberManager;