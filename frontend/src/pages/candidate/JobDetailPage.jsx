import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jobService from '../../services/api/jobService';
import candidateService from '../../services/api/candidateService';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    MapPin, Banknote, Tag, Clock, ChevronLeft, Building2,
    Send, Sparkles, AlertCircle, X, FileText, CheckCircle2,
    Upload, Database, Edit3, Plus, Trash2, Save
} from 'lucide-react';
import './JobDetail.css';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = "http://localhost:8081/identity";

const formatSalary = (amount) => {
    if (!amount && amount !== 0) return "Thỏa thuận";
    return new Intl.NumberFormat('vi-VN').format(amount) + " VND";
};

const JobDetailPage = () => {
    const { user } = useAuth();
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Context phân biệt Modal Xác nhận đang dùng cho Ứng tuyển hay Đánh giá
    const [confirmContext, setConfirmContext] = useState('apply'); // 'apply' | 'eval'

    // Apply States
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cvFile, setCvFile] = useState(null);
    const [applyMethod, setApplyMethod] = useState('upload');
    const [isParsing, setIsParsing] = useState(false);

    // Form States
    const [cvData, setCvData] = useState({
        name: '', description: '', address: '', categoryId: '', category: '', degrees: [], skills: [], experience: []
    });

    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillExp, setNewSkillExp] = useState(1);

    const [formData, setFormData] = useState({
        name: '', email: '', numberPhone: '', recommendationLetter: ''
    });

    // AI Evaluation States
    const [showAIModal, setShowAIModal] = useState(false);
    const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
    const [aiResults, setAiResults] = useState({});
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

                const sections = Object.entries(rawTitle || {})
                    .map(([key, value]) => {
                        const name = String(key || '').trim();
                        if (!name) return null;

                        const description = Array.isArray(value)
                            ? value.map(item => String(item || '').trim()).filter(Boolean)
                            : typeof value === 'string'
                                ? value.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
                                : [];

                        return { name, description };
                    })
                    .filter(Boolean);

                setParsedData(sections);
            } else {
                setParsedData([]);
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


    /* ================= START: APPLY LOGIC ================= */
    const handleApplyClick = () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thực hiện ứng tuyển!");
            navigate('/login');
            return;
        }
        setShowApplyModal(true);
    };

    const handleUseExistingCV = async () => {
        setApplyMethod('existing');
        setConfirmContext('apply');
        const toastId = toast.loading("Đang nạp hồ sơ và tải file CV từ hệ thống...");

        try {
            const token = localStorage.getItem('accessToken');
            const response = await candidateService.getCv();

            if (response && response.result) {
                const res = response.result;
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

                if (res.cvUrl) {
                    const fullCvUrl = `http://localhost:8081/identity${res.cvUrl}`;
                    try {
                        const fileResponse = await axios.get(fullCvUrl, {
                            headers: { 'Authorization': `Bearer ${token}` }, responseType: 'blob'
                        });
                        const fileName = res.cvUrl.split('/').pop();
                        setCvFile(new File([fileResponse.data], fileName, { type: 'application/pdf' }));
                    } catch (fileErr) {
                        toast.error("Hệ thống tìm thấy hồ sơ nhưng không tải được file CV gốc.");
                    }
                }
                setShowConfirmModal(true);
                toast.success("Đã nạp hồ sơ thành công!", { id: toastId });
            }
        } catch (error) {
            toast.error("Bạn chưa có hồ sơ trên hệ thống. Vui lòng tải CV mới.", { id: toastId });
            setApplyMethod('upload');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return toast.error("Vui lòng chọn file PDF");

        setCvFile(file);
        setApplyMethod('upload');
        setConfirmContext('apply');
        setIsParsing(true);
        const toastId = toast.loading("AI đang phân tích CV...");

        try {
            const response = await candidateService.parseCv(file);
            if (response && response.result) {
                const res = response.result;
                setCvData({
                    name: res.name || '', description: res.description || '', address: res.address || '',
                    categoryId: res.categoryId || '', category: res.category || '',
                    skills: res.skills?.map(s => ({ skillId: s.skillId || null, skillName: s.skillName || s.name, experienceYears: s.experienceYears || 1 })) || [],
                    degrees: res.degrees || [], experience: res.experience || []
                });
                setShowConfirmModal(true);
                toast.success("AI đã phân tích xong!", { id: toastId });
            }
        } catch (error) {
            toast.error("AI lỗi phân tích, hãy nhập thủ công.", { id: toastId });
            setShowConfirmModal(true);
        } finally {
            setIsParsing(false);
        }
    };

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!cvFile) return toast.error("Vui lòng đảm bảo đã tải lên hoặc chọn hồ sơ hệ thống!");

        setSubmitting(true);
        const toastId = toast.loading("Đang gửi hồ sơ ứng tuyển...");
        const data = new FormData();

        const jsonRequest = {
            name: formData.name, email: formData.email, numberPhone: formData.numberPhone,
            recommendationLetter: formData.recommendationLetter,
            parsedContent: { ...cvData, skills: cvData.skills.map(s => s.skillName) }
        };

        data.append('request', new Blob([JSON.stringify(jsonRequest)], { type: 'application/json' }));
        data.append('cv', cvFile);

        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_BASE_URL}/jobs/${jobId}/apply`, data, {
                headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
            });
            toast.success("Ứng tuyển thành công!", { id: toastId });
            setShowApplyModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi gửi hồ sơ.", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };
    /* ================= END: APPLY LOGIC ================= */


    /* ================= START: AI EVALUATION LOGIC ================= */
    const handleAIEvaluation = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập!");
            navigate('/login');
            return;
        }
        const token = localStorage.getItem('accessToken');
        setLoadingAI(true);
        const toastId = toast.loading("Đang kiểm tra dữ liệu đánh giá...");

        try {
            // Bước 1: GET kết quả đánh giá cũ
            const response = await axios.get(`${API_BASE_URL}/evaluation/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data && response.data.result) {
                setAiResults(response.data.result);
                toast.dismiss(toastId);
                setShowAIModal(true);
            } else {
                throw new Error("No data"); // Bắn vào catch để gọi Modal Nguồn CV
            }
        } catch (error) {
            toast.dismiss(toastId);
            toast.info("Chưa có bản đánh giá nào. Vui lòng chọn nguồn CV để đánh giá.");
            setShowAIOptionsModal(true); // Mở Modal chọn Option
        } finally {
            setLoadingAI(false);
        }
    };

    // Option 1: Đánh giá bằng CV có sẵn
    const handleAIEvalSystemCV = async () => {
        setShowAIOptionsModal(false);
        setConfirmContext('eval'); // Đánh dấu đây là flow Evaluation
        const toastId = toast.loading("Đang tải dữ liệu từ hệ thống...");

        try {
            const response = await candidateService.getCv();
            if (response && response.result) {
                const res = response.result;
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
                toast.success("Nạp dữ liệu thành công!", { id: toastId });
                setShowConfirmModal(true); // Hiển thị form cho user sửa
            }
        } catch (e) {
            toast.error("Bạn chưa có hồ sơ hệ thống. Hãy tải lên CV mới.", { id: toastId });
        }
    };

    // Option 2: Đánh giá bằng CV tải mới
    const handleAIEvalUploadCV = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return toast.error("Vui lòng chọn file PDF");

        setShowAIOptionsModal(false);
        setConfirmContext('eval'); // Đánh dấu đây là flow Evaluation
        const toastId = toast.loading("AI đang phân tích dữ liệu CV mới...");

        try {
            const response = await candidateService.parseCv(file);
            if (response && response.result) {
                const res = response.result;
                setCvData({
                    name: res.name || '', description: res.description || '', address: res.address || '',
                    categoryId: res.categoryId || '', category: res.categoryName || res.category || '',
                    skills: res.skills?.map(s => ({ skillId: s.skillId || null, skillName: s.skillName || s.name, experienceYears: s.experienceYears || 1 })) || [],
                    degrees: res.degrees || [], experience: res.experience || []
                });
                toast.success("AI đã trích xuất xong!", { id: toastId });
                setShowConfirmModal(true); // Hiển thị form cho user sửa
            }
        } catch (err) {
            toast.error("Lỗi phân tích CV.", { id: toastId });
        }
    };

    // Submit Request để tiến hành Đánh giá
    const submitAIEvaluation = async () => {
        const token = localStorage.getItem('accessToken');
        const toastId = toast.loading("AI đang đánh giá độ phù hợp... Quá trình này có thể mất chút thời gian.");

        // Build Payload dựa trên CVJobEvaluationRequest
        const payload = {
            name: cvData.name,
            skills: cvData.skills.map(s => s.skillName), // BE nhận mảng String cho skills
            address: cvData.address,
            category: cvData.category,
            description: cvData.description,
            degrees: cvData.degrees.map(d => ({
                type: d.type || "DEGREE",
                major: d.major || "",
                degree: d.degree || "",
                institution: d.institution || "",
                graduationYear: d.graduationYear || "",
                name: d.name || "",
                year: d.year || ""
            })),
            experience: cvData.experience.map(e => ({
                startDate: e.startDate || "",
                endDate: e.endDate || "",
                description: e.description || ""
            }))
        };

        try {
            const response = await axios.post(`${API_BASE_URL}/evaluation/${jobId}`, payload, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            if (response.data && response.data.result) {
                setAiResults(response.data.result);
                setShowConfirmModal(false); // Đóng form confirm
                toast.success("Đánh giá hoàn tất!", { id: toastId });
                setShowAIModal(true); // Mở Modal Show kết quả
            }
        } catch (error) {
            const errorCode = error.response?.data?.code;
            if (errorCode === 'AI_SERVICE_BUSY') {
                toast.error("AI của SkillBridge đang hơi quá tải một chút. Đạt đợi khoảng 30s rồi thử lại nhé! ☕", {
                    id: toastId,
                    duration: 5000
                });
            } else {
                toast.error("Có lỗi xảy ra, vui lòng kiểm tra lại kết nối.", { id: toastId });
            }
        }
    };
    /* ================= END: AI EVALUATION LOGIC ================= */


    // --- FORM HANDLERS (Chung cho Confirm Modal) ---
    const updateField = (field, value) => setCvData(prev => ({ ...prev, [field]: value }));

    const addDegree = (type) => setCvData(prev => ({
        ...prev, degrees: [...prev.degrees, type === 'DEGREE'
            ? { id: Date.now(), type, degree: '', major: '', institution: '', graduationYear: '' }
            : { id: Date.now(), type, name: '', year: '' }]
    }));

    const updateDegreeItem = (id, field, value) => setCvData(prev => ({
        ...prev, degrees: prev.degrees.map(d => (d.id === id || d._id === id) ? { ...d, [field]: value } : d)
    }));

    const addExperience = () => setCvData(prev => ({
        ...prev, experience: [...prev.experience, { id: Date.now(), startDate: '', endDate: '', description: '' }]
    }));

    const updateExperience = (id, field, value) => setCvData(prev => ({
        ...prev, experience: prev.experience.map(e => (e.id === id || e._id === id) ? { ...e, [field]: value } : e)
    }));

    const handleAddSkill = () => {
        const normalizedName = newSkillName.trim();
        if (normalizedName) {
            if (!cvData.skills.some(s => s.skillName.toLowerCase() === normalizedName.toLowerCase())) {
                setCvData(prev => ({ ...prev, skills: [...prev.skills, { skillName: normalizedName, experienceYears: parseInt(newSkillExp) || 1 }] }));
                setNewSkillName(''); setNewSkillExp(1);
                toast.success(`Đã thêm kỹ năng ${normalizedName}`);
            } else {
                toast.warning("Kỹ năng này đã tồn tại!");
            }
        }
    };

    const addSkill = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };


    if (loading) return <div className="candidate-loader-container"><div className="loader-spinner"></div></div>;

    const handleCreateNewEvaluation = () => {
        setShowAIModal(false);       // Đóng modal kết quả hiện tại
        setShowAIOptionsModal(true); // Mở modal yêu cầu chọn/tải CV
    };

    return (
        <div className="candidate-job-detail-wrapper">
            <div className="container">
                <button className="btn-back-nav" onClick={() => navigate(-1)}><ChevronLeft size={20} /> Quay lại</button>

                {/* Job Info Header */}
                <div className="detail-card header-combined animate-in">
                    <div className="header-main-content">
                        <div className="company-info-section">
                            <img src={job?.companyImageUrl ? `http://localhost:8081/identity${job.companyImageUrl}` : ''} alt="logo" className="company-logo-large" />
                            <div className="job-title-info">
                                <h1>{job?.position}</h1>
                                <p className="company-name-text" onClick={() => navigate(`/companies/${job.companyId}`)}><Building2 size={18} /> {job?.companyName}</p>
                                <div className="job-meta-tags">
                                    <span><MapPin size={16} /> {job?.location}</span>
                                    <span className="salary-tag"><Banknote size={16} /> {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}</span>
                                    <span><Clock size={16} /> {job?.createdAt && formatDistanceToNow(new Date(job.createdAt), { locale: vi, addSuffix: true })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="candidate-action-panel side-panel">
                            <button className="btn-apply-primary" onClick={handleApplyClick}><Send size={18} /> ỨNG TUYỂN</button>
                            <button className="btn-ai-sparkle" onClick={handleAIEvaluation} disabled={loadingAI}>
                                <Sparkles size={18} /> ĐÁNH GIÁ AI
                            </button>
                        </div>
                    </div>
                </div>

                <div className="detail-card section"><h3>Mô tả công việc</h3><p style={{ whiteSpace: 'pre-line' }}>{job.description}</p></div>

                <div className="detail-grid">
                    {parsedData?.map((sec, i) => (<div key={i} className="detail-card section animate-in">
                        <h3>{sec.name}</h3>
                        <ul className="check-list">{sec.description?.map((li, j) => <li key={j}><span>{li}</span></li>)}</ul>
                    </div>))}
                </div>
            </div>

            {/* --- MODAL CHỌN OPTION ĐÁNH GIÁ AI MỚI --- */}
            {showAIOptionsModal && (
                <div className="apply-modal-overlay">
                    <div className="apply-modal-content animate-in" style={{ maxWidth: '450px' }}>
                        <div className="apply-modal-header border-b pb-3 mb-4">
                            <h2>Nguồn Dữ Liệu Đánh Giá</h2>
                            <button className="close-x" onClick={() => setShowAIOptionsModal(false)}><X /></button>
                        </div>
                        <p className="text-gray-600 mb-5 text-center">
                            Để AI có thể phân tích mức độ phù hợp, vui lòng cung cấp thông tin hồ sơ của bạn.
                        </p>
                        <div className="apply-method-tabs" style={{ flexDirection: 'column', gap: '12px' }}>
                            <button className="tab-item w-full py-3 justify-center text-md font-medium" onClick={handleAIEvalSystemCV}>
                                <Database size={20} /> Sử dụng CV từ hệ thống
                            </button>
                            <label className="tab-item w-full py-3 justify-center text-md font-medium cursor-pointer" style={{ margin: 0 }}>
                                <Upload size={20} /> Tải CV mới lên (PDF)
                                <input type="file" accept=".pdf" hidden onChange={handleAIEvalUploadCV} />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL APPLY CHÍNH --- */}
            {showApplyModal && (<div className="apply-modal-overlay">
                <div className="apply-modal-content animate-in">
                    <div className="apply-modal-header">
                        <h2>Nộp hồ sơ ứng tuyển</h2>
                        <button className="close-x" onClick={() => setShowApplyModal(false)}><X /></button>
                    </div>

                    <div className="apply-method-tabs">
                        <button className={`tab-item ${applyMethod === 'upload' ? 'active' : ''}`}
                            onClick={() => {
                                setApplyMethod('upload');
                                setCvData({ name: '', description: '', address: '', categoryId: '', category: '', degrees: [], skills: [], experience: [] });
                                setCvFile(null);
                            }}>
                            <Upload size={16} /> Tải CV mới
                        </button>
                        <button className={`tab-item ${applyMethod === 'existing' ? 'active' : ''}`} onClick={handleUseExistingCV}>
                            <Database size={16} /> Dùng hồ sơ hệ thống
                        </button>
                    </div>

                    <form onSubmit={handleApplySubmit} className="apply-form-body">
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Số điện thoại liên hệ *</label>
                                <input type="text" value={formData.numberPhone} onChange={(e) => setFormData({ ...formData, numberPhone: e.target.value })} required />
                            </div>

                            <div className="input-group">
                                <label>Trạng thái hồ sơ *</label>
                                {isParsing ? (<div className="cv-status-box loading"><div className="mini-loader"></div><span>AI đang trích xuất dữ liệu...</span></div>) :
                                    cvData.name ? (
                                        <div className="cv-status-box loaded">
                                            <FileText size={18} />
                                            <div className="cv-info-mini">
                                                <span className="cv-name-display">{cvData.name}</span>
                                                <span className="cv-status-text">Đã sẵn sàng</span>
                                            </div>
                                            <button type="button" onClick={() => setShowConfirmModal(true)} className="btn-re-edit" title="Chỉnh sửa thông tin">
                                                <Edit3 size={14} /> Sửa
                                            </button>
                                            {applyMethod === 'upload' && (<label htmlFor="cv-input" className="btn-change-file"> Đổi file</label>)}
                                        </div>) : (
                                        <label htmlFor="cv-input" className="btn-trigger-upload-full">
                                            <Upload size={20} /><span>Nhấn để tải lên CV (PDF)</span>
                                        </label>)}
                                <input type="file" id="cv-input" accept=".pdf" onChange={handleFileChange} hidden />
                            </div>
                        </div>

                        <div className="input-group full-width" style={{ width: "100%", marginTop: '15px' }}>
                            <label>Thư giới thiệu</label>
                            <textarea rows="3" placeholder="Lời nhắn gửi đến nhà tuyển dụng..." value={formData.recommendationLetter} onChange={(e) => setFormData({ ...formData, recommendationLetter: e.target.value })}></textarea>
                        </div>

                        <div className="modal-actions">
                            <button type="submit" className="btn-submit-apply" disabled={submitting || isParsing || !cvData.name}>
                                {submitting ? "ĐANG GỬI..." : "GỬI HỒ SƠ NGAY"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>)}

            {/* --- MODAL XÁC NHẬN THÔNG TIN --- */}
            {showConfirmModal && (<div className="apply-modal-overlay confirm-parsed-overlay">
                <div className="ai-modal-content wide-modal animate-in liquid-glass scrollable-modal">
                    <div className="ai-modal-header">
                        <div className="header-title">
                            <CheckCircle2 className="text-green-500" size={24} />
                            <div>
                                <h2>Xác nhận hồ sơ</h2>
                                <p className="text-sm text-gray-500">
                                    {confirmContext === 'apply' ? "Kiểm tra thông tin trước khi gửi" : "Kiểm tra thông tin trước khi AI đánh giá"}
                                </p>
                            </div>
                        </div>
                        <button className="close-x" onClick={() => setShowConfirmModal(false)}><X /></button>
                    </div>

                    <div className="ai-modal-body">
                        {/* Thông tin chung */}
                        <div className="confirm-section">
                            <h3 className="confirm-section-title">Thông tin chung</h3>
                            <div className="confirm-flex-container">
                                <div className="confirm-flex-row">
                                    <div className="input-group flex-1"><label>Họ tên</label><input value={cvData.name} onChange={e => updateField('name', e.target.value)} /></div>
                                    <div className="input-group flex-1"><label>Địa chỉ</label><input value={cvData.address} onChange={e => updateField('address', e.target.value)} /></div>
                                </div>
                                <div className="confirm-flex-row full-width">
                                    <div className="input-group full-width"><label>Mô tả bản thân</label><textarea rows={3} value={cvData.description} onChange={e => updateField('description', e.target.value)} /></div>
                                </div>
                            </div>
                        </div>

                        {/* Bằng cấp */}
                        <div className="confirm-section">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="confirm-section-title">Bằng cấp & Học vấn</h3>
                                <button className="btn-add-mini" onClick={() => addDegree('DEGREE')}><Plus size={14} /> Thêm</button>
                            </div>
                            {cvData.degrees.filter(d => d.type === 'DEGREE').map((item, idx) => (
                                <div key={idx} className="confirm-item-card">
                                    <button className="remove-item-btn" onClick={() => setCvData(p => ({ ...p, degrees: p.degrees.filter(d => d !== item) }))}><Trash2 size={14} /></button>
                                    <div className="confirm-flex-container">
                                        <div className="confirm-flex-row">
                                            <div className="input-group flex-1"><label>Trường</label><input value={item.institution} onChange={e => updateDegreeItem(item.id || item._id, 'institution', e.target.value)} /></div>
                                            <div className="input-group flex-1"><label>Chuyên ngành</label><input value={item.major} onChange={e => updateDegreeItem(item.id || item._id, 'major', e.target.value)} /></div>
                                        </div>
                                        <div className="confirm-flex-row">
                                            <div className="input-group flex-1"><label>Bằng cấp</label><input value={item.degree} onChange={e => updateDegreeItem(item.id || item._id, 'degree', e.target.value)} /></div>
                                            <div className="input-group flex-1"><label>Năm tốt nghiệp</label><input type="number" value={item.graduationYear} onChange={e => updateDegreeItem(item.id || item._id, 'graduationYear', e.target.value)} /></div>
                                        </div>
                                    </div>
                                </div>))}
                        </div>

                        {/* Kinh nghiệm làm việc */}
                        <div className="confirm-section">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="confirm-section-title">Kinh nghiệm làm việc</h3>
                                <button className="btn-add-mini" onClick={addExperience}><Plus size={14} /> Thêm</button>
                            </div>
                            {cvData.experience.map((item, idx) => (<div key={idx} className="confirm-item-card">
                                <button className="remove-item-btn" onClick={() => setCvData(p => ({ ...p, experience: p.experience.filter(e => e !== item) }))}><Trash2 size={14} /></button>
                                <div className="confirm-flex-container">
                                    <div className="confirm-flex-row">
                                        <div className="input-group flex-1"><label>Bắt đầu</label><input type="date" value={item.startDate} onChange={e => updateExperience(item.id || item._id, 'startDate', e.target.value)} /></div>
                                        <div className="input-group flex-1"><label>Kết thúc</label><input type="date" value={item.endDate || ''} onChange={e => updateExperience(item.id || item._id, 'endDate', e.target.value)} /></div>
                                    </div>
                                    <div className="confirm-flex-row full-width">
                                        <div className="input-group full-width"><label>Chi tiết công việc</label><textarea rows={2} value={item.description} onChange={e => updateExperience(item.id || item._id, 'description', e.target.value)} /></div>
                                    </div>
                                </div>
                            </div>))}
                        </div>

                        {/* Kỹ năng */}
                        <div className="confirm-section">
                            <h3 className="confirm-section-title">Kỹ năng</h3>
                            <div className="confirm-skills-wrap">
                                {cvData.skills.map((s, idx) => (
                                    <span key={idx} className="confirm-skill-tag">
                                        {s.skillName} ({s.experienceYears}n)
                                        <button type="button" onClick={() => setCvData(p => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }))}><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="confirm-flex-row mt-3 skill-input-row" style={{ alignItems: 'flex-end' }}>
                                <div className="input-group flex-1">
                                    <label>Tên kỹ năng</label>
                                    <input className="skill-input-mini" placeholder="Ví dụ: Java, Photoshop..." value={newSkillName} onChange={e => setNewSkillName(e.target.value)} onKeyDown={addSkill} />
                                </div>
                                <div className="input-group" style={{ width: '80px' }}>
                                    <label>Số năm</label>
                                    <input type="number" className="skill-year-mini" value={newSkillExp} onChange={e => setNewSkillExp(e.target.value)} min={1} />
                                </div>
                                <button type="button" className="btn-add-skill-action" onClick={handleAddSkill}><Plus size={18} /> Thêm</button>
                            </div>
                        </div>
                    </div>

                    <div className="ai-modal-footer">
                        {/* Render nút Đóng tuỳ Context */}
                        {confirmContext === 'apply' ? (
                            <button className="btn-confirm-save" onClick={() => setShowConfirmModal(false)}>
                                <Save size={18} /> LƯU & QUAY LẠI ỨNG TUYỂN
                            </button>
                        ) : (
                            <button className="btn-confirm-save" onClick={submitAIEvaluation} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none' }}>
                                <Sparkles size={18} /> TIẾN HÀNH ĐÁNH GIÁ AI
                            </button>
                        )}
                    </div>
                </div>
            </div>)}

            {/* --- MODAL KẾT QUẢ ĐÁNH GIÁ AI --- */}
            {showAIModal && (
                <div className="apply-modal-overlay">
                    <div className="ai-modal-content animate-in liquid-glass scrollable-modal">
                        <div className="ai-modal-header">
                            <h2>Kết quả Đánh giá AI</h2>
                            <button className="close-x" onClick={() => setShowAIModal(false)}><X /></button>
                        </div>

                        <div className="ai-modal-body">
                            <div style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#4f46e5',
                                padding: '15px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <Sparkles size={24} />
                                Điểm phù hợp: {aiResults.matchScore} / 10
                            </div>

                            <div className="ai-section">
                                <h4>Điểm mạnh</h4>
                                <p style={{ lineHeight: '1.6' }}>
                                    {aiResults.strengths?.split(/\\n|\n/).map((line, idx) => (
                                        <React.Fragment key={idx}>{line}<br /></React.Fragment>
                                    ))}
                                </p>
                            </div>

                            <div className="ai-section">
                                <h4>Điểm yếu</h4>
                                <p style={{ lineHeight: '1.6' }}>
                                    {aiResults.weaknesses?.split(/\\n|\n/).map((line, idx) => (
                                        <React.Fragment key={idx}>{line}<br /></React.Fragment>
                                    ))}
                                </p>
                            </div>

                            <div className="ai-section">
                                <h4>Lộ trình cải thiện (Roadmap)</h4>
                                {aiResults.roadmap?.map((item, index) => (
                                    <div key={index} className="roadmap-item" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #6366f1' }}>
                                        <h5 style={{ color: '#1e293b', marginBottom: '5px', fontSize: '15px' }}>
                                            {item.title} <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>{item.priority}</span>
                                        </h5>
                                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>{item.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                                            <span><Clock size={12} className="inline mr-1" /> {item.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* --- THÊM PHẦN FOOTER TẠI ĐÂY --- */}
                        <div className="ai-modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>Bạn đã có kỹ năng mới hoặc muốn thử với CV khác?</span>
                            <button
                                onClick={handleCreateNewEvaluation}
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Upload size={16} /> ĐÁNH GIÁ LẠI
                            </button>
                        </div>
                        {/* ------------------------------- */}

                    </div>
                </div>
            )}
        </div>);
};

export default JobDetailPage;