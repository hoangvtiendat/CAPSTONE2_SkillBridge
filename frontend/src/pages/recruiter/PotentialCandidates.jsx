import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import candidateService from '../../services/api/candidateService';
import {
    MapPin, Mail, Phone, User, Loader2, Send, CheckCircle, Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import CandidateProfileOverlay from './CandidateProfileOverlay';
import './PotentialCandidates.css';

const PotentialCandidates = () => {
    const { jobId } = useParams();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null); // Lưu object ứng viên được chọn
    const [invitedIds, setInvitedIds] = useState(new Set());

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const response = await candidateService.getPotentialCandidates(jobId);
                setCandidates(response.result || []);
            } catch (error) {
                toast.error("Không thể tải danh sách ứng viên");
            } finally {
                setLoading(false);
            }
        };
        if (jobId) fetchCandidates();
    }, [jobId]);

    const handleSendInvitation = (id) => {
        setInvitedIds(prev => new Set(prev).add(id));
        toast.success("Đã gửi lời mời ứng tuyển thành công!");
    };

    const maskInfo = (info, type, isInvited) => {
        if (!info) return "N/A";
        if (isInvited) return info;
        if (type === 'email') {
            const [name, domain] = info.split('@');
            return `${name[0]}••••${name[name.length - 1]}@${domain}`;
        }
        if (type === 'phone') return `${info.slice(0, 3)}••••${info.slice(-3)}`;
        return `${info.slice(0, 4)}••••`;
    };

    if (loading) return (
        <div className="loading-state">
            <Loader2 className="animate-spin" size={42} color="#2563eb" />
            <p>Hệ thống AI đang phân tích hồ sơ phù hợp...</p>
        </div>
    );

    return (
        <div className="potential-compact-wrapper">
            <div className="header-compact">
                <h1><Trophy size={24} color="#fbbf24" style={{marginRight: '8px'}}/> Ứng Viên Tiềm Năng</h1>
            </div>

            <div className="candidates-grid-compact">
                {candidates.map((can) => {
                    const isInvited = invitedIds.has(can.id);
                    const matchScore = (can.aiMatchingScore * 100).toFixed(0);
                    const getScoreColor = (s) => s >= 80 ? '#10b981' : (s >= 50 ? '#3b82f6' : '#f59e0b');

                    return (
                        <div key={can.id} className="candidate-card-compact">
                            <div className="score-mini">
                                <svg viewBox="0 0 36 36">
                                    <path className="bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                    <path className="progress" stroke={getScoreColor(matchScore)} strokeDasharray={`${matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                </svg>
                                <span>{matchScore}%</span>
                            </div>

                            <div className="card-top-compact">
                                <div className="avatar-mini">
                                    {can.avatar ? <img src={can.avatar} alt="" /> : <User size={24} color="#cbd5e1" />}
                                </div>
                                <div className="meta-mini">
                                    <h3>{can.name}</h3>
                                    <div className="loc-mini"><MapPin size={10} /> {maskInfo(can.address, 'address', isInvited)}</div>
                                </div>
                            </div>

                            <div className="desc-mini">{can.description || "Chưa có giới thiệu."}</div>

                            <div className="contact-row-mini">
                                <div className="pill-mini"><Mail size={12}/> {maskInfo(can.email, 'email', isInvited)}</div>
                                <div className="pill-mini"><Phone size={12}/> {maskInfo(can.phoneNumber, 'phone', isInvited)}</div>
                            </div>

                            <div className="actions-mini">
                                <button className={`btn-inv-mini ${isInvited ? 'invited' : ''}`} onClick={() => handleSendInvitation(can.id)} disabled={isInvited}>
                                    {isInvited ? <CheckCircle size={14}/> : <Send size={14}/>} {isInvited ? 'Đã mời' : 'Mời'}
                                </button>
                                {/* CẬP NHẬT: Lưu nguyên object vào state */}
                                <button className="btn-det-mini" onClick={() => setSelectedCandidate(can)}>Hồ sơ</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CẬP NHẬT: Truyền prop candidateData */}
            {selectedCandidate && (
                <CandidateProfileOverlay
                    candidateData={selectedCandidate}
                    isInvited={invitedIds.has(selectedCandidate.id)}
                    onClose={() => setSelectedCandidate(null)}
                />
            )}
        </div>
    );
};

export default PotentialCandidates;