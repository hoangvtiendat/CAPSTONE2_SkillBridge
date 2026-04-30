import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Plus, Trash2, Save, AlertCircle, MapPin, RotateCcw, Clock,
    ListChecks, Users, Settings2, UserPlus, UserMinus, ArrowLeft,
    X, Edit3, Lock, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import interviewService from '../../services/api/interviewService';
import './BatchSlotCreate.css';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BatchSlotCreate = () => {
    const API_BASE_URL = "http://localhost:8081/identity";
    const stompClientRef = useRef(null);
    const tableBodyRef = useRef(null);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        console.log("aaa: ", `${baseUrl}${cleanPath}`)
        return `${baseUrl}${cleanPath}`;
    };
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [existingSlots, setExistingSlots] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [duration, setDuration] = useState(30);

    const [description, setDescription] = useState('');
    const [locationLink, setLocationLink] = useState('');
    const [defaultCapacity, setDefaultCapacity] = useState(1);

    const [activeExpand, setActiveExpand] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // --- STATES FOR MODAL ---
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});

    const [candidates, setCandidates] = useState([]);
    const [showCandidates, setShowCandidates] = useState(false);

    const fetchExistingSlots = useCallback(async () => {
        try {
            const response = await interviewService.getSlotsByJob(jobId);
            const data = response.result || [];
            setExistingSlots([...data]);
        } catch (error) {
            console.error("Lỗi cập nhật realtime:", error);
        }
    }, [jobId]);

    const modalStateRef = useRef({ showModal, selectedSlot });
    useEffect(() => {
        modalStateRef.current = { showModal, selectedSlot };
    }, [showModal, selectedSlot]);
    useEffect(() => {
        fetchExistingSlots();

        const token = localStorage.getItem('accessToken');
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-log`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('Connected to Slot WebSocket');
            client.subscribe(`/topic/job-slots/${jobId}`, async (message) => {
                if (message.body === "UPDATE") {
                    console.log("Realtime: Nhận tín hiệu UPDATE...");
                    const response = await interviewService.getSlotsByJob(jobId);
                    const newSlots = response.result || [];
                    setExistingSlots([...newSlots]);
                    const { showModal: isVisible, selectedSlot: currentSlot } = modalStateRef.current;

                    if (isVisible && currentSlot) {
                        const slotId = currentSlot.interviewSlotId || currentSlot.id;
                        const freshSlotData = newSlots.find(s => (s.interviewSlotId || s.id) === slotId);

                        if (freshSlotData) {
                            console.log("Realtime: Cập nhật trực tiếp dữ liệu Modal cho slot:", slotId);
                            setSelectedSlot({ ...freshSlotData });
                            interviewService.getCandidatesBySlot(slotId)
                                .then(res => setCandidates(res.result || []))
                                .catch(err => console.error("Lỗi cập nhật ứng viên:", err));
                        }
                    }
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
    }, [jobId, fetchExistingSlots]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);
    const isActionAllowed = (startTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const diffInHours = (start - now) / (1000 * 60 * 60);
        return diffInHours >= 12;
    };

    const calculateEndTime = (startTime, dur) => {
        if (!startTime) return "";
        const [hours, minutes] = startTime.split(':').map(Number);
        const dateObj = new Date();
        dateObj.setHours(hours, minutes + dur);
        return dateObj.toTimeString().slice(0, 5);
    };

    const getRoundedNow = () => {
        const now = new Date();
        now.setHours(now.getHours() + 12);
        const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
        now.setMinutes(roundedMinutes);
        now.setSeconds(0);
        now.setMilliseconds(0);
        return now;
    };

    const createNewSlot = useCallback((baseInput = getRoundedNow(), freezeData = false) => {
        let targetDate;
        if (baseInput instanceof Date) {
            targetDate = baseInput;
        } else {
            const [hours, minutes] = baseInput.split(':').map(Number);
            targetDate = new Date();
            targetDate.setHours(hours, minutes, 0, 0);
        }

        return {
            date: targetDate.toLocaleDateString('en-CA'),
            startTime: targetDate.toTimeString().slice(0, 5),
            endTime: calculateEndTime(targetDate.toTimeString().slice(0, 5), duration),
            capacity: freezeData ? defaultCapacity : '',
            location: freezeData ? locationLink : '',
            note: freezeData ? description : ''
        };
    }, [duration, defaultCapacity, locationLink, description]);

    const [slots, setSlots] = useState([createNewSlot()]);

    useEffect(() => {
        if (tableBodyRef.current) {
            tableBodyRef.current.scrollTo({
                top: tableBodyRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [slots]);

    const handleSlotChange = (index, field, value) => {
        const newSlots = [...slots];
        newSlots[index][field] = value;
        if (field === 'startTime') {
            newSlots[index].endTime = calculateEndTime(value, duration);
        }
        setSlots(newSlots);
    };

    const addTimeSlot = () => {
        const lastSlot = slots[slots.length - 1];
        const frozenExistingSlots = slots.map(s => ({
            ...s,
            capacity: s.capacity === '' ? defaultCapacity : s.capacity,
            location: s.location === '' ? locationLink : s.location,
            note: s.note === '' ? description : s.note
        }));

        const nextSlot = createNewSlot(lastSlot.endTime, true);
        setSlots([...frozenExistingSlots, nextSlot]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        for (let i = 0; i < slots.length; i++) {
            const slotStartStr = `${slots[i].date}T${slots[i].startTime}:00`;
            if (!isActionAllowed(slotStartStr)) {
                toast.error(`Khung giờ thứ ${i + 1} phải cách hiện tại ít nhất 12 tiếng!`);
                return;
            }
        }

        setLoading(true);
        const toastId = toast.loading("Đang lưu hệ thống...");
        try {
            const payload = {
                jobId,
                description: description || null,
                locationLink: locationLink || null,
                defaultCapacity: parseInt(defaultCapacity),
                slots: slots.map(s => ({
                    startTime: `${s.date}T${s.startTime}:00`,
                    endTime: `${s.date}T${s.endTime}:00`,
                    capacity: (s.capacity !== '' && s.capacity !== null) ? parseInt(s.capacity) : parseInt(defaultCapacity),
                    locationLink: (s.location && s.location.trim() !== '') ? s.location : (locationLink || null),
                    description: (s.note && s.note.trim() !== '') ? s.note : (description || null)
                }))
            };

            await interviewService.createBatchSlots(payload);
            toast.success("Đã tạo lịch thành công!", { id: toastId });
            setDescription('');
            setLocationLink('');
            setDefaultCapacity(1);
            setSlots([createNewSlot()]);
            setActiveExpand(null);
            fetchExistingSlots();
        } catch (error) {
            toast.error("Lỗi khi lưu lịch.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    // --- MODAL HANDLERS ---
    const handleOpenDetail = async (slot) => {
        setSelectedSlot(slot);
        setEditData({
            ...slot,
            date: slot.startTime.split('T')[0],
            time: slot.startTime.split('T')[1].substring(0, 5)
        });
        setEditMode(false);
        setShowCandidates(false);
        setShowModal(true);
        try {
            const res = await interviewService.getCandidatesBySlot(slot.interviewSlotId || slot.id);
            setCandidates(res.result || []);
        } catch (err) {
            setCandidates([]);
        }
    };

    useEffect(() => {
        if (showModal && selectedSlot) {
            const currentId = selectedSlot.interviewSlotId || selectedSlot.id;
            const freshSlot = existingSlots.find(s => (s.interviewSlotId || s.id) === currentId);

            if (freshSlot) {
                if (freshSlot.currentOccupancy !== selectedSlot.currentOccupancy || freshSlot.status !== selectedSlot.status) {
                    setSelectedSlot(freshSlot);
                    if (!editMode) {
                        setEditData({
                            ...freshSlot,
                            date: freshSlot.startTime.split('T')[0],
                            time: freshSlot.startTime.split('T')[1].substring(0, 5)
                        });
                    }
                }
            }
        }
    }, [existingSlots, showModal, editMode]);

    const handleUpdateSlot = async () => {
        const slotId = editData.interviewSlotId || editData.id;
        const fullStartTime = `${editData.date}T${editData.time}:00`;
        if (!isActionAllowed(fullStartTime)) {
            toast.error("Không thể chỉnh sửa vì khung giờ bắt đầu trong vòng 12h tới!");
            return;
        }

        try {
            const payload = {
                ...editData,
                startTime: fullStartTime,
                endTime: `${editData.date}T${calculateEndTime(editData.time, duration)}:00`
            };
            await interviewService.updateSlot(slotId, payload);
            toast.success("Cập nhật thành công!");
            setShowModal(false);
            fetchExistingSlots();
        } catch (error) {
            toast.error("Lỗi cập nhật.");
        }
    };
    const handleToggleLock = async () => {
        const slotId = selectedSlot.interviewSlotId || selectedSlot.id;
        const newLockStatus = selectedSlot.status !== 'LOCKED';

        try {
            await interviewService.toggleLockSlot(slotId, newLockStatus);
            toast.success(newLockStatus ? "Đã khóa khung giờ thành công!" : "Đã mở khóa khung giờ!");
            setShowModal(false);
            fetchExistingSlots();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi thay đổi trạng thái khóa.");
        }
    };
    const handleDeleteSlot = async () => {
        const slotId = selectedSlot.interviewSlotId || selectedSlot.id;

        if (!slotId) {
            toast.error("Không tìm thấy ID của khung giờ này!");
            return;
        }
        if (selectedSlot.currentOccupancy > 0) {
            toast.error(`Không thể xóa vì đã có ${selectedSlot.currentOccupancy} ứng viên đăng ký lịch này!`);
            return;
        }
        if (!isActionAllowed(selectedSlot.startTime)) {
            toast.error("Chỉ được xóa lịch cách hiện tại ít nhất 12 tiếng!");
            return;
        }

        if (window.confirm("Bạn muốn xóa khung giờ này?")) {
            try {
                await interviewService.deleteSlot(slotId);
                toast.success("Đã xóa thành công.");
                setShowModal(false);
                fetchExistingSlots();
            } catch (error) {
                console.error("Delete error:", error);
                toast.error(error.response?.data?.message || "Lỗi khi xóa khung giờ.");
            }
        }
    };

    const filteredSlots = useMemo(() => {
        return existingSlots.filter(item => {
            const isExpired = new Date(item.startTime) < currentTime;
            const isFull = item.currentOccupancy >= item.capacity;
            const isEmpty = item.currentOccupancy === 0;
            const isLocked = item.status === 'LOCKED';
            if (statusFilter === 'EXPIRED') return isExpired;
            if (isExpired) return false;
            if (statusFilter === 'LOCKED') return isLocked;
            if (statusFilter === 'EMPTY') return isEmpty;
            if (statusFilter === 'AVAILABLE') return !isFull && !isEmpty;
            if (statusFilter === 'FULL') return isFull;
            return true;
        });
    }, [existingSlots, statusFilter, currentTime]);

    return (
        <div className="batch-slot-container">
            <div className="batch-slot-grid">
                <div className="batch-slot-main-card">
                    <div className="card-header-simple">
                        <button type="button" className="back-btn-circle" onClick={() => navigate(-1)} title="Quay lại">
                            <ArrowLeft size={18} />
                        </button>
                        <Plus size={20} />
                        <span>Cấu hình khung giờ</span>
                    </div>
                    <form onSubmit={handleSubmit} className="batch-slot-body">
                        <div className="config-stack-horizontal">
                            <div className="input-field-group flex-2">
                                <label><AlertCircle size={14} /> Ghi chú</label>
                                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ghi chú mặc định..." />
                            </div>
                            <div className="input-field-group capacity-fixed-width">
                                <label><Users size={14} /> Số người</label>
                                <input type="number" min="1" value={defaultCapacity} onChange={(e) => setDefaultCapacity(e.target.value)} />
                            </div>
                        </div>

                        <div className="input-field-group" style={{ marginTop: '12px' }}>
                            <label><MapPin size={14} /> Địa điểm</label>
                            <input type="text" value={locationLink} onChange={(e) => setLocationLink(e.target.value)} placeholder="Địa điểm mặc định..." />
                        </div>

                        <div className="slots-management-table">
                            <div className="table-header-fixed">
                                <div className="col-date">Ngày</div>
                                <div className="col-time">Bắt đầu</div>
                                <div className="col-time">Kết thúc</div>
                                <div className="col-cap">Số người</div>
                                <div className="col-action">Thao tác</div>
                            </div>

                            <div className="table-body-fixed" ref={tableBodyRef}>
                                {slots.map((slot, index) => (
                                    <div key={index} className="slot-row-wrapper">
                                        <div className="slot-item-row-fixed">
                                            <input type="date" className="col-date" value={slot.date} onChange={(e) => handleSlotChange(index, 'date', e.target.value)} />
                                            <input type="time" className="col-time" value={slot.startTime} onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)} />
                                            <input type="time" className="col-time" value={slot.endTime} onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)} />

                                            <input
                                                type="number"
                                                className="col-cap"
                                                placeholder={defaultCapacity}
                                                value={slot.capacity}
                                                onChange={(e) => handleSlotChange(index, 'capacity', e.target.value)}
                                            />

                                            <div className="col-action-btns">
                                                <button type="button" className={`expand-btn ${activeExpand === index ? 'active' : ''}`} onClick={() => setActiveExpand(activeExpand === index ? null : index)}><Settings2 size={16} /></button>
                                                <button type="button" onClick={() => setSlots(slots.filter((_, i) => i !== index))} className="remove-btn" disabled={slots.length === 1}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        {activeExpand === index && (
                                            <div className="slot-details-expand animated-expand">
                                                <div className="expand-content">
                                                    <div className="sub-input">
                                                        <MapPin size={14} />
                                                        <input type="text" placeholder={`Địa điểm riêng...`} value={slot.location} onChange={(e) => handleSlotChange(index, 'location', e.target.value)} />
                                                    </div>
                                                    <div className="sub-input">
                                                        <AlertCircle size={14} />
                                                        <input type="text" placeholder={`Ghi chú riêng...`} value={slot.note} onChange={(e) => handleSlotChange(index, 'note', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addTimeSlot} className="add-btn-fixed"><Plus size={16} /> Thêm khung giờ mới</button>
                        </div>

                        <div className="batch-slot-footer">
                            <button type="button" className="reset-btn" onClick={() => window.location.reload()}><RotateCcw size={16} />Reset</button>
                            <button type="submit" disabled={loading} className="save-all-btn">{loading ? "Đang lưu..." : <><Save size={18} /> Lưu tất cả</>}</button>
                        </div>
                    </form>
                </div>

                <div className="batch-slot-side-card">
                    <div className="card-header-simple dark">
                        <ListChecks size={20} />
                        <span>Lịch đã tạo</span>
                    </div>
                    <div className="filter-bar">
                        {['ALL', 'EMPTY', 'AVAILABLE', 'FULL', 'LOCKED', 'EXPIRED'].map(id => (
                            <button
                                key={id}
                                type="button"
                                className={statusFilter === id ? 'active' : ''}
                                onClick={() => setStatusFilter(id)}
                            >
                                {id === 'ALL' ? 'Tất cả' :
                                    id === 'EMPTY' ? 'Trống' :
                                        id === 'AVAILABLE' ? 'Còn chỗ' :
                                            id === 'FULL' ? 'Đầy' :
                                                id === 'LOCKED' ? 'Đã khóa' : 'Hết hạn'}
                            </button>
                        ))}
                    </div>
                    <div className="existing-slots-list">
                        {filteredSlots.length === 0 ? (
                            <div className="empty-state">Không có lịch phù hợp</div>
                        ) : (
                            filteredSlots.map((item, idx) => {
                                const isExpired = new Date(item.startTime) < currentTime;
                                const isFull = item.currentOccupancy >= item.capacity;
                                const isEmpty = item.currentOccupancy === 0;
                                return (
                                    <div key={idx}
                                        className={`existing-slot-item ${isFull ? 'booked-row' : ''} ${isExpired ? 'expired-row' : ''}`}
                                        onClick={() => handleOpenDetail(item)}
                                        style={{ cursor: 'pointer' }}>
                                        <div className="slot-info-main">
                                            <div className="slot-date-badge">{new Date(item.startTime).toLocaleDateString('vi-VN')}</div>
                                            <div className="slot-time-range"><Clock size={12} /> {item.startTime.split('T')[1].substring(0, 5)} - {item.endTime.split('T')[1].substring(0, 5)}</div>
                                            <div className="slot-occupancy-tag">
                                                {isEmpty ? <UserMinus size={12} /> : <UserPlus size={12} />}
                                                {item.currentOccupancy} / {item.capacity} ứng viên
                                            </div>
                                        </div>
                                        <div className={`status-badge-new ${isExpired ? 'expired' : isFull ? 'full' : isEmpty ? 'empty' : 'open'}`}>
                                            {isExpired ? 'Hết hạn' : isFull ? 'Đã đầy' : isEmpty ? 'Trống' : 'Còn chỗ'}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL DETAIL & EDIT --- */}
            {showModal && selectedSlot && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content animated-zoom" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings2 size={18} />
                                <h3 style={{ margin: 0 }}>Chi tiết khung giờ</h3>
                            </div>
                            <div className="modal-header-actions" style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn-lock"
                                    title={selectedSlot.status === 'LOCKED' ? "Mở khóa slot" : "Khóa slot"}
                                    onClick={handleToggleLock}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: selectedSlot.status === 'LOCKED' ? '#ff9800' : '#ccc',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                    }}
                                >
                                    <Lock size={18} fill={selectedSlot.status === 'LOCKED' ? "#ff9800" : "none"} />
                                </button>
                                <button onClick={() => setShowModal(false)} className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="modal-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Trạng thái:</label>
                                    <span className={`tag ${selectedSlot.currentOccupancy >= selectedSlot.capacity ? 'full' : 'open'}`}>
                                        {selectedSlot.currentOccupancy} / {selectedSlot.capacity} Ứng viên
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Thời gian:</label>
                                    {editMode ? (
                                        <div className="edit-time-group">
                                            <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} />
                                            <input type="time" value={editData.time} onChange={e => setEditData({ ...editData, time: e.target.value })} />
                                        </div>
                                    ) : (
                                        <span>{new Date(selectedSlot.startTime).toLocaleString('vi-VN')}</span>
                                    )}
                                </div>
                                <div className="info-item full-width">
                                    <label>Địa điểm:</label>
                                    {editMode ? (
                                        <input type="text" value={editData.locationLink} onChange={e => setEditData({ ...editData, locationLink: e.target.value })} />
                                    ) : (
                                        <span className="text-truncate">{selectedSlot.locationLink || "Chưa cập nhật"}</span>
                                    )}
                                </div>
                                <div className="info-item full-width">
                                    <label>Ghi chú:</label>
                                    {editMode ? (
                                        <textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                                    ) : (
                                        <p>{selectedSlot.description || "Không có ghi chú"}</p>
                                    )}
                                </div>
                            </div>

                            {!isActionAllowed(selectedSlot.startTime) && (
                                <div className="time-alert" style={{ marginTop: '10px', color: '#d93025', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                                    <AlertCircle size={14} /> Đã khóa (Chỉ sửa/xóa trước 12h bắt đầu)
                                </div>
                            )}

                            <div className="candidates-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <button
                                    type="button"
                                    className={`btn-view-candidates ${showCandidates ? 'active' : ''}`}
                                    onClick={() => setShowCandidates(!showCandidates)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f0f2f5', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <Eye size={16} />
                                    {showCandidates ? "Ẩn danh sách" : `Xem ${selectedSlot.currentOccupancy} người đăng ký`}
                                </button>

                                {showCandidates && (
                                    <div className="candidates-list-dropdown" style={{
                                        marginTop: '10px',
                                        background: '#fff',
                                        border: '1px solid #eee',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        {candidates.length > 0 ? (
                                            candidates.map((can, i) => (
                                                <div key={i} className="candidate-mini-card" style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '10px',
                                                    borderBottom: '1px solid #f5f5f5'
                                                }}>
                                                    {/* Avatar của ứng viên */}
                                                    <div className="can-avatar" style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        background: '#e9ecef',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyItems: 'center'
                                                    }}>
                                                        {getImageUrl(can.avatar) ? (
                                                            <img src={getImageUrl(can.avatar)} alt={can.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ background: '#007bff', color: '#fff', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                                {can.name?.charAt(0).toUpperCase() || 'C'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="can-info" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                        <span className="can-name" style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                            {can.name || `Ứng viên #${can.id?.substring(0, 5)}`}
                                                        </span>
                                                        <span className="can-email" style={{ fontSize: '12px', color: '#666' }}>
                                                            {can.email}
                                                        </span>
                                                    </div>

                                                    {can.aiMatchingScore > 0 && (
                                                        <div style={{
                                                            fontSize: '11px',
                                                            padding: '2px 6px',
                                                            borderRadius: '10px',
                                                            background: '#e3f2fd',
                                                            color: '#0d47a1',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {Math.round(can.aiMatchingScore * 100)}% Match
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-mini" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                                <Users size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                                <p style={{ margin: 0, fontSize: '13px' }}>Chưa có ứng viên nào đăng ký</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-delete"
                                onClick={handleDeleteSlot}
                                disabled={!isActionAllowed(selectedSlot.startTime) || selectedSlot.currentOccupancy > 0}
                            >
                                <Trash2 size={16} /> Xóa Slot
                            </button>

                            {editMode ? (
                                <button className="btn-save" onClick={handleUpdateSlot}>
                                    <Save size={16} /> Lưu
                                </button>
                            ) : (
                                <button
                                    className="btn-edit"
                                    onClick={() => setEditMode(true)}
                                    disabled={!isActionAllowed(selectedSlot.startTime)}
                                >
                                    <Edit3 size={16} /> Chỉnh sửa
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchSlotCreate;