import React, { useState, useEffect, useRef } from 'react';
import { FileText, Wand2, Upload, Plus, X, ArrowRight, Save, Trash2 } from 'lucide-react';
import candidateService from '../../services/api/candidateService';
import {toast} from 'sonner';
import './CVParser.css';

export const CVParser = () => {
    // State for AI Parser
    const [parsingState, setParsingState] = useState('idle'); // idle | uploading | scanning | done
    const [scanProgress, setScanProgress] = useState(0);
    const [parsedData, setParsedData] = useState(null);
    const [isFilled, setIsFilled] = useState(false); // Track if form is already filled

    // State for Selection (tracking which AI items are selected)
    const [selectedItems, setSelectedItems] = useState({
        personalInfo: true,
        experience: {}, // { index: true/false }
        degrees: {},  // { index: true/false }
        certificates: {}, // { index: true/false }
        skills: true
    });
    const [cvFile, setCvFile] = useState(null);
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
    const [newSkillId, setNewSkillId] = useState(null);

    // Autocomplete states
    const [categorySuggestions, setCategorySuggestions] = useState([]);
    const [showCatSuggestions, setShowCatSuggestions] = useState(false);
    const catTimeoutRef = useRef(null);

    const [skillSuggestions, setSkillSuggestions] = useState([]);
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
    const skillTimeoutRef = useRef(null);

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
                            skillId: s.skillId || s.id || null, // Check both
                            skillName: s.skillName || s.name || 'Không có kĩ năng',
                            experienceYears: s.experienceYears || 1
                        })) : [],
                        degrees: (res.degrees || []).map(d => ({
                            ...d,
                            id: d.id || Date.now() + Math.random()
                        })),
                        experience: (res.experience || []).map(e => ({
                            ...e,
                            id: e.id || Date.now() + Math.random()
                        }))
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

        setCvFile(file);

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
                        experience: result.experience ? result.experience.reduce((acc, _, idx) => ({
                            ...acc,
                            [idx]: true
                        }), {}) : {},
                        degrees: result.degrees ? result.degrees.filter(d => d.type === 'DEGREE').reduce((acc, _, idx) => ({
                            ...acc,
                            [idx]: true
                        }), {}) : {},
                        certificates: result.degrees ? result.degrees.filter(d => d.type === 'CERTIFICATE').reduce((acc, _, idx) => ({
                            ...acc,
                            [idx]: true
                        }), {}) : {},
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
    const handleCancel = () => {
        setParsingState('idle');
        setParsedData(null);
        setIsFilled(false);
        setScanProgress(0);
        // Reset file input if possible. 
        // Note: Since we don't have a ref to the file input easily accessible in this scope layout without refactoring, 
        // the user will just need to click the label to trigger file dialog again which replaces the file.
        toast.info("Đã hủy kết quả quét và làm mới trạng thái.");
    };

    const applySelectedData = () => {
        if (!parsedData) return;
        // Logic change: Allow multiple fills, but check for duplicates (Smart Merge)

        setCvData(prev => {
            const newData = {...prev};

            // Apply Personal Info (Overwrite if selected, as these are single fields)
            if (selectedItems.personalInfo) {
                if (parsedData.name) newData.name = parsedData.name;
                if (parsedData.description) newData.description = parsedData.description;
                if (parsedData.address) newData.address = parsedData.address;
                if (parsedData.categoryId) newData.categoryId = parsedData.categoryId;
                if (parsedData.categoryName || parsedData.category) newData.category = parsedData.categoryName || parsedData.category;
            }

            // Apply Experience (Append unique items)
            if (parsedData.experience) {
                const selectedExp = parsedData.experience.filter((_, idx) => selectedItems.experience[idx]);

                // Filter out experiences that already exist (checking by description or star/end date combination)
                const newExpToAdd = selectedExp.filter(newItem => {
                    return !prev.experience.some(existing =>
                        (existing.description === newItem.description) ||
                        (existing.startDate === newItem.startDate && existing.endDate === newItem.endDate)
                    );
                });

                const formattedExp = newExpToAdd.map(item => ({
                    startDate: item.startDate,
                    endDate: item.endDate,
                    description: item.description,
                    id: Date.now() + Math.random() // Temp ID for UI key
                }));
                newData.experience = [...prev.experience, ...formattedExp];
            }

            // Apply Degrees & Certificates (Append unique items)
            if (parsedData.degrees) {
                const degreesToAdd = [];

                // Handle DEGREES
                const parsedDegrees = parsedData.degrees.filter(d => d.type === 'DEGREE');
                parsedDegrees.forEach((deg, idx) => {
                    if (selectedItems.degrees[idx]) {
                        // Check duplicate: Same degree AND institution
                        const exists = prev.degrees.some(existing =>
                            existing.type === 'DEGREE' &&
                            existing.degree === deg.degree &&
                            existing.institution === deg.institution
                        );
                        if (!exists) {
                            degreesToAdd.push({...deg, id: Date.now() + Math.random()});
                        }
                    }
                });

                // Handle CERTIFICATES
                const parsedCerts = parsedData.degrees.filter(d => d.type === 'CERTIFICATE');
                parsedCerts.forEach((cert, idx) => {
                    if (selectedItems.certificates[idx]) {
                        // Check duplicate: Same name
                        const exists = prev.degrees.some(existing =>
                            existing.type === 'CERTIFICATE' &&
                            existing.name === cert.name
                        );
                        if (!exists) {
                            degreesToAdd.push({...cert, id: Date.now() + Math.random()});
                        }
                    }
                });

                newData.degrees = [...prev.degrees, ...degreesToAdd];
            }

            if (selectedItems.skills && parsedData.skills) {
                const newSkills = parsedData.skills.map(s => {
                    const isObj = typeof s === 'object';
                    const id = isObj ? (s.skillId || s.id) : null;
                    const name = isObj ? (s.skillName || s.name || s.skillId) : s;
                    const exp = isObj && s.experienceYears ? s.experienceYears : 1;

                    return {
                        skillName: name,
                        skillId: id,
                        experienceYears: exp
                    };
                }).filter(s => s.skillId); // Only add skills mapped to database IDs

                const existingNames = new Set(prev.skills.map(s => s.skillName?.toLowerCase()));
                const uniqueNewSkills = newSkills.filter(s => !existingNames.has(s.skillName?.toLowerCase()));

                newData.skills = [...prev.skills, ...uniqueNewSkills];
            }

            return newData;
        });

        // Removed setIsFilled(true) restriction logic
        toast.success("Đã điền thông tin vào mẫu (đã lọc trùng lặp)!");
    };

    /* ================= FORM HANDLERS ================= */
    const updateField = (field, value) => {
        setCvData(prev => ({...prev, [field]: value}));
    };

    // --- Autocomplete Handlers ---
    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setCvData(prev => ({ ...prev, category: value, categoryId: '' }));
        if (value.length >= 2) {
            if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current);
            catTimeoutRef.current = setTimeout(async () => {
                try {
                    const res = await candidateService.getAutoCategory(value);
                    if (res && res.result) setCategorySuggestions(res.result);
                    setShowCatSuggestions(true);
                } catch (err) { }
            }, 300);
        } else {
            setCategorySuggestions([]);
            setShowCatSuggestions(false);
        }
    };

    const selectCategory = (cat) => {
        setCvData(prev => ({ ...prev, category: cat.name, categoryId: cat.id }));
        setShowCatSuggestions(false);
    };

    const handleSkillChange = (e) => {
        const value = e.target.value;
        setNewSkillName(value);
        setNewSkillId(null);
        if (value.length >= 2) {
            if (skillTimeoutRef.current) clearTimeout(skillTimeoutRef.current);
            skillTimeoutRef.current = setTimeout(async () => {
                try {
                    const paramsId = cvData.categoryId || '';
                    const res = await candidateService.getAutoSkill(value, paramsId);
                    if (res && res.result) setSkillSuggestions(res.result);
                    setShowSkillSuggestions(true);
                } catch (err) { }
            }, 300);
        } else {
            setSkillSuggestions([]);
            setShowSkillSuggestions(false);
        }
    };

    const selectSkill = (skill) => {
        const normalizedName = skill.name.trim();
        // Check if already exists in cvData.skills
        if (!cvData.skills.some(s => (s.skillId === skill.id) || (s.skillName?.toLowerCase() === normalizedName.toLowerCase()))) {
            setCvData(prev => ({
                ...prev,
                skills: [...prev.skills, { skillName: normalizedName, skillId: skill.id, experienceYears: 1 }]
            }));
            toast.success(`Đã thêm kỹ năng: ${normalizedName}`);
        } else {
            toast.info("Kỹ năng này đã có trong danh sách.");
        }

        setNewSkillName('');
        setNewSkillId(null);
        setSkillSuggestions([]);
        setShowSkillSuggestions(false);
    };
    // -----------------------------

    const addExperience = () => {
        setCvData(prev => ({
            ...prev,
            experience: [...prev.experience, {id: Date.now(), startDate: '', endDate: '', description: ''}]
        }));
    };
    const updateExperience = (id, field, value) => {
        setCvData(prev => ({
            ...prev,
            experience: prev.experience.map(item => item.id === id ? {...item, [field]: value} : item)
        }));
    };
    const removeExperience = (id) => {
        setCvData(prev => ({...prev, experience: prev.experience.filter(item => item.id !== id)}));
    };

    const addDegree = (type) => {
        const newItem = type === 'DEGREE'
            ? { id: Date.now(), type, degree: '', major: '', institution: '', graduationYear: '', level: '' }
            : { id: Date.now(), type, name: '', year: '', level: '' };

        setCvData(prev => ({
            ...prev,
            degrees: [...prev.degrees, newItem]
        }));
    };
    const updateDegreeItem = (id, field, value) => {
        setCvData(prev => ({
            ...prev,
            degrees: prev.degrees.map(item => item.id === id ? {...item, [field]: value} : item)
        }));
    };
    const removeDegreeItem = (id) => {
        setCvData(prev => ({...prev, degrees: prev.degrees.filter(item => item.id !== id)}));
    };

    const addSkill = (e) => {
        if (e.key === 'Enter' && newSkillName.trim()) {
            e.preventDefault();
            if (!newSkillId) {
                toast.error("Vui lòng chọn kỹ năng từ danh sách gợi ý hợp lệ.");
                return;
            }
            const normalizedName = newSkillName.trim();
            if (!cvData.skills.some(s => s.skillName?.toLowerCase() === normalizedName.toLowerCase())) {
                setCvData(prev => ({
                    ...prev,
                    skills: [...prev.skills, { skillName: normalizedName, skillId: newSkillId, experienceYears: 1 }]
                }));
            }
            setNewSkillName('');
            setNewSkillId(null);
            setShowSkillSuggestions(false);
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
            const payload = {
                name: cvData.name,
                description: cvData.description,
                address: cvData.address,
                categoryId: cvData.categoryId || null,
                degrees: cvData.degrees.map(d => {
                    const yearVal = d.type === 'DEGREE' ? parseInt(d.graduationYear) : parseInt(d.year);
                    if (d.type === 'DEGREE') {
                        return {
                            type: 'DEGREE',
                            degree: d.degree,
                            major: d.major,
                            institution: d.institution,
                            graduationYear: isNaN(yearVal) ? 0 : yearVal,
                            level: d.level || ''
                        };
                    } else {
                        return {
                            type: 'CERTIFICATE',
                            name: d.name,
                            year: isNaN(yearVal) ? 0 : yearVal,
                            level: d.level || ''
                        };
                    }
                }),
                experience: cvData.experience.map(e => ({
                    startDate: e.startDate,
                    endDate: e.endDate,
                    description: e.description
                })),
                skills: cvData.skills.map(s => ({
                    skillId: s.skillId || s.id || null,
                    experienceYears: parseInt(s.experienceYears) || 0
                })).filter(s => s.skillId) // Filter out skills without IDs as per strict backend requirement
            };

            // ✅ QUAN TRỌNG: dùng FormData
            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(payload)], {type: "application/json"}));

            if (cvFile) {
                formData.append("cv", cvFile);
            }

            console.log("Sending multipart:", payload);

            await candidateService.updateCv(formData);

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
                <div className="cv-left">
                    <h2><Wand2 className="text-blue-500"/> AI CV Parser</h2>

                    {parsingState === 'idle' && (
                        <>
                            <label className="upload-box">
                                <input type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFileUpload}/>
                                <Upload size={48} className="text-blue-500 mb-3 mx-auto"/>
                                <h3>Tải lên CV (PDF)</h3>
                                <p>Hệ thống sẽ tự động quét thông tin</p>
                            </label>

                        {cvFile && (
                            <div className="mt-2 text-sm text-green-600 text-center">
                                Đã chọn file: {cvFile.name}
                            </div>
                        )} </>
                    )}

                    {parsingState === 'scanning' && (
                        <div className="scan-box">
                            <div className="scan-line"></div>
                            <div className="scan-content">
                                <FileText size={64} className="pdf-icon"/>
                                <h3>Đang phân tích...</h3>
                                <div className="processing-text">{scanProgress}%</div>
                            </div>
                        </div>
                    )}

                    {parsingState === 'done' && parsedData && (
                        <>
                            <div className="ai-results-container">
                                {/* Personal Info */}
                                <div className="ai-section personal-info-section">
                                    <div className="ai-section-header">
                                        <span>Thông tin chung</span>
                                        <input type="checkbox" checked={selectedItems.personalInfo}
                                               onChange={(e) => setSelectedItems({
                                                   ...selectedItems,
                                                   personalInfo: e.target.checked
                                               })}/>
                                    </div>
                                    <div className="ai-item-row">
                                        <div className="ai-item-content">
                                            <strong>{parsedData.name}</strong>
                                            <p>{parsedData.address}</p>
                                            <p className="text-sm text-gray-500">{parsedData.description}</p>
                                            {/* Display ID if Name is missing, assuming parser returns ID for now based on user feedback */}
                                            {parsedData.categoryId && <p className="text-xs text-blue-600">Category
                                                ID: {parsedData.categoryId}</p>}
                                        </div>
                                    </div>
                                </div>

                                {parsedData.categoryName && (
                                    <div className="ai-section category-section">
                                        <div className="ai-section-header">
                                            <span>Lĩnh vực</span>
                                            <input type="checkbox" checked={selectedItems.personalInfo} onChange={(e) => setSelectedItems({ ...selectedItems, personalInfo: e.target.checked })} />
                                        </div>
                                        <div className="ai-item-row">
                                            <div className="ai-item-content">
                                                <p className="text-sm font-semibold text-blue-600"><b>{parsedData.categoryName}</b></p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Degrees */}
                                <div className="ai-section">
                                    <div className="ai-section-header">Bằng cấp</div>
                                    {parsedData.degrees?.filter(d => d.type === 'DEGREE').map((d, idx) => (
                                        <label key={idx} className="ai-item-row">
                                            <input type="checkbox" checked={!!selectedItems.degrees[idx]}
                                                   onChange={() => setSelectedItems(prev => ({
                                                       ...prev,
                                                       degrees: {...prev.degrees, [idx]: !prev.degrees[idx]}
                                                   }))}/>
                                            <div className="ai-item-content">
                                                <strong>{d.degree} - {d.major}</strong>
                                                <p>{d.institution} ({d.graduationYear})</p>
                                                {d.level && <p className="text-xs text-green-600 font-medium">Bậc/Điểm: {d.level}</p>}
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
                                                   onChange={() => setSelectedItems(prev => ({
                                                       ...prev,
                                                       certificates: {
                                                           ...prev.certificates,
                                                           [idx]: !prev.certificates[idx]
                                                       }
                                                   }))}/>
                                            <div className="ai-item-content">
                                                <strong>{c.name}</strong>
                                                <p>{c.year}</p>
                                                {c.level && <p className="text-xs text-green-600 font-medium">Bậc/Điểm/Level: {c.level}</p>}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* Skills */}
                                <div className="ai-section">
                                    <div className="ai-section-header">
                                        <span>Kỹ năng</span>
                                        <input type="checkbox" checked={selectedItems.skills}
                                               onChange={(e) => setSelectedItems({
                                                   ...selectedItems,
                                                   skills: e.target.checked
                                               })}/>
                                    </div>
                                    <div className="ai-item-row">
                                        <div className="ai-item-content">
                                            <ul className="list-none p-0 m-0">
                                                {parsedData.skills?.map((s, idx) => {
                                                    const name = typeof s === 'string' ? s : (s.skillName || s.name || s.skillId);
                                                    const y = typeof s === 'object' && s.experienceYears ? ` (${s.experienceYears} năm)` : '';
                                                    return <li key={idx} className="text-sm py-1 border-b border-gray-50 last:border-0"> {name}{y}</li>;
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Experience */}
                                <div className="ai-section">
                                    <div className="ai-section-header">Kinh nghiệm</div>
                                    {parsedData.experience?.map((exp, idx) => (
                                        <label key={idx} className="ai-item-row">
                                            <input type="checkbox" checked={!!selectedItems.experience[idx]}
                                                   onChange={() => setSelectedItems(prev => ({
                                                       ...prev,
                                                       experience: {
                                                           ...prev.experience,
                                                           [idx]: !prev.experience[idx]
                                                       }
                                                   }))}/>
                                            <div className="ai-item-content">
                                                <strong>{exp.startDate} - {exp.endDate || 'Hiện tại'}</strong>
                                                <p className="text-sm">{exp.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                            </div>
                            <div className="transfer-actions">
                                <button
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    onClick={applySelectedData}
                                >
                                    <ArrowRight size={18}/> Điền vào mẫu
                                </button>
                                <button
                                    className="btn-secondary flex items-center justify-center gap-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                                    onClick={handleCancel}
                                >
                                    <X size={18}/> Hủy kết quả
                                </button>
                            </div>
                        </>
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
                                <input value={cvData.name} onChange={(e) => updateField('name', e.target.value)}
                                       placeholder="Nhập họ tên"/>
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <input value={cvData.address}
                                       onChange={(e) => updateField('address', e.target.value)}
                                       placeholder="Nhập địa chỉ"/>
                            </div>
                            <div className="form-group">
                                <label>Mô tả bản thân</label>
                                <textarea rows={3} value={cvData.description}
                                          onChange={(e) => updateField('description', e.target.value)}
                                          placeholder="Giới thiệu ngắn gọn..."/>
                            </div>
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Lĩnh vực (Category)</label>
                                <input value={cvData.category} onChange={handleCategoryChange} onFocus={() => { if (categorySuggestions.length > 0) setShowCatSuggestions(true) }} placeholder="VD: IT Software..." />
                                <input type="hidden" value={cvData.categoryId || ''} />
                                {showCatSuggestions && categorySuggestions.length > 0 && (
                                    <ul className="suggestions-dropdown" style={{
                                        position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 10,
                                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
                                        listStyle: 'none', padding: 0, margin: '4px 0 0 0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'
                                    }}>
                                        {categorySuggestions.map(cat => (
                                            <li key={cat.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}
                                                onClick={() => selectCategory(cat)}
                                                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.target.style.background = '#fff'}
                                            >
                                                {cat.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Degrees */}
                        <div className="form-section">
                            <h3>Bằng cấp (Degrees)</h3>
                            {cvData.degrees.filter(d => d.type === 'DEGREE').map(item => (
                                <div key={item.id} className="dynamic-item">
                                    <button className="remove-btn" onClick={() => removeDegreeItem(item.id)}>
                                        <Trash2
                                            size={14}/></button>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Trường / Tổ chức</label>
                                            <input value={item.institution}
                                                   onChange={(e) => updateDegreeItem(item.id, 'institution', e.target.value)}/>
                                        </div>
                                        <div className="form-group">
                                            <label>Chuyên ngành</label>
                                            <input value={item.major}
                                                   onChange={(e) => updateDegreeItem(item.id, 'major', e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Bằng cấp</label>
                                            <input value={item.degree}
                                                   onChange={(e) => updateDegreeItem(item.id, 'degree', e.target.value)}
                                                   placeholder="Cử nhân, Kỹ sư..."/>
                                        </div>
                                        <div className="form-group">
                                            <label>Năm tốt nghiệp</label>
                                            <input type="number" value={item.graduationYear}
                                                   onChange={(e) => updateDegreeItem(item.id, 'graduationYear', e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Xếp loại / Điểm (Level)</label>
                                        <input value={item.level || ''} onChange={(e) => updateDegreeItem(item.id, 'level', e.target.value)} placeholder="VD: Giỏi, 3.5/4.0..." />
                                    </div>
                                </div>
                            ))}
                            <button className="add-btn" onClick={() => addDegree('DEGREE')}><Plus
                                size={18}/> Thêm bằng
                                cấp
                            </button>
                        </div>

                        {/* Certificates */}
                        <div className="form-section">
                            <h3>Chứng chỉ (Certificates)</h3>
                            {cvData.degrees.filter(d => d.type === 'CERTIFICATE').map(item => (
                                <div key={item.id} className="dynamic-item">
                                    <button className="remove-btn" onClick={() => removeDegreeItem(item.id)}>
                                        <Trash2
                                            size={14}/></button>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Tên chứng chỉ</label>
                                            <input value={item.name}
                                                   onChange={(e) => updateDegreeItem(item.id, 'name', e.target.value)}/>
                                        </div>
                                        <div className="form-group">
                                            <label>Năm</label>
                                            <input type="number" value={item.year}
                                                   onChange={(e) => updateDegreeItem(item.id, 'year', e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Cấp độ / Điểm (Level/Score)</label>
                                        <input value={item.level || ''} onChange={(e) => updateDegreeItem(item.id, 'level', e.target.value)} placeholder="VD: 750+, N3, B2..." />
                                    </div>
                                </div>
                            ))}
                            <button className="add-btn" onClick={() => addDegree('CERTIFICATE')}><Plus
                                size={18}/> Thêm
                                chứng chỉ
                            </button>
                        </div>

                        {/* Experience - REVERTED */}
                        <div className="form-section">
                            <h3>Kinh nghiệm làm việc</h3>
                            {cvData.experience.map(item => (
                                <div key={item.id} className="dynamic-item">
                                    <button className="remove-btn" onClick={() => removeExperience(item.id)}>
                                        <Trash2
                                            size={14}/></button>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Ngày bắt đầu</label>
                                            <input type="date" value={item.startDate}
                                                   onChange={(e) => updateExperience(item.id, 'startDate', e.target.value)}/>
                                        </div>
                                        <div className="form-group">
                                            <label>Ngày kết thúc</label>
                                            <input type="date" value={item.endDate || ''}
                                                   onChange={(e) => updateExperience(item.id, 'endDate', e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả công việc</label>
                                        <textarea rows={2} value={item.description}
                                                  onChange={(e) => updateExperience(item.id, 'description', e.target.value)}/>
                                    </div>
                                </div>
                            ))}
                            <button className="add-btn" onClick={addExperience}><Plus size={18}/> Thêm kinh
                                nghiệm
                            </button>
                        </div>

                        {/* Skills */}
                        <div className="form-section">
                            <h3>Kỹ năng</h3>
                            <div className="skills-container">
                                {cvData.skills.map((skill, index) => (
                                    <div key={index} className={`skill-tag ${!skill.skillId ? 'no-id' : ''}`}>
                                        <span className="skill-name">{skill.skillName} {!skill.skillId && <span className="no-id-text">(No ID)</span>}</span>
                                        <input
                                            type="number"
                                            className="skill-year-input"
                                            value={skill.experienceYears}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setCvData(prev => ({
                                                    ...prev,
                                                    skills: prev.skills.map((s, i) => i === index ? { ...s, experienceYears: newVal } : s)
                                                }));
                                            }}
                                        />
                                        <span className="skill-exp-label">năm</span>
                                        <button onClick={() => removeSkill(index)} className="remove-skill-btn"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="form-row items-end">
                                <div className="form-group flex-1" style={{ position: 'relative' }}>
                                    <label>Tên kỹ năng</label>
                                    <input value={newSkillName} onChange={handleSkillChange} onFocus={() => { if (skillSuggestions.length > 0) setShowSkillSuggestions(true) }} onKeyDown={addSkill} placeholder="Nhập và Enter" />
                                    {showSkillSuggestions && skillSuggestions.length > 0 && (
                                        <ul className="suggestions-dropdown" style={{
                                            position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 10,
                                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
                                            listStyle: 'none', padding: 0, margin: '4px 0 0 0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'
                                        }}>
                                            {skillSuggestions.map(skill => (
                                                <li key={skill.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}
                                                    onClick={() => selectSkill(skill)}
                                                    onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                                                >
                                                    {skill.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MOVED Save Button to Bottom Center */}
                    <div className="p-4 border-t border-gray-100 flex justify-center bg-white sticky bottom-0">
                        <button
                            className="btn-primary flex items-center gap-2 px-8 py-3 text-lg"
                            onClick={handleSave}
                        >
                            <Save size={20}/> Lưu Hồ Sơ
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};