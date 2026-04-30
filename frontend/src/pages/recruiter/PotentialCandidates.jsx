import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import candidateService from '../../services/api/candidateService';
import { toast } from 'sonner';
import CandidateProfileOverlay from './CandidateProfileOverlay';
import './PotentialCandidates.css';

const PotentialCandidates = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    // States quản lý dữ liệu
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [invitedIds, setInvitedIds] = useState(new Set());

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

    const fetchCandidates = async (page) => {
        setLoading(true);
        try {
            // Đảm bảo hàm này trong service nhận (jobId, page, limit)
            const response = await candidateService.getPotentialCandidates(jobId, page, limit);

            // Map kết quả từ Map<String, Object> của Backend
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
    };

    useEffect(() => {
        if (jobId) {
            fetchCandidates(0);
        }
    }, [jobId]);

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
                setInvitedIds(prev => new Set(prev).add(candidateId));
                toast.success(response.result || "Mời ứng tuyển thành công!");
            }
        } catch (error) {
            toast.error("Không thể gửi lời mời. Vui lòng thử lại sau!");
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
            {/* Header Section */}
            <div className="header-compact">
                <button className="btn-back-link" onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined">arrow_back</span> Quay lại
                </button>
                <div className="title-area">
                    <h1>Ứng Viên Tiềm Năng</h1>
                    <span className="total-badge">{totalElements} nhân tài</span>
                </div>
            </div>

            {/* Grid Section */}
            <div className="candidates-grid-compact">
                {candidates.length > 0 ? (
                    candidates.map((can) => {
                        const isInvited = invitedIds.has(can.id);
                        const matchScore = (can.aiMatchingScore || 0).toFixed(0);

                        return (
                            <div key={can.id} className="candidate-card-compact">
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
                                    <button
                                        className={`btn-inv-mini ${isInvited ? 'invited' : ''}`}
                                        onClick={() => handleSendInvitation(can.id)}
                                        disabled={isInvited}
                                    >
                                        <span className="material-symbols-outlined">
                                            {isInvited ? 'check_circle' : 'send'}
                                        </span>
                                        {isInvited ? 'Đã mời' : 'Mời ứng tuyển'}
                                    </button>
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

            {/* Pagination Section */}
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

            {/* Detail Overlay */}
            {selectedCandidate && (
                <CandidateProfileOverlay
                    candidateData={selectedCandidate}
                    jobId={jobId}
                    isInvited={invitedIds.has(selectedCandidate.id)}
                    onClose={() => setSelectedCandidate(null)}
                />
            )}
        </div>
    );
};

export default PotentialCandidates;