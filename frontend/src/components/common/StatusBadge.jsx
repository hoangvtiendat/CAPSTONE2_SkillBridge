import React from 'react';
import { getStatusMeta } from '../../utils/statusMeta';

const StatusBadge = ({ status, label }) => {
    const meta = getStatusMeta(status, label);
    return <span className={`app-status-badge ${meta.tone}`}>{meta.label}</span>;
};

export default StatusBadge;
