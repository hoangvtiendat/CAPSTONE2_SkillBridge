import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faMoneyBillWave, faBriefcase, faBuilding } from "@fortawesome/free-solid-svg-icons";
import { Plus, Search, Trash2, X } from 'lucide-react';

import jobService from '../../services/api/jobService';
import skillService from '../../services/api/skillService';
import categoryJDService from '../../services/api/categoryJD';
import applicationService from '../../services/api/applicationService';

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
    const [isUpdating, setIsUpdating] = useState(false);
    const [hasAppliedCandidate, setHasAppliedCandidate] = useState(false);

    const [editForm, setEditForm] = useState(null);
    const [dynamicTitles, setDynamicTitles] = useState([]);
    const [initialFormState, setInitialFormState] = useState(null);

    const [categories, setCategories] = useState([]);
    const [skillsList, setSkillsList] = useState([]);
    const [skillSearchTerm, setSkillSearchTerm] = useState("");

    /* ================= FETCH ================= */
    const fetchJdDetail = useCallback(async () => {
        try {
            const res = await jobService.getDetailJd(id);
            setJdDetail(res.result);
        } catch {
            toast.error('Lỗi khi tải JD', { style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    }, [id]);

    const checkAppliedStatus = useCallback(async () => {
        try {
            const res = await applicationService.CheckApplied(id);
            setHasAppliedCandidate(Boolean(res?.result || res === true));
        } catch {
            setHasAppliedCandidate(false);
        }
    }, [id]);

    useEffect(() => {
        fetchJdDetail();
        checkAppliedStatus();
        categoryJDService.getListCategories().then(res => {
            setCategories(res?.data || []);
        });
    }, [id, fetchJdDetail, checkAppliedStatus]);

    useEffect(() => {
        if (!editForm?.categoryId) return;
        skillService.getListSkillsOfCategory(editForm.categoryId)
            .then(res => setSkillsList(res?.data || res?.result || []))
            .catch(() => toast.error("Lỗi tải kỹ năng"));
    }, [editForm?.categoryId]);

    /* ================= TEXT FORMAT ================= */
    const renderFormattedText = (text) => {
        if (!text) return null;
        const lines = text.split(/[.\n•*]/).filter(l => l.trim().length > 3);

        return (
            <div className="text-content-wrapper">
                {lines.map((line, i) => (
                    <div key={i} className="text-line">
                        <span className="line-bullet"></span>
                        <p className="line-text">{line.trim()}</p>
                    </div>
                ))}
            </div>
        );
    };

    /* ================= MODAL ================= */
    const handleOpenModal = () => {
        if (hasAppliedCandidate) {
            toast.warning("Không thể sửa JD");
            return;
        }

        const titles = jdDetail.title
            ? Object.entries(jdDetail.title).map(([k, v]) => ({ key: k, value: v }))
            : [{ key: "Quyền lợi", value: "" }];

        const form = {
            categoryId: jdDetail.category?.id || "",
            position: jdDetail.position || "",
            description: jdDetail.description || "",
            location: jdDetail.location || "",
            salaryMin: jdDetail.salaryMin || "",
            salaryMax: jdDetail.salaryMax || "",
            skills: jdDetail.skills || []
        };

        setDynamicTitles(titles);
        setEditForm(form);
        setInitialFormState({ form, titles });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditForm(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();

        if (Number(editForm.salaryMax) < Number(editForm.salaryMin)) {
            toast.error("Sai lương");
            return;
        }

        const titleObj = {};
        dynamicTitles.forEach(t => titleObj[t.key] = t.value);

        try {
            setIsUpdating(true);
            await jobService.updateJd(jdDetail.id, {
                ...editForm,
                title: titleObj
            });

            toast.success("Đã cập nhật");
            fetchJdDetail();
            handleCloseModal();
        } catch {
            toast.error("Lỗi update");
        } finally {
            setIsUpdating(false);
        }
    };

    /* ================= RENDER ================= */
    if (loading) return <div className="spinner"></div>;
    if (!jdDetail) return <div>Không có dữ liệu</div>;

    return (
        <div className="detail-view-container">
            <Toaster />

            {/* HEADER */}
            <header className="detail-header-card">
                <div className="header-company-info">
                    <img src={jdDetail.company?.logoUrl} className="company-logo-large" />
                    <div>
                        <h1 className="job-title-large">{jdDetail.position}</h1>
                        <p className="company-name-large">
                            <FontAwesomeIcon icon={faBuilding} /> {jdDetail.company?.name}
                        </p>
                    </div>
                </div>

                <button className="btn-primary" onClick={handleOpenModal}>
                    Chỉnh sửa JD
                </button>
            </header>

            {/* CONTENT */}
            <div className="jd-board-layout">
                <div>
                    <section className="content-card">
                        <h3 className="card-title">Mô tả</h3>
                        {renderFormattedText(jdDetail.description)}

                        {jdDetail.title && Object.entries(jdDetail.title).map(([k, v], i) => (
                            <div key={i}>
                                <h3 className="card-title-sm">{k}</h3>
                                {renderFormattedText(v)}
                            </div>
                        ))}
                    </section>
                </div>

                <div>
                    <section className="content-card">
                        <h3 className="card-title">Thông tin</h3>

                        <div className="info-item-modern">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            {jdDetail.location}
                        </div>

                        <div className="info-item-modern">
                            <FontAwesomeIcon icon={faMoneyBillWave} />
                            {jdDetail.salaryMin} - {jdDetail.salaryMax}
                        </div>
                    </section>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="modal-overlay-modern">
                    <div className="modal-container-modern">
                        <div className="modal-header-modern">
                            <h2>Edit JD</h2>
                            <button onClick={handleCloseModal}><X /></button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="modal-body-scroll">
                            <input name="position" value={editForm.position} onChange={handleChange} />

                            {dynamicTitles.map((t, i) => (
                                <div key={i}>
                                    <input value={t.key} onChange={e => {
                                        const arr = [...dynamicTitles];
                                        arr[i].key = e.target.value;
                                        setDynamicTitles(arr);
                                    }} />
                                    <textarea value={t.value} onChange={e => {
                                        const arr = [...dynamicTitles];
                                        arr[i].value = e.target.value;
                                        setDynamicTitles(arr);
                                    }} />
                                </div>
                            ))}

                            <button type="submit" disabled={isUpdating}>
                                {isUpdating ? "Saving..." : "Save"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailJD;