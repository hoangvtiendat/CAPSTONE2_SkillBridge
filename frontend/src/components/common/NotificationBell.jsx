import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, Briefcase, FileText, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import notificationService from '../../services/api/notificationService';
import { useAuth } from '../../context/AuthContext';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationService.getNotifications();
            if (response && response.result) {
                setNotifications(response.result);
                setUnreadCount(response.result.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleMarkAsRead = async (id, link) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (link) {
                navigate(link);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'APPLICATION_STATUS': return <FileText size={18} />;
            case 'NEW_JOB': return <Briefcase size={18} />;
            default: return <Info size={18} />;
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className="bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="unread-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notif-header">
                        <h3>Thông báo</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    <div className="notif-list">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={() => handleMarkAsRead(notif.id, notif.link)}
                                >
                                    <div className="notif-icon-wrapper">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="notif-content">
                                        <p className="notif-title">{notif.title}</p>
                                        <p
                                            className="notif-text"
                                            dangerouslySetInnerHTML={{ __html: notif.content }}
                                        />
                                        <span className="notif-time">
                                            {formatDistanceToNow(new Date(notif.createdAt), {
                                                addSuffix: true,
                                                locale: vi
                                            })}
                                        </span>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="unread-dot" style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#3b82f6',
                                            borderRadius: '50%',
                                            marginTop: '6px'
                                        }}></div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="notif-empty">
                                <div className="notif-empty-icon">
                                    <BellOff size={40} />
                                </div>
                                <p>Bạn không có thông báo nào</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
