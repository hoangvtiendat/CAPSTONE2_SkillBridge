import React, { useState, useEffect, useRef } from 'react';
import { FileText, Wand2, CheckCircle, Upload, Plus, X, ArrowRight, Loader2 } from 'lucide-react';
import './CVParser.css';

/* ================= MOCK AI DATA ================= */
const MOCK_AI_RESULT = {
    personalInfo: {
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0901234567',
        address: 'Hà Nội, Việt Nam',
        summary: 'Lập trình viên Frontend với 3 năm kinh nghiệm chuyên về ReactJS và hệ sinh thái JavaScript.'
    },
    position: 'Frontend Developer',
    experience: [
        {
            company: 'Tech Solutions Inc.',
            position: 'Senior Frontend Developer',
            duration: '01/2022 - Hiện tại',
            description: 'Phát triển giao diện người dùng cho hệ thống CRM, tối ưu hóa hiệu suất ứng dụng.'
        },
        {
            company: 'Creative Web Agency',
            position: 'Junior Web Developer',
            duration: '06/2020 - 12/2021',
            description: 'Xây dựng website responsive cho khách hàng sử dụng HTML, CSS, JavaScript.'
        }
    ],
    education: [
        {
            school: 'Đại học Bách Khoa Hà Nội',
            degree: 'Kỹ sư Công nghệ phần mềm',
            duration: '2016 - 2021',
            description: 'Tốt nghiệp loại Giỏi. GPA: 3.6/4.0'
        }
    ],
    skills: ['React', 'JavaScript', 'TypeScript', 'Redux', 'Tailwind CSS', 'NodeJS', 'Git']
};

export const CVParser = () => {
    // State for AI Parser
    const [parsingState, setParsingState] = useState('idle'); // idle | uploading | scanning | done
    const [scanProgress, setScanProgress] = useState(0);
    const [parsedData, setParsedData] = useState(null);

    // State for Selection (tracking which AI items are selected)
    const [selectedItems, setSelectedItems] = useState({
        personalInfo: true,
        position: true,
        experience: {}, // { index: true/false }
        education: {},  // { index: true/false }
        skills: true
    });

    // State for CV Form (Right Column)
    const [cvData, setCvData] = useState({
        personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            address: '',
            summary: ''
        },
        position: '',
        experience: [
            { id: 1, company: '', position: '', duration: '', description: '' }
        ],
        education: [
            { id: 1, school: '', degree: '', duration: '', description: '' }
        ],
        skills: []
    });

    // State for new skill input
    const [newSkill, setNewSkill] = useState('');

    /* ================= SCANNING LOGIC ================= */
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setParsingState('scanning');
        setScanProgress(0);

        // Simulate 5s scanning process
        const duration = 5000;
        const intervalTime = 50;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const progress = Math.min(Math.round((currentStep / steps) * 100), 100);
            setScanProgress(progress);

            if (currentStep >= steps) {
                clearInterval(timer);
                setParsingState('done');
                setParsedData(MOCK_AI_RESULT);
                // Initialize selected items for arrays
                setSelectedItems(prev => ({
                    ...prev,
                    experience: MOCK_AI_RESULT.experience.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {}),
                    education: MOCK_AI_RESULT.education.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
                }));
            }
        }, intervalTime);
    };

    /* ================= DATA TRANSFER LOGIC ================= */
    const applySelectedData = () => {
        if (!parsedData) return;

        setCvData(prevItems => {
            const newData = { ...prevItems };

            // Apply Personal Info
            if (selectedItems.personalInfo) {
                newData.personalInfo = { ...parsedData.personalInfo };
            }

            // Apply Position
            if (selectedItems.position) {
                newData.position = parsedData.position;
            }

            // Apply Experience
            const selectedExp = parsedData.experience.filter((_, idx) => selectedItems.experience[idx]);
            if (selectedExp.length > 0) {
                const formattedExp = selectedExp.map((item, idx) => ({ ...item, id: Date.now() + idx }));
                newData.experience = [...prevItems.experience, ...formattedExp];
            }

            // Apply Education
            const selectedEdu = parsedData.education.filter((_, idx) => selectedItems.education[idx]);
            if (selectedEdu.length > 0) {
                const formattedEdu = selectedEdu.map((item, idx) => ({ ...item, id: Date.now() + 100 + idx }));
                newData.education = [...prevItems.education, ...formattedEdu];
            }

            // Apply Skills
            if (selectedItems.skills) {
                // Merge unique skills
                const combinedSkills = new Set([...prevItems.skills, ...parsedData.skills]);
                newData.skills = Array.from(combinedSkills);
            }

            return newData;
        });
    };

    /* ================= FORM HANDLERS ================= */
    const handlePersonalInfoChange = (field, value) => {
        setCvData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [field]: value }
        }));
    };

    // Experience Handlers
    const addExperience = () => {
        setCvData(prev => ({
            ...prev,
            experience: [
                ...prev.experience,
                { id: Date.now(), company: '', position: '', duration: '', description: '' }
            ]
        }));
    };

    const removeExperience = (id) => {
        setCvData(prev => ({
            ...prev,
            experience: prev.experience.filter(item => item.id !== id)
        }));
    };

    const updateExperience = (id, field, value) => {
        setCvData(prev => ({
            ...prev,
            experience: prev.experience.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    // Education Handlers
    const addEducation = () => {
        setCvData(prev => ({
            ...prev,
            education: [
                ...prev.education,
                { id: Date.now(), school: '', degree: '', duration: '', description: '' }
            ]
        }));
    };

    const removeEducation = (id) => {
        setCvData(prev => ({
            ...prev,
            education: prev.education.filter(item => item.id !== id)
        }));
    };

    const updateEducation = (id, field, value) => {
        setCvData(prev => ({
            ...prev,
            education: prev.education.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    // Skills Handlers
    const addSkill = (e) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            e.preventDefault();
            if (!cvData.skills.includes(newSkill.trim())) {
                setCvData(prev => ({
                    ...prev,
                    skills: [...prev.skills, newSkill.trim()]
                }));
            }
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setCvData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    return (
        <div className="cv-page">
            <div className="cv-layout">

                {/* ================= LEFT COLUMN: AI PARSER ================= */}
                <div className="cv-left">
                    <h2><Wand2 className="text-blue-500" /> AI CV Parser</h2>

                    {parsingState === 'idle' && (
                        <label className="upload-box">
                            <input type="file" accept=".pdf,.docx,.doc,.jpg,.png" hidden onChange={handleFileUpload} />
                            <Upload size={48} className="text-blue-500 mb-3 mx-auto" />
                            <h3>Tải lên CV của bạn</h3>
                            <p>Hỗ trợ PDF, DOCX, JPG, PNG</p>
                        </label>
                    )}

                    {parsingState === 'scanning' && (
                        <div className="scan-box">
                            <div className="scan-line"></div>
                            <div className="scan-content">
                                <FileText size={64} className="pdf-icon" />
                                <h3>Đang phân tích CV...</h3>
                                <div className="processing-text">{scanProgress}%</div>
                            </div>
                        </div>
                    )}

                    {parsingState === 'done' && parsedData && (
                        <div className="ai-results-container">
                            <div className="ai-section">
                                <div className="ai-section-header">
                                    <span>Thông tin cá nhân</span>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.personalInfo}
                                        onChange={(e) => setSelectedItems({ ...selectedItems, personalInfo: e.target.checked })}
                                    />
                                </div>
                                <div className="ai-item-row">
                                    <div className="ai-item-content">
                                        <strong>{parsedData.personalInfo.fullName}</strong>
                                        <p>{parsedData.personalInfo.email} • {parsedData.personalInfo.phone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-section">
                                <div className="ai-section-header">
                                    <span>Vị trí</span>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.position}
                                        onChange={(e) => setSelectedItems({ ...selectedItems, position: e.target.checked })}
                                    />
                                </div>
                                <div className="ai-item-row">
                                    <div className="ai-item-content">
                                        <strong>{parsedData.position}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-section">
                                <div className="ai-section-header">Kinh nghiệm làm việc</div>
                                {parsedData.experience.map((exp, idx) => (
                                    <label key={idx} className="ai-item-row">
                                        <input
                                            type="checkbox"
                                            checked={!!selectedItems.experience[idx]}
                                            onChange={() => setSelectedItems(prev => ({
                                                ...prev,
                                                experience: {
                                                    ...prev.experience,
                                                    [idx]: !prev.experience[idx]
                                                }
                                            }))}
                                        />
                                        <div className="ai-item-content">
                                            <strong>{exp.position}</strong>
                                            <p>{exp.company} • {exp.duration}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="ai-section">
                                <div className="ai-section-header">Học vấn</div>
                                {parsedData.education.map((edu, idx) => (
                                    <label key={idx} className="ai-item-row">
                                        <input
                                            type="checkbox"
                                            checked={!!selectedItems.education[idx]}
                                            onChange={() => setSelectedItems(prev => ({
                                                ...prev,
                                                education: {
                                                    ...prev.education,
                                                    [idx]: !prev.education[idx]
                                                }
                                            }))}
                                        />
                                        <div className="ai-item-content">
                                            <strong>{edu.school}</strong>
                                            <p>{edu.degree} • {edu.duration}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="ai-section">
                                <div className="ai-section-header">
                                    <span>Kỹ năng ({parsedData.skills.length})</span>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.skills}
                                        onChange={(e) => setSelectedItems({ ...selectedItems, skills: e.target.checked })}
                                    />
                                </div>
                                <div className="ai-item-row">
                                    <div className="ai-item-content">
                                        <p>{parsedData.skills.join(', ')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="transfer-actions">
                                <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={applySelectedData}>
                                    <ArrowRight size={18} /> Điền vào mẫu
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= RIGHT COLUMN: CV FORM ================= */}
                <div className="cv-right">
                    <div className="form-section">
                        <h3>Thông tin cá nhân</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Họ và tên</label>
                                <input
                                    value={cvData.personalInfo.fullName}
                                    onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    value={cvData.personalInfo.email}
                                    onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input
                                    value={cvData.personalInfo.phone}
                                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                                    placeholder="0901234567"
                                />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <input
                                    value={cvData.personalInfo.address}
                                    onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                                    placeholder="Hà Nội, Việt Nam"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Giới thiệu bản thân</label>
                            <textarea
                                rows={3}
                                value={cvData.personalInfo.summary}
                                onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                                placeholder="Mô tả ngắn gọn về bản thân và mục tiêu nghề nghiệp..."
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Vị trí</h3>
                        <div className="form-group">
                            <input
                                value={cvData.position}
                                onChange={(e) => setCvData({ ...cvData, position: e.target.value })}
                                placeholder="VD: Frontend Developer"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Kinh nghiệm làm việc</h3>
                        {cvData.experience.map((item, index) => (
                            <div key={item.id} className="dynamic-item">
                                <button className="remove-btn" onClick={() => removeExperience(item.id)}>Xóa</button>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Công ty</label>
                                        <input
                                            value={item.company}
                                            onChange={(e) => updateExperience(item.id, 'company', e.target.value)}
                                            placeholder="Tên công ty"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Vị trí</label>
                                        <input
                                            value={item.position}
                                            onChange={(e) => updateExperience(item.id, 'position', e.target.value)}
                                            placeholder="Chức danh"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Thời gian</label>
                                    <input
                                        value={item.duration}
                                        onChange={(e) => updateExperience(item.id, 'duration', e.target.value)}
                                        placeholder="VD: 01/2022 - Hiện tại"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mô tả</label>
                                    <textarea
                                        rows={3}
                                        value={item.description}
                                        onChange={(e) => updateExperience(item.id, 'description', e.target.value)}
                                        placeholder="Mô tả chi tiết công việc..."
                                    />
                                </div>
                            </div>
                        ))}
                        <button className="add-btn" onClick={addExperience}>
                            <Plus size={18} /> Thêm kinh nghiệm
                        </button>
                    </div>

                    <div className="form-section">
                        <h3>Học vấn</h3>
                        {cvData.education.map((item, index) => (
                            <div key={item.id} className="dynamic-item">
                                <button className="remove-btn" onClick={() => removeEducation(item.id)}>Xóa</button>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Trường học</label>
                                        <input
                                            value={item.school}
                                            onChange={(e) => updateEducation(item.id, 'school', e.target.value)}
                                            placeholder="Tên trường / Tổ chức"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Chuyên ngành / Bằng cấp</label>
                                        <input
                                            value={item.degree}
                                            onChange={(e) => updateEducation(item.id, 'degree', e.target.value)}
                                            placeholder="VD: Kỹ sư phần mềm"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Thời gian</label>
                                    <input
                                        value={item.duration}
                                        onChange={(e) => updateEducation(item.id, 'duration', e.target.value)}
                                        placeholder="VD: 2018 - 2022"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mô tả</label>
                                    <textarea
                                        rows={2}
                                        value={item.description}
                                        onChange={(e) => updateEducation(item.id, 'description', e.target.value)}
                                        placeholder="Thành tích, GPA..."
                                    />
                                </div>
                            </div>
                        ))}
                        <button className="add-btn" onClick={addEducation}>
                            <Plus size={18} /> Thêm học vấn
                        </button>
                    </div>

                    <div className="form-section">
                        <h3>Kỹ năng</h3>
                        <div className="skills-container">
                            {cvData.skills.map((skill, index) => (
                                <div key={index} className="skill-tag">
                                    {skill}
                                    <button onClick={() => removeSkill(skill)}><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="form-group">
                            <input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyDown={addSkill}
                                placeholder="Nhập kỹ năng và nhấn Enter..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button className="btn-secondary">Hủy</button>
                        <button className="btn-primary">Lưu Hồ Sơ</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
