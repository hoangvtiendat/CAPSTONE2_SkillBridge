import React, {useEffect, useState, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import jobService from '../../services/api/jobService';
import candidateService from '../../services/api/candidateService';
import axios from 'axios';
import {formatDistanceToNow} from 'date-fns';
import {vi} from 'date-fns/locale';
import {
    MapPin,
    Banknote,
    Tag,
    Clock,
    ChevronLeft,
    Building2,
    Send,
    Sparkles,
    AlertCircle,
    X,
    FileText,
    CheckCircle2,
    Upload,
    Database,
    Edit3,
    Plus,
    Trash2,
    Save
} from 'lucide-react';
import './JobDetail.css';
import {toast, Toaster} from 'sonner';
import {useAuth} from '../../context/AuthContext';

const API_BASE_URL = "http://localhost:8081/identity";

const formatSalary = (amount) => {
    if (!amount && amount !== 0) return "Thỏa thuận";
    return new Intl.NumberFormat('vi-VN').format(amount) + " VND";
};

const JobDetailPage = () => {
    const {user} = useAuth();
    const {jobId} = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Apply States
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cvFile, setCvFile] = useState(null);
    const [applyMethod, setApplyMethod] = useState('upload');
    const [isParsing, setIsParsing] = useState(false);

    // Form States (Đồng bộ cấu trúc với CVParser)
    const [cvData, setCvData] = useState({
        name: '', description: '', address: '', categoryId: '', category: '', degrees: [], skills: [], experience: []
    });

    const handleApplyClick = () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thực hiện ứng tuyển!");
            navigate('/login');
            return;
        }
        setShowApplyModal(true);
    };

    const handleAddSkill = () => {
        const normalizedName = newSkillName.trim();
        if (normalizedName) {
            // Kiểm tra trùng lặp
            if (!cvData.skills.some(s => s.skillName.toLowerCase() === normalizedName.toLowerCase())) {
                setCvData(prev => ({
                    ...prev, skills: [...prev.skills, {
                        skillName: normalizedName, experienceYears: parseInt(newSkillExp) || 1
                    }]
                }));
                setNewSkillName('');
                setNewSkillExp(1);
                toast.success(`Đã thêm kỹ năng ${normalizedName}`);
            } else {
                toast.warning("Kỹ năng này đã tồn tại!");
            }
        } else {
            toast.error("Vui lòng nhập tên kỹ năng!");
        }
    };

    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillExp, setNewSkillExp] = useState(1);

    const [formData, setFormData] = useState({
        name: '', email: '', numberPhone: '', recommendationLetter: ''
    });

    const [showAIModal, setShowAIModal] = useState(false);
    const [aiResults, setAiResults] = useState([]);
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.fullName || user.name || '',
                email: user.email || '',
                numberPhone: user.phoneNumber || ''
            }));
        }
    }, [user]);

    const fetchJobDetail = useCallback(async () => {
        try {
            const data = await jobService.getJobDetailByCandidate(jobId);
            setJob(data);
            if (data.title) {
                let rawTitle = data.title;
                try {
                    rawTitle = typeof rawTitle === 'string' ? JSON.parse(rawTitle) : rawTitle;
                } catch (e) {
                    rawTitle = {};
                }
                const sections = Object.entries(rawTitle).map(([key, value]) => ({
                    name: key,
                    description: Array.isArray(value) ? value : (typeof value === 'string' ? value.split('\n') : [])
                }));
                setParsedData(sections);
            }
        } catch (error) {
            toast.error("Lỗi tải chi tiết công việc");
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchJobDetail();
    }, [fetchJobDetail]);

    /* ================= CV LOGIC (FROM CVPARSER) ================= */

    const handleUseExistingCV = async () => {
        setApplyMethod('existing');
        const toastId = toast.loading("Đang nạp hồ sơ và tải file CV từ hệ thống...");

        try {
            const token = localStorage.getItem('accessToken');
            const response = await candidateService.getCv();

            if (response && response.result) {
                const res = response.result;

                // 1. Map dữ liệu JSON vào form để người dùng confirm
                setCvData({
                    ...res,
                    skills: Array.isArray(res.skills) ? res.skills.map(s => ({
                        skillId: s.skillId || null,
                        skillName: s.skillName || s.name || 'Skill',
                        experienceYears: s.experienceYears || 1
                    })) : [],
                    degrees: res.degrees || [],
                    experience: res.experience || []
                });

                // 2. XỬ LÝ FILE: Tải file PDF từ cvUrl về
                if (res.cvUrl) {
                    // Đường dẫn đầy đủ: http://localhost:8081/identity/CVs/tên_file.pdf
                    const fullCvUrl = `http://localhost:8081/identity${res.cvUrl}`;

                    try {
                        const fileResponse = await axios.get(fullCvUrl, {
                            headers: {'Authorization': `Bearer ${token}`},
                            responseType: 'blob' // Rất quan trọng để lấy dữ liệu nhị phân
                        });

                        // Chuyển đổi Blob thành File object
                        const fileName = res.cvUrl.split('/').pop(); // Lấy tên file từ URL
                        const file = new File([fileResponse.data], fileName, {type: 'application/pdf'});

                        setCvFile(file); // Lưu vào state để hàm Submit dùng
                    } catch (fileErr) {
                        console.error("Không thể tải file vật lý:", fileErr);
                        toast.error("Hệ thống tìm thấy hồ sơ nhưng không tải được file CV gốc.");
                    }
                }

                setShowConfirmModal(true);
                toast.success("Đã nạp hồ sơ thành công!", {id: toastId});
            }
        } catch (error) {
            toast.error("Bạn chưa có hồ sơ trên hệ thống. Vui lòng tải CV mới.", {id: toastId});
            setApplyMethod('upload');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return toast.error("Vui lòng chọn file PDF");

        setCvFile(file);
        setApplyMethod('upload');
        setIsParsing(true);
        const toastId = toast.loading("AI đang phân tích CV...");

        try {
            const response = await candidateService.parseCv(file);
            if (response && response.result) {
                const res = response.result;
                setCvData({
                    name: res.name || '',
                    description: res.description || '',
                    address: res.address || '',
                    categoryId: res.categoryId || '',
                    category: res.category || '',
                    skills: res.skills?.map(s => ({
                        skillId: s.skillId || null,
                        skillName: s.skillName || s.name,
                        experienceYears: s.experienceYears || 1
                    })) || [],
                    degrees: res.degrees || [],
                    experience: res.experience || []
                });
                setShowConfirmModal(true);
                toast.success("AI đã phân tích xong!", {id: toastId});
            }
        } catch (error) {
            toast.error("AI lỗi phân tích, hãy nhập thủ công.", {id: toastId});
            setShowConfirmModal(true);
        } finally {
            setIsParsing(false);
        }
    };

    // --- FORM HANDLERS (Degrees, Exp, Skills) ---
    const updateField = (field, value) => setCvData(prev => ({...prev, [field]: value}));

    const addDegree = (type) => setCvData(prev => ({
        ...prev,
        degrees: [...prev.degrees, type === 'DEGREE' ? {
            id: Date.now(),
            type,
            degree: '',
            major: '',
            institution: '',
            graduationYear: ''
        } : {id: Date.now(), type, name: '', year: ''}]
    }));

    const updateDegreeItem = (id, field, value) => setCvData(prev => ({
        ...prev, degrees: prev.degrees.map(d => (d.id === id || d._id === id) ? {...d, [field]: value} : d)
    }));

    const addExperience = () => setCvData(prev => ({
        ...prev, experience: [...prev.experience, {id: Date.now(), startDate: '', endDate: '', description: ''}]
    }));

    const updateExperience = (id, field, value) => setCvData(prev => ({
        ...prev, experience: prev.experience.map(e => (e.id === id || e._id === id) ? {...e, [field]: value} : e)
    }));

    const addSkill = (e) => {
        if (e.key === 'Enter' && newSkillName.trim()) {
            e.preventDefault();
            if (!cvData.skills.some(s => s.skillName.toLowerCase() === newSkillName.trim().toLowerCase())) {
                setCvData(prev => ({
                    ...prev, skills: [...prev.skills, {skillName: newSkillName.trim(), experienceYears: newSkillExp}]
                }));
            }
            setNewSkillName('');
        }
    };

    /* ================= APPLY SUBMIT ================= */
    const handleApplySubmit = async (e) => {
        e.preventDefault();

        // Kiểm tra file CV (Bắt buộc phải có dù là cũ hay mới)
        if (!cvFile) {
            return toast.error("Vui lòng đảm bảo đã tải lên hoặc chọn hồ sơ hệ thống!");
        }

        setSubmitting(true);
        const toastId = toast.loading("Đang gửi hồ sơ ứng tuyển...");
        const data = new FormData();

        // Chuẩn bị request JSON
        const jsonRequest = {
            name: formData.name,
            email: formData.email,
            numberPhone: formData.numberPhone,
            recommendationLetter: formData.recommendationLetter,
            parsedContent: {
                ...cvData,
                // Backend thường yêu cầu skills là mảng String
                skills: cvData.skills.map(s => s.skillName)
            }
        };

        // Gắn Part 'request' (JSON)
        data.append('request', new Blob([JSON.stringify(jsonRequest)], {type: 'application/json'}));

        // Gắn Part 'cv' (File PDF) - Đảm bảo key là 'cv' như BE yêu cầu
        data.append('cv', cvFile);

        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_BASE_URL}/jobs/${jobId}/apply`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success("Ứng tuyển thành công!", {id: toastId});
            setShowApplyModal(false);
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi khi gửi hồ sơ.";
            toast.error(errorMsg, {id: toastId});
        } finally {
            setSubmitting(false);
        }
    };

    const handleAIEvaluation = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập!");
            navigate('/login');
            return;
        }
        const token = localStorage.getItem('accessToken');
        setLoadingAI(true);
        const toastId = toast.loading("AI đang phân tích độ phù hợp...");
        try {
            const response = await axios.post(`${API_BASE_URL}/evaluation/${jobId}`, {}, {headers: {'Authorization': `Bearer ${token}`}});
            setAiResults(response.data.result || {});
            toast.dismiss(toastId);
            setShowAIModal(true);
        } catch (error) {
            toast.error("Hệ thống AI bận.");
        } finally {
            setLoadingAI(false);
        }
    };

    if (loading) return <div className="candidate-loader-container">
        <div className="loader-spinner"></div>
    </div>;

    return (<div className="candidate-job-detail-wrapper">
        <Toaster position="top-right" richColors/>

        <div className="container">
            <button className="btn-back-nav" onClick={() => navigate(-1)}><ChevronLeft size={20}/> Quay lại</button>

            {/* Job Info Header */}
            <div className="detail-card header-combined animate-in">
                <div className="header-main-content">
                    <div className="company-info-section">
                        <img src={job.companyImageUrl ? `http://localhost:8081/identity${job.companyImageUrl}` : ''}
                             alt="logo" className="company-logo-large"/>
                        <div className="job-title-info">
                            <h1>{job.position}</h1>
                            <p className="company-name-text"
                               onClick={() => navigate(`/companies/${job.companyId}`)}><Building2
                                size={18}/> {job.companyName}</p>
                            <div className="job-meta-tags">
                                <span><MapPin size={16}/> {job.location}</span>
                                <span className="salary-tag"><Banknote
                                    size={16}/> {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}</span>
                                <span><Clock size={16}/> {formatDistanceToNow(new Date(job.createdAt), {
                                    locale: vi, addSuffix: true
                                })}</span>
                            </div>
                        </div>
                    </div>
                    <div className="candidate-action-panel side-panel">
                        <button className="btn-apply-primary" onClick={handleApplyClick}><Send
                            size={18}/> ỨNG TUYỂN
                        </button>
                        <button className="btn-ai-sparkle" onClick={handleAIEvaluation} disabled={loadingAI}>
                            <Sparkles size={18}/> ĐÁNH GIÁ AI
                        </button>
                    </div>
                </div>
            </div>

            <div className="detail-card section"><h3>Mô tả công việc</h3><p
                style={{whiteSpace: 'pre-line'}}>{job.description}</p></div>

            <div className="detail-grid">
                {parsedData.slice(1).map((sec, i) => (<div key={i} className="detail-card section animate-in">
                    <h3>{sec.name}</h3>
                    <ul className="check-list">{sec.description?.map((li, j) => <li key={j}><span>{li}</span>
                    </li>)}</ul>
                </div>))}
            </div>
        </div>

        {/* --- MODAL APPLY CHÍNH --- */}
        {showApplyModal && (<div className="apply-modal-overlay">
            <div className="apply-modal-content animate-in">
                <div className="apply-modal-header">
                    <h2>Nộp hồ sơ ứng tuyển</h2>
                    <button className="close-x" onClick={() => setShowApplyModal(false)}><X/></button>
                </div>

                <div className="apply-method-tabs">
                    <button
                        className={`tab-item ${applyMethod === 'upload' ? 'active' : ''}`}
                        onClick={() => {
                            setApplyMethod('upload');
                            // RESET dữ liệu khi bấm tải mới để hiện nút chọn file
                            setCvData({
                                name: '',
                                description: '',
                                address: '',
                                categoryId: '',
                                category: '',
                                degrees: [],
                                skills: [],
                                experience: []
                            });
                            setCvFile(null);
                        }}
                    >
                        <Upload size={16}/> Tải CV mới
                    </button>
                    <button
                        className={`tab-item ${applyMethod === 'existing' ? 'active' : ''}`}
                        onClick={handleUseExistingCV}
                    >
                        <Database size={16}/> Dùng hồ sơ hệ thống
                    </button>
                </div>

                <form onSubmit={handleApplySubmit} className="apply-form-body">
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Số điện thoại liên hệ *</label>
                            <input type="text" value={formData.numberPhone}
                                   onChange={(e) => setFormData({...formData, numberPhone: e.target.value})}
                                   required/>
                        </div>

                        <div className="input-group">
                            <label>Trạng thái hồ sơ *</label>
                            {/* Nếu đang phân tích thì hiện loader */}
                            {isParsing ? (<div className="cv-status-box loading">
                                <div className="mini-loader"></div>
                                <span>AI đang trích xuất dữ liệu...</span>
                            </div>) : cvData.name ? (/* Nếu đã có dữ liệu (từ hệ thống hoặc đã upload xong) */
                                <div className="cv-status-box loaded">
                                    <FileText size={18}/>
                                    <div className="cv-info-mini">
                                        <span className="cv-name-display">{cvData.name}</span>
                                        <span className="cv-status-text">Đã sẵn sàng</span>
                                    </div>
                                    <button type="button" onClick={() => setShowConfirmModal(true)}
                                            className="btn-re-edit" title="Chỉnh sửa thông tin">
                                        <Edit3 size={14}/> Sửa
                                    </button>
                                    {/* Nút để đổi file khác nếu muốn */}
                                    {applyMethod === 'upload' && (
                                        <label htmlFor="cv-input" className="btn-change-file"> Đổi
                                            file</label>)}
                                </div>) : (/* Nếu chưa có dữ liệu và đang ở mode upload */
                                <label htmlFor="cv-input" className="btn-trigger-upload-full">
                                    <Upload size={20}/>
                                    <span>Nhấn để tải lên CV (PDF)</span>
                                </label>)}
                            <input type="file" id="cv-input" accept=".pdf" onChange={handleFileChange} hidden/>
                        </div>
                    </div>

                    <div className="input-group full-width" style={{width: "100%", marginTop: '15px'}}>
                        <label>Thư giới thiệu</label>
                        <textarea rows="3" placeholder="Lời nhắn gửi đến nhà tuyển dụng..."
                                  value={formData.recommendationLetter} onChange={(e) => setFormData({
                            ...formData, recommendationLetter: e.target.value
                        })}></textarea>
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn-submit-apply"
                                disabled={submitting || isParsing || !cvData.name}>
                            {submitting ? "ĐANG GỬI..." : "GỬI HỒ SƠ NGAY"}
                        </button>
                    </div>
                </form>
            </div>
        </div>)}

        {/* --- MODAL XÁC NHẬN THÔNG TIN (KIỂU CVPARSER) --- */}
        {showConfirmModal && (<div className="apply-modal-overlay confirm-parsed-overlay">
            <div className="ai-modal-content wide-modal animate-in liquid-glass scrollable-modal">
                <div className="ai-modal-header">
                    <div className="header-title">
                        <CheckCircle2 className="text-green-500" size={24}/>
                        <div>
                            <h2>Xác nhận hồ sơ</h2>
                            <p className="text-sm text-gray-500">Kiểm tra thông tin AI đã trích xuất từ CV của
                                bạn</p>
                        </div>
                    </div>
                    <button className="close-x" onClick={() => setShowConfirmModal(false)}><X/></button>
                </div>

                <div className="ai-modal-body">
                    {/* Thông tin chung */}
                    <div className="confirm-section">
                        <h3 className="confirm-section-title">Thông tin chung</h3>
                        <div className="confirm-flex-container">
                            <div className="confirm-flex-row">
                                <div className="input-group flex-1"><label>Họ tên</label><input
                                    value={cvData.name} onChange={e => updateField('name', e.target.value)}/>
                                </div>
                                <div className="input-group flex-1"><label>Địa chỉ</label><input
                                    value={cvData.address}
                                    onChange={e => updateField('address', e.target.value)}/></div>
                            </div>
                            <div className="confirm-flex-row full-width">
                                <div className="input-group full-width"><label>Mô tả bản thân</label><textarea
                                    rows={3} value={cvData.description}
                                    onChange={e => updateField('description', e.target.value)}/></div>
                            </div>
                        </div>
                    </div>

                    {/* Bằng cấp */}
                    <div className="confirm-section">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="confirm-section-title">Bằng cấp & Học vấn</h3>
                            <button className="btn-add-mini" onClick={() => addDegree('DEGREE')}><Plus
                                size={14}/> Thêm
                            </button>
                        </div>
                        {cvData.degrees.filter(d => d.type === 'DEGREE').map((item, idx) => (
                            <div key={idx} className="confirm-item-card">
                                <button className="remove-item-btn" onClick={() => setCvData(p => ({
                                    ...p, degrees: p.degrees.filter(d => d !== item)
                                }))}><Trash2 size={14}/></button>
                                <div className="confirm-flex-container">
                                    <div className="confirm-flex-row">
                                        <div className="input-group flex-1"><label>Trường</label><input
                                            value={item.institution}
                                            onChange={e => updateDegreeItem(item.id || item._id, 'institution', e.target.value)}/>
                                        </div>
                                        <div className="input-group flex-1"><label>Chuyên ngành</label><input
                                            value={item.major}
                                            onChange={e => updateDegreeItem(item.id || item._id, 'major', e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="confirm-flex-row">
                                        <div className="input-group flex-1"><label>Bằng cấp</label><input
                                            value={item.degree}
                                            onChange={e => updateDegreeItem(item.id || item._id, 'degree', e.target.value)}/>
                                        </div>
                                        <div className="input-group flex-1"><label>Năm tốt nghiệp</label><input
                                            type="number" value={item.graduationYear}
                                            onChange={e => updateDegreeItem(item.id || item._id, 'graduationYear', e.target.value)}/>
                                        </div>
                                    </div>
                                </div>
                            </div>))}
                    </div>

                    {/* Kinh nghiệm làm việc - ĐÚNG Ý ĐẠT ĐÂY */}
                    <div className="confirm-section">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="confirm-section-title">Kinh nghiệm làm việc</h3>
                            <button className="btn-add-mini" onClick={addExperience}><Plus size={14}/> Thêm
                            </button>
                        </div>
                        {cvData.experience.map((item, idx) => (<div key={idx} className="confirm-item-card">
                            <button className="remove-item-btn" onClick={() => setCvData(p => ({
                                ...p, experience: p.experience.filter(e => e !== item)
                            }))}><Trash2 size={14}/></button>
                            <div className="confirm-flex-container">
                                {/* Hàng 1: Ngày bắt đầu và Kết thúc chung 1 hàng */}
                                <div className="confirm-flex-row">
                                    <div className="input-group flex-1"><label>Bắt đầu</label><input
                                        type="date" value={item.startDate}
                                        onChange={e => updateExperience(item.id || item._id, 'startDate', e.target.value)}/>
                                    </div>
                                    <div className="input-group flex-1"><label>Kết thúc</label><input
                                        type="date" value={item.endDate || ''}
                                        onChange={e => updateExperience(item.id || item._id, 'endDate', e.target.value)}/>
                                    </div>
                                </div>
                                {/* Hàng 2: Chi tiết chiếm trọn hàng */}
                                <div className="confirm-flex-row full-width">
                                    <div className="input-group full-width"><label>Chi tiết công
                                        việc</label><textarea rows={2} value={item.description}
                                                              onChange={e => updateExperience(item.id || item._id, 'description', e.target.value)}/>
                                    </div>
                                </div>
                            </div>
                        </div>))}
                    </div>

                    {/* Kỹ năng (Giữ nguyên hoặc dùng flex-wrap) */}
                    {/* Kỹ năng */}
                    <div className="confirm-section">
                        <h3 className="confirm-section-title">Kỹ năng</h3>
                        <div className="confirm-skills-wrap">
                            {cvData.skills.map((s, idx) => (
                                <span key={idx} className="confirm-skill-tag">
                {s.skillName} ({s.experienceYears}n)
                <button type="button"
                        onClick={() => setCvData(p => ({...p, skills: p.skills.filter((_, i) => i !== idx)}))}>
                    <X size={12}/>
                </button>
            </span>
                            ))}
                        </div>

                        {/* HÀNG NHẬP MỚI CÓ NÚT THÊM */}
                        <div className="confirm-flex-row mt-3 skill-input-row" style={{alignItems: 'flex-end'}}>
                            <div className="input-group flex-1">
                                <label>Tên kỹ năng</label>
                                <input
                                    className="skill-input-mini"
                                    placeholder="Ví dụ: Java, Photoshop..."
                                    value={newSkillName}
                                    onChange={e => setNewSkillName(e.target.value)}
                                    onKeyDown={addSkill}
                                />
                            </div>
                            <div className="input-group" style={{width: '80px'}}>
                                <label>Số năm</label>
                                <input
                                    type="number"
                                    className="skill-year-mini"
                                    value={newSkillExp}
                                    onChange={e => setNewSkillExp(e.target.value)}
                                    min={1}
                                />
                            </div>
                            <button
                                type="button"
                                className="btn-add-skill-action"
                                onClick={handleAddSkill}
                            >
                                <Plus size={18}/> Thêm
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ai-modal-footer">
                    <button className="btn-confirm-save" onClick={() => setShowConfirmModal(false)}>
                        <Save size={18}/> LƯU & QUAY LẠI ỨNG TUYỂN
                    </button>
                </div>
            </div>
        </div>)}

        {showAIModal && (
            <div className="apply-modal-overlay">
                <div className="ai-modal-content animate-in">
                    <div className="ai-modal-header">
                        <h2>Đánh giá AI</h2>
                        <button className="close-x" onClick={() => setShowAIModal(false)}>
                            <X/>
                        </button>
                    </div>

                    <div className="ai-modal-body">
                        <h3 style={{ marginBottom: '15px' }}>Điểm phù hợp: {aiResults.matchScore}</h3>

                        <div className="ai-section">
                            <h4>Điểm mạnh</h4>
                            <p style={{ lineHeight: '1.6' }}>
                                {/* Xử lý xuống dòng cho điểm mạnh (nếu có) */}
                                {aiResults.strengths?.split(/\\n|\n/).map((line, idx) => (
                                    <React.Fragment key={idx}>
                                        {line}
                                        <br />
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>

                        <div className="ai-section">
                            <h4>Điểm yếu</h4>
                            <p style={{ lineHeight: '1.6' }}>
                                {/* Tách chuỗi theo \n hoặc \\n và render kèm thẻ <br /> */}
                                {aiResults.weaknesses?.split(/\\n|\n/).map((line, idx) => (
                                    <React.Fragment key={idx}>
                                        {line}
                                        <br />
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>

                        <div className="ai-section">
                            <h4>Lộ trình cải thiện</h4>
                            {aiResults.roadmap?.map((item, index) => (
                                <div key={index} className="roadmap-item">
                                    <h5>
                                        {item.title} ({item.priority})
                                    </h5>
                                    <p>{item.description}</p>
                                    <small>⏱ {item.duration}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>);
};

export default JobDetailPage;