import React, { useState, useEffect } from 'react';
import systemLogService from '../../services/api/systemLogService';
import './SystemLogs.css';
import SockJS from 'sockjs-client';
import { over } from 'stompjs';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [level, setLevel] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const response = await systemLogService.getLogs(null, 50, level);

                // Kiểm tra cấu trúc ApiResponse (code 200 từ Backend Spring Boot)
                if (response && response.code === 200) {
                    setLogs(response.result || []);
                }
            } catch (error) {
                console.error("Failed to load logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
        let sock = new SockJS('http://localhost:8080/ws-log');
        let stompClient = over(sock);

        stompClient.connect({}, () => {
            stompClient.subscribe('/topic/logs', (payload) => {
                const newLog = JSON.parse(payload.body);
                // Thêm log mới vào đầu danh sách mà không cần load lại trang
                setLogs(prevLogs => [newLog, ...prevLogs]);
            });
        });

        return () => {
            if (stompClient) stompClient.disconnect();
        };
    }, []);

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR': return '#ff4d4f';
            case 'WARN': return '#faad14';
            case 'INFO': return '#52c41a';
            default: return '#ffffff';
        }
    };

    return (
        <div className="system-logs-container">
            <h2 className="title">Logs Hệ Thống & Backup</h2>

            <div className="main-layout">
                {/* PHẦN 1: CONSOLE LOGS */}
                <div className="console-wrapper">
                    <div className="console-header">
                        <span>{`> System Console Logs`}</span>
                        <span className="live-view">Live View</span>
                    </div>
                    <div className="console-body">
                        {loading && logs.length === 0 ? (
                            <p style={{ color: '#888' }}>Đang kết nối hệ thống...</p>
                        ) : logs.length === 0 ? (
                            <p style={{ color: '#888' }}>Không tìm thấy bản ghi log nào.</p>
                        ) : (
                            logs.map((log, index) => (
                                <div key={log.id || index} className="log-line">
                                    <span className="log-time">[{new Date(log.timestamp).toLocaleString() || 'N/A'}]</span>
                                    <span className="log-level" style={{ color: getLevelColor(log.level) }}>
                                        {log.level}:
                                    </span>
                                    <span className="log-msg">{log.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* PHẦN 2: SIDEBAR */}
                <div className="sidebar-controls">
                    <div className="control-card">
                        <h3>Lọc log</h3>
                        <select className="input-field" value={level} onChange={(e) => setLevel(e.target.value)}>
                            <option value="">All Levels</option>
                            <option value="INFO">INFO</option>
                            <option value="WARN">WARN</option>
                            <option value="ERROR">ERROR</option>
                        </select>
                        <input type="date" className="input-field" />
                    </div>

                    <div className="control-card">
                        <h3>Sao lưu dữ liệu (Backup)</h3>
                        <p className="hint">Tạo bản sao lưu toàn bộ Database. File sẽ được lưu trữ an toàn trong 30 ngày.</p>
                        <button className="btn-backup" onClick={() => alert('Đang khởi tạo backup...')}>
                             Tạo bản Backup Mới
                        </button>
                    </div>

                    <div className="control-card">
                        <h3>Bản sao lưu gần đây</h3>
                        <div className="backup-list">
                            <BackupItem name="backup_20260127.sql" size="2.5GB" time="Hôm qua" />
                            <BackupItem name="backup_20260120.sql" size="2.4GB" time="1 tuần trước" />
                        </div>
                    </div>
                </div>
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
        <button className="btn-restore">Restore</button>
    </div>
);

export default SystemLogs;