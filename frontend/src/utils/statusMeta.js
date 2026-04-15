export const STATUS_META = {
    ACTIVE: { label: 'Hoạt động', tone: 'success' },
    BANNED: { label: 'Đã khóa', tone: 'danger' },
    BAN: { label: 'Đã khóa', tone: 'danger' },
    PENDING: { label: 'Chờ duyệt', tone: 'warning' },
    OPEN: { label: 'Đang mở', tone: 'success' },
    CLOSED: { label: 'Đã đóng', tone: 'danger' },
    LOCK: { label: 'Đã khóa', tone: 'muted' },
    YELLOW: { label: 'Nghi ngờ', tone: 'warning' },
    RED: { label: 'Nguy hiểm', tone: 'danger' },
    GREEN: { label: 'Đã duyệt', tone: 'success' },
    INTERVIEW: { label: 'Phỏng vấn', tone: 'info' },
    HIRED: { label: 'Đã tuyển', tone: 'success' },
    REJECTED: { label: 'Từ chối', tone: 'danger' },
    TALENT_POOL: { label: 'Tiềm năng', tone: 'info' }
};

export const getStatusMeta = (status, fallbackLabel) => {
    if (!status) {
        return { label: fallbackLabel || 'Không xác định', tone: 'muted' };
    }
    return STATUS_META[status] || { label: fallbackLabel || status, tone: 'muted' };
};
