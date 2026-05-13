import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {useCompany} from '../../hooks/useCompany';
import companyService from '../../services/api/companyService';
import vietnamAdministrativeLegacy from '../../data/vietnamAdministrativeLegacy.json';
import './BusinessIdentity.css';


const isProvinceActive = (province) => {
    const deletedValue = province?.isDeleted ?? province?.is_delete ?? province?.isDelete ?? 0;
    return Number(deletedValue) === 0;
};


const BusinessRegisterForm = ({taxCode, onBack}) => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States cho File và Preview
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [gpkdFile, setGpkdFile] = useState(null);
    const [licensePreview, setLicensePreview] = useState(null);
    const [provinces] = useState(vietnamAdministrativeLegacy);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
    const [selectedWardCode, setSelectedWardCode] = useState('');
    const [specificAddress, setSpecificAddress] = useState('');

    const [formData, setFormData] = useState({
        name: '', taxcode: taxCode, address: '', websiteUrl: '', description: ''
    });

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    // Hàm xử lý khi chọn file Logo
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file)); // Tạo link preview
        }
    };



    // Hàm xử lý khi chọn file GPKD
    const handleLicenseChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGpkdFile(file);
            // Chỉ preview nếu là định dạng ảnh, nếu là PDF thì có thể hiện icon
            if (file.type.startsWith('image/')) {
                setLicensePreview(URL.createObjectURL(file));
            } else {
                setLicensePreview(null); // Không preview ảnh nếu là PDF
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!logoFile || !gpkdFile) return toast.warning("Vui lòng chọn đủ Logo và GPKD");
        if (!selectedProvinceCode || !selectedDistrictCode || !selectedWardCode || !specificAddress.trim()) {
            return toast.warning("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Xã/Phường và địa chỉ cụ thể");
        }

        const selectedProvince = provinces.find((province) => String(province.code) === selectedProvinceCode);
        const selectedDistrict = selectedProvince?.districts?.find(
            (district) => String(district.code) === selectedDistrictCode
        );
        const selectedWard = selectedDistrict?.wards?.find((ward) => String(ward.code) === selectedWardCode);

        const finalAddress = [
            specificAddress.trim(),
            selectedWard?.name,
            selectedDistrict?.name,
            selectedProvince?.name
        ].filter(Boolean).join(', ');

        setIsSubmitting(true);
        const data = new FormData();
        const payload = {...formData, address: finalAddress};
        const jsonBlob = new Blob([JSON.stringify(payload)], {type: 'application/json'});
        data.append('request', jsonBlob);
        data.append('logo', logoFile);
        data.append('license', gpkdFile);

        toast.promise(companyService.registerIdentification(data), {
            loading: 'Đang tải hồ sơ lên hệ thống...',
            success: () => {
                setTimeout(() => navigate('/'), 1500);
                return "Gửi hồ sơ thành công!";
            },
            error: (err) => {
                setIsSubmitting(false);
                return err.response?.data?.message || "Lỗi upload.";
            }
        });
    };

    const selectedProvince = provinces.find((province) => String(province.code) === selectedProvinceCode);
    const districtOptions = selectedProvince?.districts || [];
    const selectedDistrict = districtOptions.find((district) => String(district.code) === selectedDistrictCode);
    const wardOptions = selectedDistrict?.wards || [];

    const locationPreview = [
        specificAddress.trim(),
        wardOptions.find((ward) => String(ward.code) === selectedWardCode)?.name,
        selectedDistrict?.name,
        selectedProvince?.name
    ].filter(Boolean).join(', ');

    return (
        <form onSubmit={handleSubmit} className="identity-card animate-in">
            <h3 className="form-title">Định danh Doanh nghiệp (Upload Hồ sơ)</h3>
            <div className="form-grid">
                <div className="form-group full-width">
                    <label className="form-label">Tên công ty</label>
                    <input name="name" required onChange={handleChange} className="form-input"
                           placeholder="Tên chính thức trên GPKD"/>
                </div>

                <div className="form-group">
                    <label className="form-label">Mã số thuế</label>
                    <input value={taxCode} readOnly className="form-input readonly"/>
                </div>

                <div className="form-group">
                    <label className="form-label">Website</label>
                    <input name="websiteUrl" onChange={handleChange} className="form-input" placeholder="https://..."/>
                </div>

                <div className="form-group">
                    <label className="form-label">Logo công ty</label>
                    <div className="file-upload-wrapper">
                        {logoPreview && (
                            <div className="image-preview-box">
                                <img src={logoPreview} alt="Logo Preview"/>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="file-input-hidden"
                               id="logo-upload"/>
                        <label htmlFor="logo-upload" className="file-label-custom">
                            {logoFile ? ` ${logoFile.name}` : "Chọn ảnh Logo"}
                        </label>
                    </div>
                </div>

                {/* FILE UPLOAD: GPKD */}
                <div className="form-group">
                    <label className="form-label">Giấy phép kinh doanh (GPKD)</label>
                    <div className="file-upload-wrapper">
                        {licensePreview ? (
                            <div className="image-preview-box">
                                <img src={licensePreview} alt="License Preview"/>
                            </div>
                        ) : gpkdFile && (
                            <div className="pdf-selected-info">
                                📄 Đã chọn file PDF: {gpkdFile.name}
                            </div>
                        )}
                        <input type="file" accept=".pdf,image/*" onChange={handleLicenseChange}
                               className="file-input-hidden" id="gpkd-upload"/>
                        <label htmlFor="gpkd-upload" className="file-label-custom">
                            {gpkdFile ? ` ${gpkdFile.name}` : "Chọn GPKD (PDF/Ảnh)"}
                        </label>
                    </div>
                </div>
                <div className="form-group full-width">
                    <label className="form-label">Địa chỉ trụ sở chính</label>
                    <div className="identity-location-grid">
                        <div className="identity-location-field">
                            <label className="form-label identity-mini-label">Tỉnh/Thành phố</label>
                            <select
                                className="form-input"
                                value={selectedProvinceCode}
                                onChange={(e) => {
                                    setSelectedProvinceCode(e.target.value);
                                    setSelectedDistrictCode('');
                                    setSelectedWardCode('');
                                }}
                                required
                            >
                                <option value="">-- Chọn tỉnh/thành phố --</option>
                                {provinces.filter(isProvinceActive).map((province) => (
                                    <option key={province.code} value={province.code}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="identity-location-field">
                            <label className="form-label identity-mini-label">Quận/Huyện</label>
                            <select
                                className="form-input"
                                value={selectedDistrictCode}
                                onChange={(e) => {
                                    setSelectedDistrictCode(e.target.value);
                                    setSelectedWardCode('');
                                }}
                                required
                                disabled={!selectedProvinceCode}
                            >
                                <option value="">-- Chọn quận/huyện --</option>
                                {districtOptions.map((district) => (
                                    <option key={district.code} value={district.code}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="identity-location-field full-width">
                            <label className="form-label identity-mini-label">Xã/Phường</label>
                            <select
                                className="form-input"
                                value={selectedWardCode}
                                onChange={(e) => setSelectedWardCode(e.target.value)}
                                required
                                disabled={!selectedDistrictCode}
                            >
                                <option value="">-- Chọn xã/phường --</option>
                                {wardOptions.map((ward) => (
                                    <option key={ward.code} value={ward.code}>
                                        {ward.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="identity-location-field full-width">
                            <label className="form-label identity-mini-label">Địa chỉ cụ thể</label>
                            <input
                                value={specificAddress}
                                onChange={(e) => setSpecificAddress(e.target.value)}
                                className="form-input"
                                placeholder="VD: Số 12 Nguyễn Huệ"
                                required
                            />
                        </div>
                    </div>
                    {locationPreview && (
                        <div className="identity-location-preview">
                            <span>Địa chỉ đã chọn</span>
                            <strong>{locationPreview}</strong>
                        </div>
                    )}
                </div>

                <div className="form-group full-width">
                    <label className="form-label">Mô tả doanh nghiệp</label>
                    <textarea name="description" rows="3" onChange={handleChange} className="form-input"
                              placeholder="Giới thiệu ngắn về doanh nghiệp..."/>
                </div>
            </div>

            <div className="button-group">
                <button type="button" onClick={onBack} className="btn-outline">Quay lại</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang gửi...' : 'Gửi hồ sơ định danh'}
                </button>
            </div>
        </form>
    );
};

// --- Component Chính ---
const BusinessIdentity = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [taxCode, setTaxCode] = useState('');
    const [companyInfo, setCompanyInfo] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const {checkTaxCode, loading} = useCompany();

    const handleCheckTaxCode = async () => {
        if (!taxCode.trim()) return toast.warning("Vui lòng nhập mã số thuế");

        const response = await checkTaxCode(taxCode);

        if (response && response.code === 200) {
            toast.success("Tìm thấy thông tin doanh nghiệp!");
            setCompanyInfo(response.result);
            setStep(3);
        } else if (response && response.code === 4000) {
            toast.info("Mã số thuế chưa tồn tại. Vui lòng đăng ký mới!");
            setStep(2);
        } else {
            toast.error(response?.message || "Hệ thống đang bận, vui lòng thử lại sau.");
        }
    };

    const API_BASE_URL = "http://localhost:8081/identity";

    const getImageUrl = (path) => {
        if (!path) return "https://img.icons8.com/color/96/company.png";
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    };

    const handleJoinRequest = async () => {
        if (companyInfo?.status === 'BAN') {
            return toast.error("Công ty này đang bị khóa, không thể gửi yêu cầu!");
        }

        setIsJoining(true);
        toast.promise(companyService.requestToJoin(companyInfo.id), {
            loading: 'Đang gửi yêu cầu gia nhập...',
            success: () => {
                setIsJoining(false);
                setTimeout(() => {
                    navigate('/');
                }, 1500);
                return "Yêu cầu gia nhập thành công! Đang quay về trang chủ...";
            },
            error: (err) => {
                setIsJoining(false);
                return err.response?.data?.message || "Yêu cầu thất bại.";
            }
        });
    };

    return (
        <div className="identity-container">
            <div className="identity-header">
                <h1>Định danh Doanh nghiệp</h1>
                <p>Nâng cao uy tín nhà tuyển dụng trên SkillBridge</p>
            </div>

            {step === 1 && (
                <div className="identity-card animate-in">
                    <label className="form-label">Nhập mã số thuế để kiểm tra</label>
                    <div className="search-input-group">
                        <input
                            className="form-input"
                            value={taxCode}
                            onChange={(e) => setTaxCode(e.target.value)}
                            placeholder="Ví dụ: 0312345678"
                            onKeyDown={(e) => e.key === 'Enter' && handleCheckTaxCode()}
                        />
                        <button onClick={handleCheckTaxCode} className="btn-primary" style={{width: '120px'}}
                                disabled={loading}>
                            {loading ? '...' : 'Kiểm tra'}
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && <BusinessRegisterForm taxCode={taxCode} onBack={() => setStep(1)}/>}

            {step === 3 && companyInfo && (
                <div className="identity-card join-section animate-in">
                    <div className="company-info-display">
                        <img
                            src={getImageUrl(companyInfo.imageUrl)}
                            alt="logo"
                            className="company-logo-preview"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://img.icons8.com/color/96/company.png";
                            }}
                        />
                        <h2 className="company-name-highlight">{companyInfo.name}</h2>

                        <div className="info-list">
                            <div className="info-row">
                                <strong>Mã số thuế:</strong> <span>{companyInfo.taxId}</span>
                            </div>
                            <div className="info-row">
                                <strong>Địa chỉ:</strong> <span>{companyInfo.address || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="info-row">
                                <strong>Website:</strong>
                                <a href={companyInfo.websiteUrl} target="_blank" rel="noreferrer">
                                    {companyInfo.websiteUrl || "N/A"}
                                </a>
                            </div>
                            <div className="info-row">
                                <strong>Trạng thái:</strong>
                                <span className={`status-badge ${companyInfo.status.toLowerCase()}`}>
                                    {companyInfo.status === 'BAN' ? 'BỊ KHÓA' :
                                        companyInfo.status === 'PENDING' ? 'CHỜ DUYỆT' : 'HOẠT ĐỘNG'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`alert-message ${companyInfo.status === 'BAN' ? 'alert-danger' : 'alert-info'}`}>
                        {companyInfo.status === 'BAN'
                            ? "Doanh nghiệp này hiện đang bị tạm khóa khỏi hệ thống."
                            : "Doanh nghiệp đã được đăng ký. Bạn có muốn gửi yêu cầu tham gia không?"}
                    </div>

                    <div className="button-group">
                        <button onClick={() => setStep(1)} className="btn-outline">Quay lại</button>
                        <button
                            onClick={handleJoinRequest}
                            className={companyInfo.status === 'BAN' ? 'btn-ban' : 'btn-success'}
                            disabled={isJoining || companyInfo.status === 'BAN'}
                        >
                            {companyInfo.status === 'BAN' ? 'Không thể tham gia' : (isJoining ? 'Đang gửi...' : 'Yêu cầu tham gia ngay')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessIdentity;