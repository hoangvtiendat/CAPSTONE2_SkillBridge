import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import candidateService from '../../services/api/candidateService';
import {toast} from 'sonner';
import CandidateProfileOverlay from './CandidateProfileOverlay';
import './PotentialCandidates.css';

const PotentialCandidates = () => {
    const {jobId} = useParams();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
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

    const handleSendInvitation = async (candidateId) => {
        try {
            // Gọi API thông qua service
            const response = await candidateService.inviteCandidate(jobId, candidateId);

            if (response.code === 200) {
                // Cập nhật state để đổi trạng thái nút thành "Đã mời"
                setInvitedIds(prev => new Set(prev).add(candidateId));

                // Hiển thị thông báo thành công từ backend
                toast.success(response.result || "Mời ứng tuyển thành công!");
            }
        } catch (error) {
            console.error("Lỗi khi mời ứng tuyển:", error);
            toast.error("Không thể gửi lời mời. Vui lòng thử lại sau!");
        }
    };

    if (loading) return (
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
                </div>
            </div>

            <div className="candidates-grid-compact">
                {candidates.length > 0 ? (
                    candidates.map((can) => {
                        const isInvited = invitedIds.has(can.id);
                        const matchScore = (can.aiMatchingScore * 100).toFixed(0);

                        return (
                            <div key={can.id} className="candidate-card-compact">
                                <div className="score-mini">
                                    <svg viewBox="0 0 36 36">
                                        <path className="bg"
                                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                        <path className="progress" stroke="#3b82f6"
                                              strokeDasharray={`${matchScore}, 100`}
                                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                    </svg>
                                    <span>{matchScore}%</span>
                                </div>

                                <div className="card-top-compact">
                                    <div className="avatar-mini">
                                        {can.avatar ?
                                            <img src={can.avatar} alt=""/> :
                                            <span className="material-symbols-outlined"
                                                  style={{fontSize: '32px', color: '#cbd5e1'}}>person</span>
                                        }
                                    </div>
                                    <div className="meta-mini">
                                        <h3>{can.name}</h3>
                                        <div className="loc-mini">
                                            <span className="material-symbols-outlined"
                                                  style={{fontSize: '14px'}}>location_on</span> {can.address}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="desc-mini">{can.description || "Chưa có giới thiệu về kỹ năng và kinh nghiệm."}</div>

                                <div className="actions-mini">
                                    <button
                                        className={`btn-inv-mini ${isInvited ? 'invited' : ''}`}
                                        onClick={() => handleSendInvitation(can.id)} // can.id chính là candidateId
                                        disabled={isInvited}
                                    >
                                    <span className="material-symbols-outlined" style={{fontSize: '18px'}}>
                                        {isInvited ? 'check_circle' : 'send'}
                                    </span>
                                        {isInvited ? 'Đã mời' : 'Mời ứng tuyển'}
                                    </button>
                                    <button className="btn-det-mini" onClick={() => setSelectedCandidate(can)}>Chi
                                        tiết
                                    </button>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="empty-state">Không tìm thấy ứng viên phù hợp.</div>
                )}
            </div>

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