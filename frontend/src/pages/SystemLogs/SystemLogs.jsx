import React, { useState, useEffect, useRef } from 'react';
import systemLogService from '../../services/api/systemLogService';
import './SystemLogs.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Database, History, Info,Building } from 'lucide-react';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [level, setLevel] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const consoleBodyRef = useRef(null);
    const navigate = useNavigate();
    
    const handleResetFilters = () => {
        setLevel('');
        setFilterDate('');
    };

    const fetchLogs = async (cursor = null, isAppend = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const limit = 40;
            const response = await systemLogService.getLogs(cursor, limit, level, filterDate);

            if (response && response.code === 200) {
                const newLogs = response.result || [];
                if (isAppend) {
                    setLogs(prev => [...prev, ...newLogs]);
                } else {
                    setLogs(newLogs);
                }
                setHasMore(newLogs.length === limit);
            }
        } catch (error) {
            console.error("Failed to load logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const threshold = 100;
        const isNearBottom = scrollHeight - scrollTop <= clientHeight + threshold;

        if (isNearBottom && hasMore && !loading && logs.length > 0) {
            const lastLogId = logs[logs.length - 1].id;
            fetchLogs(lastLogId, true);
        }
    };

    useEffect(() => {
        setLogs([]);
        setHasMore(true);
        fetchLogs(null, false);

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8081/identity/ws-log'),
            connectHeaders: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe('/topic/logs', (message) => {
                    const newLog = JSON.parse(message.body);
                    const isLevelMatch = !level || newLog.logLevel === level;
                    const isDateMatch = !filterDate || new Date(newLog.createdAt).toISOString().split('T')[0] === filterDate;

                    if (isLevelMatch && isDateMatch) {
                        setLogs(prev => [newLog, ...prev]);
                    }
                });
            }
        });

        client.activate();
        return () => client.deactivate();
    }, [level, filterDate]);

    const getLevelColor = (level) => {
        switch (level) {
            case 'DANGER': return '#ff4d4f';
            case 'WARNING': return '#faad14';
            case 'INFO': return '#4ade80';
            default: return '#ffffff';
        }
    };

    return (
        <div className="system-logs-container">
            <button className="btn-back-nav" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} /> Quay lại
            </button>
            <div className="main-layout">
                <div className="console-section">
                    <div className="console-wrapper resizable-console">
                        <div className="console-header">
                            <div className="header-left">
                                <span className="terminal-dots">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </span>
                                <span className="header-text">bash — system log</span>
                            </div>
                            <div className="header-right">
                                <span className={`live-indicator ${filterDate ? 'history-mode' : ''}`}></span>
                                <span className="live-view">LIVE VIEW</span>
                            </div>
                        </div>

                        <div className="console-body" ref={consoleBodyRef} onScroll={handleScroll}>
                            {logs.map((log, index) => (
                                <div key={log.id || index} className="log-line" style={{ color: getLevelColor(log.logLevel) }}>
                                    <span className="log-time">
                                        [{new Date(log.createdAt).toLocaleString('sv-SE')}]
                                    </span>
                                    <span className="log-msg">{log.action}</span>
                                </div>
                            ))}

                            {loading && (
                                <div className="terminal-loader">
                                    <div className="spinner"></div>
                                    <span>Đang truy xuất Database...</span>
                                </div>
                            )}

                            {!hasMore && logs.length > 0 && (
                                <div className="end-msg">--- ĐÃ HIỂN THỊ TOÀN BỘ LOG ---</div>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="sidebar-controls">
                    <div className="control-card">
                        <div className="card-header-flex">
                            <h4 className="card-title">Bộ lọc Log</h4>
                            <button className="btn-reset-filter" onClick={handleResetFilters}>
                                <span className="icon-refresh">↻</span> Đặt lại
                            </button>
                        </div>
                        <div className="filter-group">
                            <label>Mức độ</label>
                            <select
                                className="input-field"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                style={{color: getLevelColor(level) === '#ffffff' ? 'inherit' : getLevelColor(level)}}
                            >
                                <option value="" style={{color: '#64748b'}}>Tất cả các mức</option>
                                <option value="INFO">INFO</option>
                                <option value="WARNING">WARNING</option>
                                <option value="DANGER">DANGER</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Ngày tạo</label>
                            <input
                                type="date"
                                className="input-field"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="control-card backup-card">
                        <h4 className="card-title">Sao lưu (Backup)</h4>
                        <p className="hint">Khởi tạo bản sao lưu toàn bộ Database (.sql). Bản lưu trữ sẽ tự động xóa sau 30 ngày.</p>
                        <button className="btn-backup">
                             <span>💾</span> Tạo bản Backup Mới
                        </button>
                    </div>

                    <div className="control-card">
                        <h4 className="card-title">Bản sao lưu gần đây</h4>
                        <div className="backup-list">
                            <BackupItem name="backup_20260127.sql" size="2.5GB" time="Hôm qua" />
                            <BackupItem name="backup_20260120.sql" size="2.4GB" time="1 tuần trước" />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

const BackupItem = ({ name, size, time }) => (
    <div className="backup-item">
        <div className="backup-info">
            <p className="backup-name">{name}</p>
            <span className="backup-meta">{size} • {time}</span>
        </div>
        <button className="btn-restore">Phục hồi</button>
    </div>
);

export default SystemLogs;