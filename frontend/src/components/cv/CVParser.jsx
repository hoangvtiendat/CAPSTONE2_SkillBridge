import React, { useState, useEffect } from 'react';
import { FileText, Wand2, Upload, Plus, X, ArrowRight, Save, Trash2 } from 'lucide-react';
import candidateService from '../../services/api/candidateService';
import { toast } from 'sonner';
import './CVParser.css';

export const CVParser = () => {
    // State for AI Parser
    const [parsingState, setParsingState] = useState('idle'); // idle | uploading | scanning | done
    const [scanProgress, setScanProgress] = useState(0);
    const [parsedData, setParsedData] = useState(null);

    // State for Selection (tracking which AI items are selected)
    const [selectedItems, setSelectedItems] = useState({
        personalInfo: true,
        experience: {}, // { index: true/false }
        degrees: {},  // { index: true/false }
        certificates: {}, // { index: true/false }
        skills: true
    });

    // State for CV Form (Right Column)
    const [cvData, setCvData] = useState({
        name: '',
        description: '',
        address: '',
        categoryId: '', // Hidden ID
        category: '', // Visible Name
        degrees: [],
        skills: [], // { skillId, skillName, experienceYears }
        experience: [] // { startDate, endDate, description }
    });

    // Temp state for new skill
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillExp, setNewSkillExp] = useState(1);

    /* ================= APIs ================= */
    useEffect(() => {
        const fetchCvData = async () => {
            try {
                const response = await candidateService.getCv();
                if (response && response.result) {
                    const res = response.result;
                    setCvData(prev => ({
                        ...prev,
                        ...res,
                        categoryId: res.categoryId || '',
                        category: res.category || '',
                        skills: Array.isArray(res.skills) ? res.skills.map(s => ({
                            skillId: s.skillId || null,
                            skillName: s.skillName || s.name || s.skillId || 'Unknown Skill', // Fallback to ID if name missing
                            experienceYears: s.experienceYears || 1
                        })) : [],
                        degrees: res.degrees || [],
                        experience: res.experience || []
                    }));
                }
            } catch (error) {
                console.log("No existing CV data or failed to fetch.");
            }
        };
        fetchCvData();
    }, []);

    /* ================= SCANNING LOGIC ================= */
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setParsingState('scanning');
        setScanProgress(30);

        try {
            const response = await candidateService.parseCv(file);
            setScanProgress(100);

            setTimeout(() => {
                setParsingState('done');
                if (response && response.result) {
                    const result = response.result;
                    setParsedData(result);

                    // Initialize selected items
                    setSelectedItems({
                        personalInfo: true,
                        experience: result.experience ? result.experience.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {}) : {},
                        degrees: result.degrees ? result.degrees.filter(d => d.type === 'DEGREE').reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {}) : {},
                        certificates: result.degrees ? result.degrees.filter(d => d.type === 'CERTIFICATE').reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {}) : {},
                        skills: true
                    });
                }
            }, 500);

        } catch (error) {
            console.error("CV Parsing Failed:", error);
            toast.error("Phân tích CV thất bại. Vui lòng thử lại.");
            setParsingState('idle');
        }
    };

    /* ================= DATA TRANSFER LOGIC ================= */
    const applySelectedData = () => {
        if (!parsedData) return;

        setCvData(prev => {
            const newData = { ...prev };

            // Apply Personal Info
            if (selectedItems.personalInfo) {
                if (parsedData.name) newData.name = parsedData.name;
                if (parsedData.description) newData.description = parsedData.description;
                if (parsedData.address) newData.address = parsedData.address;
                if (parsedData.categoryId) newData.categoryId = parsedData.categoryId;
                if (parsedData.category) newData.category = parsedData.category;
            }

            // Apply Experience
            if (parsedData.experience) {
                const selectedExp = parsedData.experience.filter((_, idx) => selectedItems.experience[idx]);
                const formattedExp = selectedExp.map(item => ({
                    startDate: item.startDate,
                    endDate: item.endDate,
                    description: item.description,
                    id: Date.now() + Math.random() // Temp ID for UI key
                }));
                newData.experience = [...prev.experience, ...formattedExp];
            }

            // Apply Degrees & Certificates
            if (parsedData.degrees) {
                const degreesToAdd = [];

                // Handle DEGREES
                const parsedDegrees = parsedData.degrees.filter(d => d.type === 'DEGREE');
                parsedDegrees.forEach((deg, idx) => {
                    if (selectedItems.degrees[idx]) {
                        degreesToAdd.push({ ...deg, id: Date.now() + Math.random() });
                    }
                });

                // Handle CERTIFICATES
                const parsedCerts = parsedData.degrees.filter(d => d.type === 'CERTIFICATE');
                parsedCerts.forEach((cert, idx) => {
                    if (selectedItems.certificates[idx]) {
                        degreesToAdd.push({ ...cert, id: Date.now() + Math.random() });
                    }
                });

                newData.degrees = [...prev.degrees, ...degreesToAdd];
            }

            // Apply Skills
            if (selectedItems.skills && parsedData.skills) {
                const newSkills = parsedData.skills.map(s => {
                    const isObj = typeof s === 'object';
                    const id = isObj ? s.skillId : null;
                    // If name is NOT present, but ID is, use ID as name fallback so user sees SOMETHING
                    const name = isObj ? (s.skillName || s.name || s.skillId) : s;
                    const exp = isObj && s.experienceYears ? s.experienceYears : 1;

                    return {
                        skillName: name,
                        skillId: id,
                        experienceYears: exp
                    };
                });

                const existingNames = new Set(prev.skills.map(s => s.skillName?.toLowerCase()));
                const uniqueNewSkills = newSkills.filter(s => !existingNames.has(s.skillName?.toLowerCase()));

                newData.skills = [...prev.skills, ...uniqueNewSkills];
            }

            return newData;
        });
    };

    /* ================= FORM HANDLERS ================= */
    const updateField = (field, value) => {
        setCvData(prev => ({ ...prev, [field]: value }));
    };

    const addExperience = () => {
        setCvData(prev => ({
            ...prev,
            experience: [...prev.experience, { id: Date.now(), startDate: '', endDate: '', description: '' }]
        }));
    };
    const updateExperience = (id, field, value) => {
        setCvData(prev => ({
            ...prev,
            experience: prev.experience.map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };
    const removeExperience = (id) => {
        setCvData(prev => ({ ...prev, experience: prev.experience.filter(item => item.id !== id) }));
    };

    const addDegree = (type) => {
        const newItem = type === 'DEGREE'
            ? { id: Date.now(), type, degree: '', major: '', institution: '', graduationYear: '' }
            : { id: Date.now(), type, name: '', year: '' };

        setCvData(prev => ({
            ...prev,
            degrees: [...prev.degrees, newItem]
        }));
    };
    const updateDegreeItem = (id, field, value) => {
        setCvData(prev => ({
            ...prev,
            degrees: prev.degrees.map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };
    const removeDegreeItem = (id) => {
        setCvData(prev => ({ ...prev, degrees: prev.degrees.filter(item => item.id !== id) }));
    };

    const addSkill = (e) => {
        if (e.key === 'Enter' && newSkillName.trim()) {
            e.preventDefault();
            const normalizedName = newSkillName.trim();
            if (!cvData.skills.some(s => s.skillName?.toLowerCase() === normalizedName.toLowerCase())) {
                setCvData(prev => ({
                    ...prev,
                    skills: [...prev.skills, { skillName: normalizedName, skillId: null, experienceYears: newSkillExp }]
                }));
            }
            setNewSkillName('');
            setNewSkillExp(1);
        }
    };
    const removeSkill = (index) => {
        setCvData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    // Save
    const handleSave = async () => {
        try {
            // STRICT PAYLOAD CONSTRUCTION
            const payload = {
                name: cvData.name,
                description: cvData.description,
                address: cvData.address,
                categoryId: cvData.categoryId || null, // FIX: Send null if empty
                degrees: cvData.degrees.map(d => {
                    // Type-cast years to numbers
                    const yearVal = d.type === 'DEGREE' ? parseInt(d.graduationYear) : parseInt(d.year);

                    if (d.type === 'DEGREE') {
                        return {
                            type: 'DEGREE',
                            degree: d.degree,
                            major: d.major,
                            institution: d.institution,
                            graduationYear: isNaN(yearVal) ? 0 : yearVal
                        };
                    } else {
                        return {
                            type: 'CERTIFICATE',
                            name: d.name,
                            year: isNaN(yearVal) ? 0 : yearVal
                        };
                    }
                }),
                experience: cvData.experience.map(e => ({
                    startDate: e.startDate,
                    endDate: e.endDate,
                    description: e.description
                })),
                skills: cvData.skills.map(s => ({
                    skillId: s.skillId || null,
                    experienceYears: parseInt(s.experienceYears) || 1
                })).filter(s => s.skillId) // Filter out skills without IDs as per strict backend requirement
            };

            if (!payload.categoryId) {
                toast.error("Thiếu Category ID (Chưa có ID danh mục từ hệ thống)");
                // return; // Let it try?
            }

            console.log("Saving Payload:", payload);
            await candidateService.updateCv(payload);
            toast.success("Đã lưu hồ sơ thành công!");
        } catch (error) {
            console.error("Save CV failed:", error);
            const msg = error.response?.data?.message || "Lỗi hệ thống";
            toast.error(`Lưu thất bại: ${msg}`);
        }
    };

    return (
        <div className="cv-page">
            <div className="cv-layout">
                {/* LEFT - AI PARSER */}
                <div className="cv-left">
                    <h2><Wand2 className="text-blue-500" /> AI CV Parser</h2>

                    {parsingState === 'idle' && (
                        <label className="upload-box">
                            <input type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFileUpload} />
                            <Upload size={48} className="text-blue-500 mb-3 mx-auto" />
                            <h3>Tải lên CV (PDF)</h3>
                            <p>Hệ thống sẽ tự động quét thông tin</p>
                        </label>
                    )}

                    {parsingState === 'scanning' && (
                        <div className="scan-box">
                            <div className="scan-line"></div>
                            <div className="scan-content">
                                <FileText size={64} className="pdf-icon" />
                                <h3>Đang phân tích...</h3>
                                <div className="processing-text">{scanProgress}%</div>
                            </div>
                        </div>
                    )}

                    {parsingState === 'done' && parsedData && (
                        <div className="ai-results-container">
                            {/* Personal Info */}
                            <div className="ai-section">
                                <div className="ai-section-header">
                                    <span>Thông tin chung</span>
                                    <input type="checkbox" checked={selectedItems.personalInfo} onChange={(e) => setSelectedItems({ ...selectedItems, personalInfo: e.target.checked })} />
                                </div>
                                <div className="ai-item-row">
                                    <div className="ai-item-content">
                                        <strong>{parsedData.name}</strong>
                                        <p>{parsedData.address}</p>
                                        <p className="text-sm text-gray-500">{parsedData.description}</p>
                                        {/* Display ID if Name is missing, assuming parser returns ID for now based on user feedback */}
                                        {parsedData.categoryId && <p className="text-xs text-blue-600">Category ID: {parsedData.categoryId}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Degrees */}
                            <div className="ai-section">
                                <div className="ai-section-header">Bằng cấp</div>
                                {parsedData.degrees?.filter(d => d.type === 'DEGREE').map((d, idx) => (
                                    <label key={idx} className="ai-item-row">
                                        <input type="checkbox" checked={!!selectedItems.degrees[idx]}
                                            onChange={() => setSelectedItems(prev => ({ ...prev, degrees: { ...prev.degrees, [idx]: !prev.degrees[idx] } }))} />
                                        <div className="ai-item-content">
                                            <strong>{d.degree} - {d.major}</strong>
                                            <p>{d.institution} ({d.graduationYear})</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Certificates */}
                            <div className="ai-section">
                                <div className="ai-section-header">Chứng chỉ</div>
                                {parsedData.degrees?.filter(d => d.type === 'CERTIFICATE').map((c, idx) => (
                                    <label key={idx} className="ai-item-row">
                                        <input type="checkbox" checked={!!selectedItems.certificates[idx]}
                                            onChange={() => setSelectedItems(prev => ({ ...prev, certificates: { ...prev.certificates, [idx]: !prev.certificates[idx] } }))} />
                                        <div className="ai-item-content">
                                            <strong>{c.name}</strong>
                                            <p>{c.year}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Skills */}
                            <div className="ai-section">
                                <div className="ai-section-header">
                                    <span>Kỹ năng</span>
                                    <input type="checkbox" checked={selectedItems.skills} onChange={(e) => setSelectedItems({ ...selectedItems, skills: e.target.checked })} />
                                </div>
                                <div className="ai-item-row">
                                    <div className="ai-item-content">
                                        <p>{parsedData.skills?.map(s => (typeof s === 'string' ? s : (s.skillName || s.name || s.skillId))).join(', ')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="ai-section">
                                <div className="ai-section-header">Kinh nghiệm</div>
                                {parsedData.experience?.map((exp, idx) => (
                                    <label key={idx} className="ai-item-row">
                                        <input type="checkbox" checked={!!selectedItems.experience[idx]}
                                            onChange={() => setSelectedItems(prev => ({ ...prev, experience: { ...prev.experience, [idx]: !prev.experience[idx] } }))} />
                                        <div className="ai-item-content">
                                            <strong>{exp.startDate} - {exp.endDate || 'Hiện tại'}</strong>
                                            <p className="text-sm">{exp.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="transfer-actions">
                                <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={applySelectedData}>
                                    <ArrowRight size={18} /> Điền vào mẫu
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT - FORM */}
                <div className="cv-right flex flex-col h-full">

                    <div className="flex-1 overflow-y-auto pr-2 pb-20">
                        {/* General Info */}
                        <div className="form-section">
                            <h3>Thông tin chung</h3>
                            <div className="form-group">
                                <label>Họ và tên</label>
                                <input value={cvData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Nhập họ tên" />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <input value={cvData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Nhập địa chỉ" />
                            </div>
                            <div className="form-group">
                                <label>Mô tả bản thân</label>
                                <textarea rows={3} value={cvData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Giới thiệu ngắn gọn..." />
                            </div>
                            <div className="form-group">
                                <label>Lĩnh vực (Category)</label>
                                <input value={cvData.category} onChange={(e) => updateField('category', e.target.value)} placeholder="VD: IT Software..." />
                                {/* Hidden input to track ID if present */}
                                <input type="hidden" value={cvData.categoryId || ''} />
                            </div>
                        </div>

                        {/* Degrees */}
                        <div className="form-section">
                            <h3>Bằng cấp (Degrees)</h3>
                            {cvData.degrees.filter(d => d.type === 'DEGREE').map(item => (
                                <div key={item.id} className="dynamic-item">
                                    <button className="remove-btn" onClick={() => removeDegreeItem(item.id)}><Trash2 size={14} /></button>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Trường / Tổ chức</label>
                                            <input value={item.institution} onChange={(e) => updateDegreeItem(item.id, 'institution', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Chuyên ngành</label>
                                            <input value={item.major} onChange={(e) => updateDegreeItem(item.id, 'major', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Bằng cấp</label>
                                            <input value={item.degree} onChange={(e) => updateDegreeItem(item.id, 'degree', e.target.value)} placeholder="Cử nhân, Kỹ sư..." />
                                        </div>
                                        <div className="form-group">
                                            <label>Năm tốt nghiệp</label>
                                            <input type="number" value={item.graduationYear} onChange={(e) => updateDegreeItem(item.id, 'graduationYear', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="add-btn" onClick={() => addDegree('DEGREE')}><Plus size={18} /> Thêm bằng cấp</button>
                        </div>

                        {/* Certificates */}
                        <div className="form-section">
                            <h3>Chứng chỉ (Certificates)</h3>
                            {cvData.degrees.filter(d => d.type === 'CERTIFICATE').map(item => (
                                <div key={item.id} className="dynamic-item">
                                    <button className="remove-btn" onClick={() => removeDegreeItem(item.id)}><Trash2 size={14} /></button>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Tên chứng chỉ</label>
                                            <input value={item.name} onChange={(e) => updateDegreeItem(item.id, 'name', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Năm</label>
                                            <input type="number" value={item.year} onChange={(e) => updateDegreeItem(item.id, 'year', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="add-btn" onClick={() => addDegree('CERTIFICATE')}><Plus size={18} /> Thêm chứng chỉ</button>
                        </div>

                        {/* Experience - REVERTED */}
                        <div className="form-section">
                            <h3>Kinh nghiệm làm việc</h3>
                            {cvData.experience.map(item => (
                                <div key={item.id} className="dynamic-item">
                                    <button className="remove-btn" onClick={() => removeExperience(item.id)}><Trash2 size={14} /></button>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Ngày bắt đầu</label>
                                            <input type="date" value={item.startDate} onChange={(e) => updateExperience(item.id, 'startDate', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Ngày kết thúc</label>
                                            <input type="date" value={item.endDate || ''} onChange={(e) => updateExperience(item.id, 'endDate', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả công việc</label>
                                        <textarea rows={2} value={item.description} onChange={(e) => updateExperience(item.id, 'description', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <button className="add-btn" onClick={addExperience}><Plus size={18} /> Thêm kinh nghiệm</button>
                        </div>

                        {/* Skills */}
                        <div className="form-section">
                            <h3>Kỹ năng</h3>
                            <div className="skills-container">
                                {cvData.skills.map((skill, index) => (
                                    <div key={index} className="skill-tag">
                                        <span>{skill.skillName} ({skill.experienceYears} năm)</span>
                                        <button onClick={() => removeSkill(index)}><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="form-row items-end">
                                <div className="form-group flex-1">
                                    <label>Tên kỹ năng</label>
                                    <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} onKeyDown={addSkill} placeholder="Nhập và Enter" />
                                </div>
                                <div className="form-group w-24">
                                    <label>Số năm</label>
                                    <input type="number" min="0" value={newSkillExp} onChange={(e) => setNewSkillExp(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MOVED Save Button to Bottom Center */}
                    <div className="p-4 border-t border-gray-100 flex justify-center bg-white sticky bottom-0">
                        <button className="btn-primary flex items-center gap-2 px-8 py-3 text-lg" onClick={handleSave}>
                            <Save size={20} /> Lưu Hồ Sơ
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};