import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Calendar, Info, CheckCircle, ArrowLeft, Loader2, ExternalLink, FileText, Briefcase, X, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import interviewService from '../../services/api/interviewService';
import './InterviewBookingPage.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const InterviewBookingPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [myInterview, setMyInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [expandedSlot, setExpandedSlot] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const stompClientRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const findExistingInterview = (interviewList, targetJobId) => {
        return interviewList?.find(inter => {
            const idInRecord = inter.jobId || inter.job?.id;
            return String(idInRecord) === String(targetJobId);
        });
    };

    const loadData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [slotData, myInterviewsResponse] = await Promise.all([
                interviewService.getSlotsByJob(jobId, false),
                interviewService.getMyInterviews()
            ]);
            setSlots(slotData.result || []);
            const existing = findExistingInterview(myInterviewsResponse.result, jobId);
            setMyInterview(existing);
        } catch (err) {
            console.error("Lỗi cập nhật dữ liệu:", err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        loadData();
        const token = localStorage.getItem('accessToken');
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8081/identity/ws-log'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('Connected to Booking WebSocket');
            client.subscribe(`/topic/job-slots/${jobId}`, (message) => {
                if (message.body === "UPDATE") {
                    console.log("Realtime: Phát hiện thay đổi slot, đang cập nhật...");
                    loadData(true);
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                console.log("Disconnected WebSocket");
            }
        };
    }, [jobId, loadData]);

    const handleBookSlot = async (slotId) => {
        if (myInterview) {
            toast.warning("Bạn đã đặt lịch cho công việc này rồi!");
            return;
        }
        setSubmitting(true);
        try {
            await interviewService.bookInterview(slotId);
            toast.success("Đặt lịch thành công!");
            await loadData(false);
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Lỗi khi đặt lịch.";
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedSlot(expandedSlot === id ? null : id);
    };

    if (loading) return (
        <div className="booking-loading">
            <Loader2 className="spinner animate-spin" />
            <p>Đang chuẩn bị lịch trình...</p>
        </div>
    );

    return (
        <div className="booking-container">
            <div className="booking-header">
                <button className="back-btn" onClick={() => navigate(-1)} title="Quay lại">
                    <ArrowLeft size={20} />
                </button>
                <div className="header-text">
                    <h1>{myInterview ? "Lịch phỏng vấn của bạn" : "Chọn lịch phỏng vấn"}</h1>
                    <p>{myInterview ? "Vui lòng kiểm tra kỹ thời gian và địa điểm" : "Hãy chọn một khung giờ bạn có thể tham gia"}</p>
                </div>
            </div>

            {myInterview ? (
                <div className="booked-confirmation-card animate-in">
                    <div className="success-banner">
                        <CheckCircle size={24} />
                        <h2>Lịch phỏng vấn đã xác nhận</h2>
                    </div>
                    <div className="interview-details-v3">
                        <div className="job-info-header">
                            <div className="job-icon-v3"><Briefcase size={24} /></div>
                            <div className="job-title-v3">
                                <h3>{myInterview.jobPosition}</h3>
                                <div className="candidate-tag">Ứng viên: {myInterview.candidateName || "Hồ Đăng Quỳnh"}</div>
                            </div>
                        </div>

                        <div className="info-grid-v3">
                            <div className="info-card-v3">
                                <Calendar size={20} className="text-orange" />
                                <div className="info-content-v3">
                                    <label>Ngày phỏng vấn</label>
                                    <span>{new Date(myInterview.startTime).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                            <div className="info-card-v3">
                                <Clock size={20} className="text-green" />
                                <div className="info-content-v3">
                                    <label>Thời gian</label>
                                    <span>{new Date(myInterview.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="location-section-v3">
                            <div className="loc-card-v3">
                                <div className="loc-head-v3">
                                    <MapPin size={18} />
                                    <label>Địa điểm & Hình thức</label>
                                </div>
                                {myInterview.locationLink?.startsWith('http') ? (
                                    <div className="online-box">
                                        <p>Phỏng vấn trực tuyến qua nền tảng liên kết</p>
                                        <a href={myInterview.locationLink} target="_blank" rel="noreferrer" className="btn-join-v3">
                                            Vào phòng họp ngay <ExternalLink size={16}/>
                                        </a>
                                    </div>
                                ) : (
                                    <p className="offline-text">{myInterview.locationLink || "Sẽ cập nhật sau"}</p>
                                )}
                            </div>

                            <div className="note-card-v3">
                                <div className="loc-head-v3">
                                    <FileText size={18} />
                                    <label>Ghi chú từ HR</label>
                                </div>
                                <p>{myInterview.description || "Không có ghi chú thêm cho buổi phỏng vấn này."}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="slots-grid">
                    {slots.map((slot) => {
                        const isFull = slot.currentOccupancy >= slot.capacity;
                        const isLocked = slot.status === 'LOCKED';
                        const isExpired = new Date(slot.startTime) < currentTime;
                        const isEmpty = slot.currentOccupancy === 0;
                        const isExpanded = expandedSlot === slot.id;

                        return (
                            <div key={slot.id} className={`slot-item-wrapper ${isExpanded ? 'is-expanded' : ''}`}>
                                <div className={`slot-card-v2
                                    ${isFull ? 'full-slot' : ''}
                                    ${isLocked ? 'locked-slot' : ''}
                                    ${isExpired ? 'expired-slot' : ''}
                                    ${isEmpty && !isExpired ? 'empty-slot' : ''}
                                    ${isExpanded ? 'active' : ''}`}
                                >
                                    <div className="slot-main-content">
                                        <div className="slot-time-info">
                                            <div className="date-circle-v3">
                                                <span className="day">{new Date(slot.startTime).getDate()}</span>
                                                <span className="month">Th {new Date(slot.startTime).getMonth() + 1}</span>
                                            </div>
                                            <div className="time-details">
                                                <div className="hours-v3">
                                                    {slot.startTime.split('T')[1].substring(0, 5)} - {slot.endTime.split('T')[1].substring(0, 5)}
                                                </div>
                                                <div className={`capacity-dot ${isExpired ? 'expired' : isFull ? 'full' : isEmpty ? 'empty' : 'available'}`}>
                                                    {isExpired ? 'Đã hết hạn' : isLocked ? 'Đã chốt lịch' : isFull ? 'Đã đầy' : isEmpty ? 'Còn trống' : `Còn ${slot.capacity - slot.currentOccupancy} chỗ`}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="slot-actions">
                                            <button
                                                className={`info-btn-v3 ${isExpanded ? 'active' : ''}`}
                                                onClick={() => toggleExpand(slot.id)}
                                            >
                                                {isExpanded ? <X size={18} /> : <Info size={18} />}
                                            </button>
                                            <button
                                                className="book-btn-v3"
                                                disabled={isFull || isExpired || submitting || isLocked}
                                                onClick={() => handleBookSlot(slot.id)}
                                            >
                                                {isExpired ? 'Hết hạn' : isFull ? 'Đã đầy' : isLocked ? 'Đã chốt' : 'Đặt lịch'}
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="slot-overlay-info animate-pop">
                                            <div className="overlay-content">
                                                <div className="o-row">
                                                    <MapPin size={16} />
                                                    <div>
                                                        <label>Địa điểm</label>
                                                        <p>{slot.locationLink || "Sẽ cập nhật sau"}</p>
                                                    </div>
                                                </div>
                                                <div className="o-row">
                                                    <FileText size={16} />
                                                    <div>
                                                        <label>Mô tả</label>
                                                        <p>{slot.description || "Không có ghi chú thêm."}</p>
                                                    </div>
                                                </div>
                                                <div className="o-row status-highlight">
                                                    <UserMinus size={16} />
                                                    <div>
                                                        <label>Tình trạng</label>
                                                        <p>{slot.currentOccupancy} / {slot.capacity} ứng viên đã đặt chỗ</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InterviewBookingPage;