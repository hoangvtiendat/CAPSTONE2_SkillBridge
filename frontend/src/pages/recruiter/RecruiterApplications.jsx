import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import applicationService from '../../services/api/applicationService';
import { Mail, GitCompare, X, Sparkles, AlertTriangle, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import { toast } from 'sonner';
import './RecruiterApplications.css';

const betterFitLabel = (code, nameFirst, nameSecond) => {
    const a = nameFirst?.trim() || 'Ứng viên thứ nhất';
    const b = nameSecond?.trim() || 'Ứng viên thứ hai';
    switch (code) {
        case 'FIRST':
            return `Phù hợp hơn: ${a}`;
        case 'SECOND':
            return `Phù hợp hơn: ${b}`;
        case 'EQUAL':
            return 'Hai ứng viên tương đương / chưa đủ cơ sở để xếp hạng rõ';
        default:
            return code || '—';
    }
};

const renderListOrEmpty = (items, emptyText) => {
    const list = (items || []).filter((t) => t && String(t).trim());
    if (!list.length) {
        return <p className="compare-tile-empty">{emptyText}</p>;
    }
    return (
        <ul className="compare-tile-ul">
            {list.map((t, i) => (
                <li key={i}>{t}</li>
            ))}
        </ul>
    );
};

const formatAiMatchPercent = (score) => {
    if (score == null || Number.isNaN(Number(score))) return '—';
    return `${Math.round(Number(score))}%`;
};

const RecruiterApplications = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [compareOpen, setCompareOpen] = useState(false);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareResult, setCompareResult] = useState(null);
    /** true = sort AI score descending (best first) */
    const [matchSortDesc, setMatchSortDesc] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await applicationService.getApplicationsByJob(jobId);
                setApplications(res.result);
            } catch (err) {
                toast.error('Không thể tải danh sách ứng viên');
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [jobId]);

    const sortedApplications = useMemo(() => {
        const arr = [...applications];
        arr.sort((a, b) => {
            const sa = Number(a.aiMatchingScore ?? 0);
            const sb = Number(b.aiMatchingScore ?? 0);
            return matchSortDesc ? sb - sa : sa - sb;
        });
        return arr;
    }, [applications, matchSortDesc]);

    const selectedApps = useMemo(() => {
        const map = new Map(applications.map((a) => [a.id, a]));
        return selectedIds.map((id) => map.get(id)).filter(Boolean);
    }, [applications, selectedIds]);

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((x) => x !== id);
            }
            if (prev.length >= 2) {
                toast.info('Chỉ có thể chọn tối đa 2 ứng viên để so sánh');
                return prev;
            }
            return [...prev, id];
        });
    };

    const runCompare = async () => {
        if (selectedIds.length !== 2) {
            toast.warning('Vui lòng chọn đúng 2 ứng viên');
            return;
        }
        setCompareOpen(true);
        setCompareLoading(true);
        setCompareResult(null);
        try {
            const res = await applicationService.compareCandidatesForJob(jobId, {
                applicationIdA: selectedIds[0],
                applicationIdB: selectedIds[1],
            });
            setCompareResult(res.result);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Không thể so sánh ứng viên';
            toast.error(msg);
            setCompareOpen(false);
        } finally {
            setCompareLoading(false);
        }
    };

    const getStatusClass = (status) => {
        if (!status) return 'status-badge';
        return `status-badge status-${status.toLowerCase()}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loader-spinner"></div>
                <p className="ml-3 text-gray-500">Đang tìm kiếm nhân tài...</p>
            </div>
        );
    }

    return (
        <div className="recruiter-apps-container">
            <h2 className="page-title">Danh sách ứng viên nộp hồ sơ</h2>

            <div className="compare-toolbar">
                <p className="compare-toolbar-hint">
                    Chọn <strong>2</strong> ứng viên rồi bấm so sánh để nhận tư vấn từ AI (Gemini).
                </p>
                <button
                    type="button"
                    className="btn-compare-ai"
                    disabled={selectedIds.length !== 2 || compareLoading}
                    onClick={runCompare}
                >
                    <GitCompare size={18} />
                    So sánh ứng viên (AI)
                </button>
            </div>

            <div className="table-card">
                <table className="apps-table">
                    <thead>
                        <tr>
                            <th className="th-select">Chọn</th>
                            <th>Ứng viên</th>
                            <th>Trạng thái</th>
                            <th>Ngày nộp</th>
                            <th
                                className="th-sortable th-ai-matching"
                                scope="col"
                                onClick={() => setMatchSortDesc((d) => !d)}
                                title="Sắp xếp theo điểm AI phù hợp với tin tuyển dụng"
                            >
                                <span className="th-sort-inner">
                                    AI Matching
                                    {matchSortDesc ? (
                                        <ArrowDownWideNarrow size={15} aria-hidden />
                                    ) : (
                                        <ArrowUpWideNarrow size={15} aria-hidden />
                                    )}
                                </span>
                            </th>
                            <th>Ghi chú</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.length > 0 ? (
                            sortedApplications.map((app) => (
                                <tr key={app.id}>
                                    <td className="td-select">
                                        <input
                                            type="checkbox"
                                            className="compare-checkbox"
                                            checked={selectedIds.includes(app.id)}
                                            onChange={() => toggleSelect(app.id)}
                                            aria-label={`Chọn ${app.fullName}`}
                                        />
                                    </td>
                                    <td>
                                        <div
                                            className="candidate-name"
                                            onClick={() =>
                                                navigate(`/recruiter/applications/${app.id}`)
                                            }
                                        >
                                            {app.fullName}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                            <Mail size={12} /> {app.email}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={getStatusClass(app.status)}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="text-sm text-gray-600">
                                        {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td>
                                        <div className="ai-score-tag">
                                            {formatAiMatchPercent(app.aiMatchingScore)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="candidate-note" title={app.note}>
                                            {app.note ? (
                                                <span className="note-text">{app.note}</span>
                                            ) : (
                                                <span className="text-slate-400 italic">
                                                    Không có ghi chú
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(`/recruiter/applications/${app.id}`)
                                            }
                                            className="btn-view-detail"
                                        >
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-10 text-gray-400">
                                    Chưa có ai nộp hồ sơ cho vị trí này.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {compareOpen && (
                <div
                    className="compare-modal-backdrop compare-lg-backdrop"
                    role="presentation"
                    onClick={() => {
                        if (!compareLoading) setCompareOpen(false);
                    }}
                >
                    <div
                        className="compare-modal compare-lg-modal"
                        role="dialog"
                        aria-labelledby="compare-modal-title"
                        aria-busy={compareLoading}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="compare-modal-header compare-lg-header">
                            <h3 id="compare-modal-title">So sánh ứng viên</h3>
                            <button
                                type="button"
                                className="compare-modal-close"
                                onClick={() => setCompareOpen(false)}
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="compare-modal-sub compare-lg-sub">
                            {selectedApps.length === 2 && (
                                <p>
                                    <strong>Thứ nhất:</strong> {selectedApps[0].fullName} ·{' '}
                                    <strong>Thứ hai:</strong> {selectedApps[1].fullName}
                                </p>
                            )}
                        </div>
                        <div className="compare-modal-body compare-lg-body">
                            {compareLoading && (
                                <div className="compare-modal-loading compare-lg-loading">
                                    <div className="loader-spinner" />
                                    <span>Đang phân tích với Gemini...</span>
                                </div>
                            )}
                            {!compareLoading && compareResult && (
                                <div className="compare-result compare-lg-result">
                                    <div className="compare-verdict compare-lg-verdict">
                                        {betterFitLabel(
                                            compareResult.betterFit,
                                            selectedApps[0]?.fullName,
                                            selectedApps[1]?.fullName
                                        )}
                                    </div>
                                    {compareResult.headline && (
                                        <h4 className="compare-headline">{compareResult.headline}</h4>
                                    )}
                                    {compareResult.comparisonSummary && (
                                        <p className="compare-summary compare-lg-summary">
                                            {compareResult.comparisonSummary}
                                        </p>
                                    )}

                                    <div className="compare-candidate-pair">
                                        <article className="compare-candidate-card">
                                            <header className="compare-candidate-card__head">
                                                <span className="compare-candidate-badge">1</span>
                                                <span className="compare-candidate-card__name">
                                                    {selectedApps[0]?.fullName || 'Ứng viên thứ nhất'}
                                                </span>
                                            </header>
                                            <div className="compare-sw-split">
                                                <section className="compare-tile compare-tile--strength">
                                                    <h5 className="compare-tile__title">
                                                        <Sparkles size={15} aria-hidden />
                                                        Điểm mạnh
                                                    </h5>
                                                    {renderListOrEmpty(
                                                        compareResult.firstCandidateHighlights,
                                                        'Chưa có điểm mạnh được AI ghi nhận.'
                                                    )}
                                                </section>
                                                <section className="compare-tile compare-tile--weak">
                                                    <h5 className="compare-tile__title">
                                                        <AlertTriangle size={15} aria-hidden />
                                                        Điểm yếu / rủi ro
                                                    </h5>
                                                    {renderListOrEmpty(
                                                        compareResult.firstCandidateWeaknesses,
                                                        'Không ghi nhận điểm yếu rõ rệt so với tin tuyển dụng.'
                                                    )}
                                                </section>
                                            </div>
                                        </article>

                                        <article className="compare-candidate-card">
                                            <header className="compare-candidate-card__head">
                                                <span className="compare-candidate-badge compare-candidate-badge--b">
                                                    2
                                                </span>
                                                <span className="compare-candidate-card__name">
                                                    {selectedApps[1]?.fullName || 'Ứng viên thứ hai'}
                                                </span>
                                            </header>
                                            <div className="compare-sw-split">
                                                <section className="compare-tile compare-tile--strength">
                                                    <h5 className="compare-tile__title">
                                                        <Sparkles size={15} aria-hidden />
                                                        Điểm mạnh
                                                    </h5>
                                                    {renderListOrEmpty(
                                                        compareResult.secondCandidateHighlights,
                                                        'Chưa có điểm mạnh được AI ghi nhận.'
                                                    )}
                                                </section>
                                                <section className="compare-tile compare-tile--weak">
                                                    <h5 className="compare-tile__title">
                                                        <AlertTriangle size={15} aria-hidden />
                                                        Điểm yếu / rủi ro
                                                    </h5>
                                                    {renderListOrEmpty(
                                                        compareResult.secondCandidateWeaknesses,
                                                        'Không ghi nhận điểm yếu rõ rệt so với tin tuyển dụng.'
                                                    )}
                                                </section>
                                            </div>
                                        </article>
                                    </div>

                                    {compareResult.hiringRecommendation && (
                                        <div className="compare-hire-rec compare-lg-hire">
                                            <h5>Gợi ý quyết định</h5>
                                            <p>{compareResult.hiringRecommendation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterApplications;
