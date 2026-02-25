import React, { useState, useEffect } from 'react';
import companyService from '../../services/api/companyService';
import './TaxLookup.css';

const TaxLookup = () => {
    const [taxCode, setTaxCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    // Thêm state để quản lý API Status thật
    const [apiOnline, setApiOnline] = useState(true);
    const [lastSync, setLastSync] = useState('N/A');

    useEffect(() => {
        const savedHistory = JSON.parse(localStorage.getItem('tax_history') || '[]');
        setHistory(savedHistory);
    }, []);

    const handleSearch = async (mst) => {
        const searchMst = mst || taxCode;
        if (!searchMst) return;
        if (mst) setTaxCode(mst);

        setLoading(true);
        setError(null);

        try {
            const response = await companyService.lookupTaxCode(searchMst);

            // Cập nhật tình trạng API Online khi có phản hồi từ server
            setApiOnline(true);

            if (response && response.result) {
                setCompany(response.result);
                updateHistory(response.result, searchMst);

                // Lấy thời gian hiện tại làm Last Sync
                const now = new Date();
                const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                setLastSync(timeStr);
            } else {
                setCompany(null);
                setError(response?.message || "Không tìm thấy kết quả");
            }
        } catch (err) {
            // Khi lỗi kết nối (catch), chuyển trạng thái sang Offline
            setApiOnline(false);
            setError("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    const updateHistory = (item, originalMst) => {
        const newHistory = [
            { taxCode: originalMst, name: item.name },
            ...history.filter(h => h.taxCode !== originalMst)
        ].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('tax_history', JSON.stringify(newHistory));
    };

    return (
        <div className="tax-page-wrapper">
            <div className="tax-main-container">
                <aside className="tax-sidebar">
                    <div className="sidebar-header">
                        <div className="brand-icon">🏛️</div>
                        <div className="brand-text">
                            <h3>Cổng Dữ Liệu</h3>
                            <p>Nguồn: tratencongty.com</p>
                        </div>
                    </div>

                    <div className="search-section">
                        <label className="input-label">NHẬP MÃ SỐ THUẾ</label>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="VD: 0312345678"
                                value={taxCode}
                                onChange={(e) => setTaxCode(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button onClick={() => handleSearch()} disabled={loading}>
                                {loading ? <span className="loader"></span> : "🔍"}
                            </button>
                        </div>

                        {/* HIỂN THỊ STATUS THẬT TẠI ĐÂY */}
                        <div className="api-status">
                            <span className={`status-pill ${apiOnline ? 'online' : 'offline'}`}>
                                ● {apiOnline ? 'API Online' : 'API Offline'}
                            </span>
                            <span className="status-pill sync">
                                {loading ? 'Đang gọi...' : `Đã đồng bộ: ${lastSync}`}
                            </span>
                        </div>
                    </div>

                    <div className="history-section">
                        <h4 className="section-title">LỊCH SỬ TRA CỨU</h4>
                        <div className="history-list">
                            {history.map((item, idx) => (
                                <div key={idx} className="history-card" onClick={() => handleSearch(item.taxCode)}>
                                    <div className="history-meta">
                                        <strong>{item.taxCode}</strong>
                                        <p>{item.name}</p>
                                    </div>
                                    <span className="arrow">›</span>
                                </div>
                            ))}
                            {error && <div className="error-box">⚠️ {error}</div>}
                        </div>
                    </div>
                </aside>

                <main className="tax-content">
                    {company ? (
                        <div className="company-detail-view">
                            <header className="company-banner">
                                <div className="banner-left">
                                    <span className="badge-active">{company.status || "ĐANG HOẠT ĐỘNG"}</span>
                                    <h1 className="company-full-name">{company.name}</h1>
                                </div>
                                <div className="banner-right">
                                    <p className="mst-label">MÃ SỐ THUẾ</p>
                                    {company.taxCodeImg ? (
                                        <img src={company.taxCodeImg} alt="MST" className="mst-img" />
                                    ) : <h2 className="mst-text">{taxCode}</h2>}
                                </div>
                            </header>

                            <div className="details-grid">
                                <section className="detail-card">
                                    <h4>CHI TIẾT ĐĂNG KÝ DOANH NGHIỆP</h4>
                                    <div className="vertical-info-list">
                                        <div className="info-row-v">
                                            <label>Địa chỉ trụ sở</label>
                                            <p>{company.address || "Chưa cập nhật"}</p>
                                        </div>
                                        <div className="info-row-v">
                                            <label>Đại diện pháp luật</label>
                                            <p><strong>{company.representative || "Chưa cập nhật"}</strong></p>
                                        </div>
                                        <div className="info-row-v">
                                            <label>Ngày cấp giấy phép</label>
                                            <p>{company.licenseDate || "N/A"}</p>
                                        </div>
                                        <div className="info-row-v">
                                            <label>Ngày hoạt động</label>
                                            <p>{company.startDate || "N/A"}</p>
                                        </div>
                                        <div className="info-row-v">
                                            <label>Điện thoại trụ sở</label>
                                            <div className="phone-container">
                                                {company.phoneImg ? (
                                                    <img src={company.phoneImg} alt="Phone" className="phone-img-v" />
                                                ) : <p>Chưa công khai</p>}
                                            </div>
                                        </div>
                                        <div className="info-row-v">
                                            <label>Trạng thái</label>
                                            <p className="status-highlight">● {company.status || "Đang hoạt động"}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-view">
                            <h3>Sẵn sàng tra cứu</h3>
                            <p>Nhập mã số thuế để xem dữ liệu định danh doanh nghiệp</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TaxLookup;