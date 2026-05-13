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

    // Sync unread count whenever notifications change
    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Lắng nghe sự kiện thông báo mới từ App.jsx
        const handleNewNotification = (event) => {
            const newNotif = event.detail;
            setNotifications(prev => [newNotif, ...prev]);
        };

        // Lắng nghe sự kiện thông báo AI mới
        const handleNewAINotification = (event) => {
            const aiNotif = event.detail;
            const transformedNotif = {
                id: aiNotif.id,
                title: aiNotif.title || 'Thông báo kết quả duyệt tin tuyển dụng từ AI',
                subtitle: 'Thông báo từ SkillBridge AI',
                content: aiNotif.message || '',
                type: aiNotif.action === 'JOB_MODERATION_FAILED' ? 'APPLICATION_STATUS' : 'NEW_JOB',
                link: aiNotif.objId ? `/detail-jd/${aiNotif.objId}` : null,
                createdAt: aiNotif.createdAt || new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [transformedNotif, ...prev]);
        };

        window.addEventListener('NEW_NOTIFICATION', handleNewNotification);
        window.addEventListener('NEW_AI_NOTIFICATION', handleNewAINotification);

        return () => {
            window.removeEventListener('NEW_NOTIFICATION', handleNewNotification);
            window.removeEventListener('NEW_AI_NOTIFICATION', handleNewAINotification);
        };
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
            const [regularRes, aiRes] = await Promise.all([
                notificationService.getNotifications().catch(() => ({ result: [] })),
                notificationService.notificationByAI().catch(() => ({ result: [] }))
            ]);

            console.debug('Regular notifications API response:', regularRes);
            console.debug('AI notifications API response:', aiRes);

            // Transform regular notifications with standardized format
            const regularNotifications = (regularRes?.result || []).map(notif => ({
                id: notif.id,
                title: 'Thông báo kết quả duyệt tin tuyển dụng',
                subtitle: 'Thông báo từ SkillBridge',
                content: notif.content,
                type: notif.type || 'APPLICATION_STATUS',
                link: notif.link,
                createdAt: notif.createdAt || new Date().toISOString(),
                read: notif.read || false
            }));

            console.debug('Transformed regular notifications:', regularNotifications);

            // Transform AI notifications with standardized format
            const aiNotifications = (aiRes?.result || []).map(notif => ({
                id: notif.id,
                title: notif.title || 'Thông báo kết quả duyệt tin tuyển dụng từ AI',
                subtitle: 'Thông báo từ SkillBridge AI',
                content: notif.message || '',
                type: notif.action === 'JOB_MODERATION_FAILED' ? 'APPLICATION_STATUS' : 'NEW_JOB',
                link: notif.objId ? `/detail-jd/${notif.objId}` : null,
                createdAt: notif.createdAt || new Date().toISOString(),
                read: false
            }));

            console.debug('Transformed AI notifications:', aiNotifications);

            // Combine both results with regular first, then AI
            const allNotifications = [...regularNotifications, ...aiNotifications];
            const uniqueNotifications = Array.from(
                new Map(allNotifications.map(n => [n.id, n])).values()
            );

            console.debug('Final combined notifications:', uniqueNotifications);

            setNotifications(uniqueNotifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleMarkAsRead = async (id, link) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
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
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
                                    className={`notif-item ${!notif.read ? 'unread' : ''}`}
                                    onClick={() => handleMarkAsRead(notif.id, notif.link)}
                                >
                                    <div className="notif-icon-wrapper">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="notif-content">
                                        <p className="notif-title">{notif.title}</p>
                                        {notif.subtitle && (
                                            <p className="notif-subtitle">{notif.subtitle}</p>
                                        )}
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
                                    {!notif.read && (
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
