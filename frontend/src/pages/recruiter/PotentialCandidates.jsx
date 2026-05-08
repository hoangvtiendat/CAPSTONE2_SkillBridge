import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import candidateService from '../../services/api/candidateService';
import { toast } from 'sonner';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import CandidateProfileOverlay from './CandidateProfileOverlay';
import './PotentialCandidates.css';

const PotentialCandidates = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const stompClientRef = useRef(null);
    // States quản lý dữ liệu
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    // States quản lý phân trang
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const limit = 15;

    const API_BASE_URL = "http://localhost:8081/identity";

    const getImageUrl = (path) => {
        if (!path || path === "" || path === "null") return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${API_BASE_URL}/${cleanPath}?t=${new Date().getTime()}`;
    };

    const fetchCandidates = useCallback(async (page) => {
        // Chỉ hiện loading ở lần đầu, các lần update sau update ngầm để tránh giật lag UI
        if (candidates.length === 0) setLoading(true);

        try {
            const response = await candidateService.getPotentialCandidates(jobId, page, limit);
            const data = response.result;
            setCandidates(data.candidates || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
            setCurrentPage(data.currentPage || 0);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Không thể tải danh sách ứng viên");
        } finally {
            setLoading(false);
        }
    }, [jobId, limit]);

    useEffect(() => {
        if (jobId) {
            fetchCandidates(0);
        }
    }, [jobId, fetchCandidates]);

useEffect(() => {
        const token = localStorage.getItem('accessToken');

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-log`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('Connected to Invitation WebSocket');

            // Subscribe vào topic mà Backend gửi sau khi commit thành công
            client.subscribe(`/topic/job-invitations/${jobId}`, (message) => {
                if (message.body === "UPDATE") {
                    console.log("Realtime: Nhận tín hiệu cập nhật danh sách mời...");
                    // Gọi lại API để lấy trạng thái mới nhất (ví dụ: nút đổi sang "Đã mời")
                    fetchCandidates(currentPage);
                }
            });
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [jobId, currentPage, fetchCandidates]);

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            fetchCandidates(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSendInvitation = async (candidateId) => {
        try {
            const response = await candidateService.inviteCandidate(jobId, candidateId);
            if (response.code === 200) {
                toast.success(response.result || "Gửi lời mời thành công!");
                // Refresh dữ liệu để cập nhật trạng thái nút và badge ngay lập tức
                fetchCandidates(currentPage);
            }
        } catch (error) {
            toast.error("Không thể gửi lời mời. Vui lòng thử lại sau!");
        }
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'INVITED':
                return <div className="status-badge invited">Đã mời</div>;
            case 'EXPIRED':
                return <div className="status-badge expired">Hết hạn</div>;
            case 'APPLIED':
                return <div className="status-badge applied">Đã Apply</div>;
            default:
                return null;
        }
    };

    if (loading && candidates.length === 0) return (
        <div className="loading-state">
            <span className="material-symbols-outlined loader-spin">progress_activity</span>
            <p>Hệ thống AI đang phân tích hồ sơ phù hợp...</p>
        </div>
    );

    return (
        <div className="potential-compact-wrapper">
            <div className="header-compact">
                <button className="btn-back-link" onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined">arrow_back</span> Quay lại
                </button>
                <div className="title-area">
                    <h1>Ứng Viên Tiềm Năng</h1>
                    <span className="total-badge">{totalElements} nhân tài</span>
                </div>
            </div>

            <div className="candidates-grid-compact">
                {candidates.length > 0 ? (
                    candidates.map((can) => {
                        const matchScore = (can.aiMatchingScore || 0).toFixed(0);
                        const status = can.jobStatus; // NONE, INVITED, EXPIRED, APPLIED

                        return (
                            <div key={can.id} className="candidate-card-compact">
                                {/* Badge trạng thái góc trên bên phải */}
                                <div className="status-badge-container">
                                    {renderStatusBadge(status)}
                                </div>

                                <div className="score-mini">
                                    <svg viewBox="0 0 36 36">
                                        <path className="bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                        <path className="progress"
                                              stroke="#3b82f6"
                                              strokeDasharray={`${matchScore}, 100`}
                                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                    </svg>
                                    <span>{matchScore}%</span>
                                </div>

                                <div className="card-top-compact">
                                    <div className="avatar-mini">
                                        {can.avatar ?
                                            <img src={getImageUrl(can.avatar)} alt={can.name} /> :
                                            <span className="material-symbols-outlined user-placeholder">person</span>
                                        }
                                    </div>
                                    <div className="meta-mini">
                                        <h3>{can.name}</h3>
                                        <div className="loc-mini">
                                            <span className="material-symbols-outlined">location_on</span> {can.address}
                                        </div>
                                    </div>
                                </div>

                                <div className="desc-mini">
                                    {can.description || "Chưa có giới thiệu về kỹ năng và kinh nghiệm."}
                                </div>

                                <div className="actions-mini">
                                    {status === 'INVITED' ? (
                                        <button className="btn-inv-mini already-invited" disabled>
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Đã mời
                                        </button>
                                    ) : (
                                        <button
                                            className="btn-inv-mini"
                                            onClick={() => handleSendInvitation(can.id)}
                                        >
                                            <span className="material-symbols-outlined">
                                                {status === 'NONE' ? 'send' : 'refresh'}
                                            </span>
                                            {status === 'NONE' ? 'Mời ứng tuyển' : 'Mời lại'}
                                        </button>
                                    )}
                                    <button className="btn-det-mini" onClick={() => setSelectedCandidate(can)}>
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">Không tìm thấy ứng viên phù hợp.</div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination-compact">
                    <button
                        disabled={currentPage === 0}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="page-btn"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="page-info">
                        Trang <strong>{currentPage + 1}</strong> / {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages - 1}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="page-btn"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            )}

            {selectedCandidate && (
                <CandidateProfileOverlay
                    candidateData={selectedCandidate}
                    jobId={jobId}
                    onClose={() => setSelectedCandidate(null)}
                />
            )}
        </div>
    );
};

export default PotentialCandidates;