import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faMoneyBillWave, faBriefcase, faBuilding } from "@fortawesome/free-solid-svg-icons";
import { Plus, Trash2, X } from 'lucide-react';

import jobService from '../../services/api/jobService';
import skillService from '../../services/api/skillService';
import categoryJDService from '../../services/api/categoryJD';

import './DetailJD.css';

const toastStyles = {
    warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
    success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
    error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
};

const DetailJD = () => {
    const { id } = useParams();
    const [jdDetail, setJdDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dynamicTitles, setDynamicTitles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editForm, setEditForm] = useState(null);

    const fetchJdDetail = useCallback(async () => {
        try {
            const response = await jobService.getDetailJd(id);
            setJdDetail(response.result);
            setLoading(false);
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết JD', { style: toastStyles.error });
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchJdDetail();
        const getCategories = async () => {
            const res = await categoryJDService.getListCategories();
            setCategories(res?.data || []);
        };
        getCategories();
    }, [id, fetchJdDetail]);

    // Hàm biến văn bản thô thành các dòng Liquid Glass
    const renderFormattedText = (text) => {
        if (!text) return null;
        // Tách theo dấu chấm, dấu gạch đầu dòng, dấu bullet hoặc xuống dòng
        const lines = text.split(/[.|\n|•|*]/).filter(line => line.trim().length > 3);

        return (
            <div className="text-content-wrapper">
                {lines.map((line, index) => (
                    <div key={index} className="text-line">
                        <span className="line-bullet"></span>
                        <p className="line-text">{line.trim()}</p>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="detail-view-container">
            <Toaster position="top-right" />

            <header className="detail-header-card">
                <div className="header-company-info">
                    <img src={jdDetail.company?.logoUrl || "https://via.placeholder.com/80"} alt="Logo" className="company-logo-large" />
                    <div className="header-text-block">
                        <h1 className="job-title-large">{jdDetail.position}</h1>
                        <p className="company-name-large">
                            <FontAwesomeIcon icon={faBuilding} /> {jdDetail.company?.name}
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <span className={`status-badge-modern status-${jdDetail.status?.toLowerCase()}`}>
                        {jdDetail.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Chỉnh sửa JD</button>
                </div>
            </header>

            <div className="jd-board-layout">
                <div className="layout-main-column">
                    <section className="content-card">
                        <h3 className="card-title">Mô tả công việc</h3>
                        {renderFormattedText(jdDetail.description)}

                        {jdDetail.title && Object.entries(jdDetail.title).map(([key, value], index) => (
                            <div key={index} className="dynamic-section-view">
                                <h3 className="card-title-sm">{key}</h3>
                                {renderFormattedText(value)}
                            </div>
                        ))}
                    </section>
                </div>

                <div className="layout-sidebar">
                    <section className="sidebar-card content-card">
                        <h3 className="card-title">Thông tin chung</h3>
                        <div className="info-item-modern">
                            <div className="icon-box blue"><FontAwesomeIcon icon={faMapMarkerAlt} /></div>
                            <div>
                                <span className="info-label">Địa điểm</span>
                                <span className="info-value">{jdDetail.location}</span>
                            </div>
                        </div>
                        <div className="info-item-modern">
                            <div className="icon-box green"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
                            <div>
                                <span className="info-label">Mức lương</span>
                                <span className="info-value highlight">
                                    {Number(jdDetail.salaryMin).toLocaleString()} - {Number(jdDetail.salaryMax).toLocaleString()} VND
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="sidebar-card content-card">
                        <h3 className="card-title">Kỹ năng</h3>
                        <div className="skills-tags-container">
                            {jdDetail.skills?.map((skill, i) => (
                                <span key={i} className={`skill-tag-modern ${skill.required ? 'required' : ''}`}>
                                    {skill.name} {skill.required && "*"}
                                </span>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DetailJD;