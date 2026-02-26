import React, {useState} from 'react';
import {toast} from 'sonner';
import {useCompany} from '../../hooks/useCompany';
import companyService from '../../services/api/companyService';
import './BusinessIdentity.css';

// --- Bước 2: Form Đăng ký Doanh nghiệp mới ---
const BusinessRegisterForm = ({taxCode, onBack}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        taxcode: taxCode,
        businessLicenseUrl: '',
        imageUrl: '',
        description: '',
        address: '',
        websiteUrl: ''
    });

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        toast.promise(companyService.registerIdentification(formData), {
            loading: 'Đang gửi hồ sơ định danh...',
            success: () => {
                setTimeout(() => window.location.reload(), 1500);
                return "Gửi hồ sơ thành công! Đang làm mới trang...";
            },
            error: (err) => {
                setIsSubmitting(false);
                return err.response?.data?.message || "Có lỗi xảy ra khi đăng ký.";
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="identity-card animate-in">
            <h3 className="form-title">Thông tin Đăng ký Doanh nghiệp</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">Tên công ty</label>
                    <input name="name" required onChange={handleChange} className="form-input"
                           placeholder="Tên theo GPKD"/>
                </div>
                <div className="form-group">
                    <label className="form-label">Mã số thuế</label>
                    <input name="taxcode" value={taxCode} readOnly className="form-input readonly"/>
                </div>
                <div className="form-group">
                    <label className="form-label">Link Logo</label>
                    <input name="imageUrl" onChange={handleChange} className="form-input" placeholder="https://..."/>
                </div>
                <div className="form-group">
                    <label className="form-label">Link GPKD (PDF/Ảnh)</label>
                    <input name="businessLicenseUrl" required onChange={handleChange} className="form-input"
                           placeholder="https://..."/>
                </div>
                <div className="form-group">
                    <label className="form-label">Địa chỉ</label>
                    <input name="address" required onChange={handleChange} className="form-input"
                           placeholder="Địa chỉ trụ sở"/>
                </div>
                <div className="form-group">
                    <label className="form-label">Website</label>
                    <input name="websiteUrl" onChange={handleChange} className="form-input" placeholder="https://..."/>
                </div>
                <div className="form-group full-width">
                    <label className="form-label">Mô tả ngắn</label>
                    <textarea name="description" rows="3" onChange={handleChange} className="form-input"
                              placeholder="Giới thiệu về công ty..."/>
                </div>
            </div>
            <div className="button-group">
                <button type="button" onClick={onBack} className="btn-outline">Quay lại</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang xử lý...' : 'Gửi định danh'}
                </button>
            </div>
        </form>
    );
};

// --- Component Chính ---
const BusinessIdentity = () => {
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
        } else if (response && response.code === 6002) {
            toast.info("Mã số thuế chưa tồn tại. Vui lòng đăng ký mới!");
            setStep(2);
        } else {
            toast.error(response?.message || "Hệ thống đang bận, vui lòng thử lại sau.");
        }
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
                return "Đã gửi yêu cầu gia nhập thành công!";
            },
            error: (err) => {
                setIsJoining(false);
                return err.response?.data?.message || "Yêu cầu thất bại. Có thể bạn đã tham gia công ty này rồi.";
            }
        });
    };

    return (
        <div className="identity-container">
            <div className="identity-header">
                <h1>Định danh Doanh nghiệp</h1>
                <p>Nâng cao uy tín nhà tuyển dụng trên SkillBridge</p>
            </div>

            {/* BƯỚC 1: KIỂM TRA MST */}
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

            {/* BƯỚC 2: FORM ĐĂNG KÝ */}
            {step === 2 && <BusinessRegisterForm taxCode={taxCode} onBack={() => setStep(1)}/>}

            {/* BƯỚC 3: THÔNG TIN CHI TIẾT & JOIN */}
            {/*{step === 3 && companyInfo && (*/}
            {/*    <div className="identity-card join-section animate-in">*/}
            {/*        <div className="company-info-display">*/}
            {/*            <img*/}
            {/*                src={companyInfo.imageUrl || "https://img.icons8.com/color/96/company.png"}*/}
            {/*                alt="logo"*/}
            {/*                className="company-logo-preview"*/}
            {/*                onError={(e) => e.target.src = "https://img.icons8.com/color/96/company.png"}*/}
            {/*            />*/}
            {/*            <h2 className="company-name-highlight">{companyInfo.name}</h2>*/}

            {/*            <div className="info-list">*/}
            {/*                <div className="info-row">*/}
            {/*                    <strong>Mã số thuế:</strong> <span>{companyInfo.taxId}</span>*/}
            {/*                </div>*/}
            {/*                <div className="info-row">*/}
            {/*                    <strong>Địa chỉ:</strong> <span>{companyInfo.address || 'Chưa cập nhật'}</span>*/}
            {/*                </div>*/}
            {/*                <div className="info-row">*/}
            {/*                    <strong>Website:</strong>*/}
            {/*                    <a href={companyInfo.websiteUrl} target="_blank" rel="noreferrer">*/}
            {/*                        {companyInfo.websiteUrl || "N/A"}*/}
            {/*                    </a>*/}
            {/*                </div>*/}
            {/*                <div className="info-row">*/}
            {/*                    <strong>Trạng thái:</strong>*/}
            {/*                    <span className={`status-badge ${companyInfo.status.toLowerCase()}`}>*/}
            {/*                        {companyInfo.status === 'BAN' ? 'BỊ KHÓA' :*/}
            {/*                            companyInfo.status === 'PENDING' ? 'CHỜ DUYỆT' : 'HOẠT ĐỘNG'}*/}
            {/*                    </span>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </div>*/}

            {/*        <div className="alert-message">*/}
            {/*            {companyInfo.status === 'BAN'*/}
            {/*                ? "Doanh nghiệp này hiện đang bị tạm khóa khỏi hệ thống."*/}
            {/*                : "Doanh nghiệp đã được đăng ký. Bạn có muốn gửi yêu cầu tham gia không?"}*/}
            {/*        </div>*/}

            {/*        <div className="button-group">*/}
            {/*            <button onClick={() => setStep(1)} className="btn-outline">Quay lại</button>*/}
            {/*            <button*/}
            {/*                onClick={handleJoinRequest}*/}
            {/*                className="btn-success"*/}
            {/*                disabled={isJoining || companyInfo.status === 'BAN'}*/}
            {/*            >*/}
            {/*                {isJoining ? 'Đang gửi...' : 'Yêu cầu tham gia ngay'}*/}
            {/*            </button>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}

            {step === 3 && companyInfo && (
                <div className="identity-card join-section animate-in">
                    <div className="company-info-display">
                        <img
                            src={companyInfo.imageUrl || "https://img.icons8.com/color/96/company.png"}
                            alt="logo"
                            className="company-logo-preview"
                            onError={(e) => e.target.src = "https://img.icons8.com/color/96/company.png"}
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

                    {/* THÔNG BÁO: Đổi màu nền đỏ nếu trạng thái là BAN */}
                    <div className={`alert-message ${companyInfo.status === 'BAN' ? 'alert-danger' : 'alert-info'}`}>
                        {companyInfo.status === 'BAN'
                            ? "Doanh nghiệp này hiện đang bị tạm khóa khỏi hệ thống."
                            : "Doanh nghiệp đã được đăng ký. Bạn có muốn gửi yêu cầu tham gia không?"}
                    </div>

                    <div className="button-group">
                        <button onClick={() => setStep(1)} className="btn-outline">Quay lại</button>

                        {/* NÚT BẤM: Đổi class btn-ban và disable nếu bị BAN */}
                        <button
                            onClick={handleJoinRequest}
                            className={companyInfo.status === 'BAN' ? 'btn-ban' : 'btn-success'}
                            disabled={isJoining || companyInfo.status === 'BAN'}
                        >
                            {companyInfo.status === 'BAN' ? 'Không thể tham gia' : 'Yêu cầu tham gia ngay'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessIdentity;