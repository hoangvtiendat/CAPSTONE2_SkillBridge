import React, { useState, useEffect } from 'react';
import { FileText, Wand2, CheckCircle } from 'lucide-react';
import './CVParser.css';

/* ================= MOCK AI DATA ================= */
const MOCK_AI_RESULT = {
    title: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'REST API'],
    experience: '3 năm kinh nghiệm Frontend tại công ty ABC, tham gia phát triển hệ thống CRM.',
    education: 'Đại học Bách Khoa Hà Nội – Kỹ thuật phần mềm (2018 - 2022)',
};

export const CVParser = () => {
    const [status, setStatus] = useState('idle'); // idle | processing | done
    const [progress, setProgress] = useState(0);

    /* ===== LEFT: CV MANUAL ===== */
    const [manualCV, setManualCV] = useState({
        title: '',
        skills: '',
        experience: '',
        education: '',
    });

    /* ===== RIGHT: AI RESULT ===== */
    const [aiResult, setAiResult] = useState(null);
    const [checkedAI, setCheckedAI] = useState({});

    /* ===== PROCESS MOCK ===== */
    useEffect(() => {
        if (status !== 'processing') return;

        let value = 0;
        const timer = setInterval(() => {
            value += 2;
            setProgress(value);
            if (value >= 100) {
                clearInterval(timer);
                setStatus('done');
                setAiResult(MOCK_AI_RESULT);
                setCheckedAI({
                    title: true,
                    skills: true,
                    experience: true,
                    education: true,
                });
            }
        }, 60);

        return () => clearInterval(timer);
    }, [status]);

    /* ===== APPLY AI DATA ===== */
    const applyAIData = () => {
        if (!aiResult) return;

        setManualCV((prev) => ({
            ...prev,
            title: checkedAI.title ? aiResult.title : prev.title,
            skills: checkedAI.skills ? aiResult.skills.join(', ') : prev.skills,
            experience: checkedAI.experience ? aiResult.experience : prev.experience,
            education: checkedAI.education ? aiResult.education : prev.education,
        }));
    };

    return (
        <div className="cv-page">
            <div className="cv-layout">

                {/* ================= LEFT: MANUAL CV ================= */}
                <div className="cv-left">
                    <h2>CV thủ công</h2>

                    <label>Chức danh</label>
                    <input
                        value={manualCV.title}
                        onChange={(e) =>
                            setManualCV({ ...manualCV, title: e.target.value })
                        }
                    />

                    <label>Kỹ năng</label>
                    <textarea
                        rows={3}
                        value={manualCV.skills}
                        onChange={(e) =>
                            setManualCV({ ...manualCV, skills: e.target.value })
                        }
                    />

                    <label>Kinh nghiệm</label>
                    <textarea
                        rows={4}
                        value={manualCV.experience}
                        onChange={(e) =>
                            setManualCV({ ...manualCV, experience: e.target.value })
                        }
                    />

                    <label>Học vấn</label>
                    <textarea
                        rows={3}
                        value={manualCV.education}
                        onChange={(e) =>
                            setManualCV({ ...manualCV, education: e.target.value })
                        }
                    />

                    <button className="btn-primary">Lưu CV</button>
                </div>

                {/* ================= RIGHT: AI ================= */}
                <div className="cv-right">

                    {status === 'idle' && (
                        <label
                            className="upload-box"
                            onClick={() => setStatus('processing')}
                        >
                            <FileText size={40} />
                            <h3>Tải CV để AI quét</h3>
                            <p>PDF / DOCX / JPG / PNG</p>
                        </label>
                    )}

                    {status === 'processing' && (
                        <div className="scan-box">
                            <div className="scan-preview">
                                <div className="scan-line" />
                            </div>
                            <div className="scan-info">
                                <Wand2 size={16} />
                                AI đang phân tích CV... {progress}%
                            </div>
                        </div>
                    )}

                    {status === 'done' && aiResult && (
                        <div className="ai-result">
                            <h3>
                                <CheckCircle size={18} /> Kết quả AI quét
                            </h3>

                            {Object.entries(aiResult).map(([key, value]) => (
                                <label key={key} className="ai-item">
                                    <input
                                        type="checkbox"
                                        checked={checkedAI[key]}
                                        onChange={() =>
                                            setCheckedAI({
                                                ...checkedAI,
                                                [key]: !checkedAI[key],
                                            })
                                        }
                                    />
                                    <div>
                                        <strong>{key}</strong>
                                        <p>
                                            {Array.isArray(value)
                                                ? value.join(', ')
                                                : value}
                                        </p>
                                    </div>
                                </label>
                            ))}

                            <button className="btn-primary" onClick={applyAIData}>
                                Áp dụng dữ liệu AI
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
