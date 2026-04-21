import React, { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, Search, X, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import provincesServices from '../../services/api/provincesServices';
import '../../components/admin/Admin.css';

const LocationManagementPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [editingLocation, setEditingLocation] = useState(null);
    const [formData, setFormData] = useState({ name: '', isDeleted: '0' });

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const response = await provincesServices.getProvinces();
            setLocations(response?.result || []);
        } catch (error) {
            toast.error('Không thể tải danh sách địa phương');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const filteredLocations = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return locations;
        return locations.filter((location) =>
            String(location?.name || '').toLowerCase().includes(keyword)
        );
    }, [searchTerm, locations]);

    const beginEdit = (location) => {
        setEditingLocation(location.id);
        setFormData({
            name: location.name ?? '',
            isDeleted: Number(location.isDeleted) === 1 ? '1' : '0'
        });
    };

    const cancelEdit = () => {
        setEditingLocation(null);
        setFormData({ name: '', isDeleted: '0' });
    };

    const isClosedStatus = (value) => Number(value) === 1;

    const normalizeNameValue = (value) => {
        const trimmed = String(value).trim();
        if (/^\d+$/.test(trimmed)) {
            return Number(trimmed);
        }
        return trimmed;
    };

    const normalizeStatusValue = (value) => (Number(value) === 1 ? 1 : 0);

    const handleUpdate = async (id) => {
        const normalizedName = normalizeNameValue(formData.name);
        if (String(normalizedName).trim() === '') {
            toast.warning('Tên địa phương không được để trống');
            return;
        }

        const payload = {
            name: normalizedName,
            isDeleted: normalizeStatusValue(formData.isDeleted)
        };

        setUpdatingId(id);
        try {
            const response = await provincesServices.updateProvince(id, payload);
            const updatedLocation = response?.result ?? payload;

            setLocations((prev) =>
                prev.map((location) =>
                    location.id === id
                        ? {
                            ...location,
                            name: updatedLocation.name ?? payload.name,
                            isDeleted: Number(updatedLocation.isDeleted ?? payload.isDeleted)
                        }
                        : location
                )
            );

            toast.success('Cập nhật địa phương thành công');
            cancelEdit();
        } catch (error) {
            toast.error('Cập nhật địa phương thất bại');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="industry-management animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Quản lý địa phương</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
                        Danh sách địa phương phục vụ lọc việc làm và hồ sơ ứng viên.
                    </p>
                </div>
            </div>

            <div className="modern-card">
                <div className="filters-bar">
                    <div className="search-wrapper" style={{ maxWidth: '380px' }}>
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm địa phương..."
                            className="modern-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                        Tổng số: <b>{filteredLocations.length}</b>
                    </div>
                </div>

                <div className="table-container">
                    {loading && (
                        <div className="table-loader-overlay">
                            <Loader2 className="spinning-icon" size={40} />
                        </div>
                    )}

                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Tên địa phương</th>
                                <th style={{ width: '180px' }}>Trạng thái</th>
                                <th style={{ width: '260px', textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLocations.length > 0 ? (
                                filteredLocations.map((location) => {
                                    const isEditing = editingLocation === location.id;
                                    const isSubmitting = updatingId === location.id;
                                    return (
                                    <tr key={location.id} className="table-row-hover">
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-avatar-wrapper" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
                                                    <div className="user-avatar-placeholder" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                        <MapPin size={18} />
                                                    </div>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="modern-input"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                                        style={{ height: '38px', maxWidth: '280px' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{location.name}</span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            {isEditing ? (
                                                <select
                                                    className="modern-select"
                                                    style={{ height: '38px', minWidth: '140px' }}
                                                    value={String(formData.isDeleted)}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, isDeleted: e.target.value }))}
                                                >
                                                    <option value="0">Đang mở</option>
                                                    <option value="1">Đang đóng</option>
                                                </select>
                                            ) : (
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '6px 10px',
                                                        borderRadius: '999px',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        backgroundColor: isClosedStatus(location.isDeleted) ? '#fef2f2' : '#ecfdf5',
                                                        color: isClosedStatus(location.isDeleted) ? '#dc2626' : '#059669'
                                                    }}
                                                >
                                                    {isClosedStatus(location.isDeleted) ? 'Đóng' : 'Mở'}
                                                </span>
                                            )}
                                        </td>

                                        <td style={{ textAlign: 'right' }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        className="action-btn"
                                                        style={{ width: '42px', height: '42px', background: '#ecfdf5', color: '#059669' }}
                                                        onClick={() => handleUpdate(location.id)}
                                                        disabled={isSubmitting}
                                                        title="Lưu"
                                                    >
                                                        {isSubmitting ? <Loader2 size={18} className="spinning-icon" /> : <Check size={18} />}
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        style={{ width: '42px', height: '42px', background: '#fef2f2', color: '#dc2626' }}
                                                        onClick={cancelEdit}
                                                        disabled={isSubmitting}
                                                        title="Hủy"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="action-btn info-btn"
                                                    onClick={() => beginEdit(location)}
                                                    style={{ width: '42px', height: '42px' }}
                                                    title="Cập nhật"
                                                >
                                                    <Settings2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                                })
                            ) : (
                                <tr>
                                    <td className="empty-table-state" colSpan="3">
                                        <div className="empty-content">
                                            <MapPin size={42} />
                                            <p>{loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy địa phương phù hợp'}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LocationManagementPage;
