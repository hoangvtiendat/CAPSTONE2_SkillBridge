import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faMoneyBillWave, faBriefcase, faCalendarDays, faCalendarCheck } from "@fortawesome/free-solid-svg-icons";
import { format, parse } from 'date-fns';

const parseBackendDateTimeToInput = (value) => {
    if (!value) return '';
    const text = String(value).trim();
    const parsed = parse(text, 'dd/MM/yyyy HH:mm:ss', new Date());
    if (!Number.isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd');

    const directDate = new Date(text);
    if (!Number.isNaN(directDate.getTime())) return format(directDate, 'yyyy-MM-dd');

    return '';
};

const formatDisplayDate = (value) => {
    const inputDate = parseBackendDateTimeToInput(value);
    if (!inputDate) return '';
    const [year, month, day] = inputDate.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const JDInfoCard = ({ jdDetail }) => {
    if (!jdDetail) return null;

    return (
        <>
            <section className="form-card sidebar-card">
                <h3 className="card-title">Thông tin chung</h3>
                <div className="info-list">
                    <div className="info-item-modern">
                        <div className="icon-box"><FontAwesomeIcon icon={faMapMarkerAlt} /></div>
                        <div>
                            <span className="info-label">Địa điểm</span>
                            <span className="info-value">{jdDetail.location || 'Chưa có'}</span>
                        </div>
                    </div>
                    <div className="info-item-modern">
                        <div className="icon-box green"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
                        <div>
                            <span className="info-label">Mức lương</span>
                            <span className="info-value highlight">
                                {Number(jdDetail.salaryMin || 0).toLocaleString()} - {Number(jdDetail.salaryMax || 0).toLocaleString()} VND
                            </span>
                        </div>
                    </div>
                    <div className="info-item-modern">
                        <div className="icon-box blue"><FontAwesomeIcon icon={faBriefcase} /></div>
                        <div>
                            <span className="info-label">Danh mục</span>
                            <span className="info-value">{jdDetail.category?.name || jdDetail.category?.categoryName || 'Chưa có'}</span>
                        </div>
                    </div>
                    <div className="info-item-modern">
                        <div className="icon-box"><FontAwesomeIcon icon={faCalendarDays} /></div>
                        <div>
                            <span className="info-label">Ngày bắt đầu</span>
                            <span className="info-value">{formatDisplayDate(jdDetail.startDate) || 'Chưa có'}</span>
                        </div>
                    </div>
                    <div className="info-item-modern">
                        <div className="icon-box green"><FontAwesomeIcon icon={faCalendarCheck} /></div>
                        <div>
                            <span className="info-label">Ngày kết thúc</span>
                            <span className="info-value">{formatDisplayDate(jdDetail.endDate) || 'Chưa có'}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="form-card sidebar-card">
                <h3 className="card-title">Kỹ năng yêu cầu</h3>
                <div className="skills-tags-container">
                    {Array.isArray(jdDetail.skills) && jdDetail.skills.length > 0 ? (
                        jdDetail.skills.map((skill, index) => (
                            <span key={index} className={`skill-tag-modern ${skill.required || skill.isRequired ? 'required' : ''}`}>
                                {skill.name || skill.skillName || skill.title}
                                {(skill.required || skill.isRequired) && <span className="star-req">*</span>}
                            </span>
                        ))
                    ) : (
                        <p className="empty-text">Chưa có kỹ năng</p>
                    )}
                </div>
            </section>
        </>
    );
};

export default JDInfoCard;
