import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner'; 
import { useNavigate } from 'react-router-dom'; 
import jobService from '../../services/api/jobService';
import './JdList.css';
import { useAuth } from '../../context/AuthContext';

const JdList = () => {
    const { user, token } = useAuth();
    const [jdList, setJdList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJd, setSelectedJd] = useState(null);
    const navigate = useNavigate(); 

    const toastStyles = {
        warning: { borderRadius: '9px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' },
        success: { borderRadius: '9px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46' },
        error: { borderRadius: '9px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }
    };

    const handGetJdList = async () => {
        try {
            const data = await jobService.getMyJd_of_Company(token);
            setJdList(data.result);
        } catch (error) {
            toast.error("Lỗi khi tải", { description: "Không thể tải danh sách JD", style: toastStyles.error });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJd = async (e, jdId) => {
        e.stopPropagation();
        
        if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) return;

        try {
            await jobService.deleteJd(jdId); 
            setJdList(prevJdList => prevJdList.filter(jd => jd.id !== jdId));
            
            toast.success("Thành công", { description: "Xóa JD thành công!", style: toastStyles.success });
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error("Lỗi khi xóa", { description: error.response.data.message, style: toastStyles.error });
            } else {
                toast.error("Lỗi khi xóa", { description: "Không thể xóa JD", style: toastStyles.error });
            }
        }
    };

    const handleViewDetails = (e, jd) => {
        if (e) e.stopPropagation(); 
        setSelectedJd(jd);
        navigate(`/detail-jd/${jd.id}`);
    };

    const handleCreateJd = () => {
        navigate('/create-jd');
    };
  
    useEffect(() => {
        handGetJdList();
    }, [user, token]);

    return (
        <main className="jd-list-container">
            <Toaster position="top-right" />

            <div className="jd-header-container">
                <h1 className="jd-list-title">Danh sách JD của công ty</h1>
                <button className="create-jd-button" onClick={handleCreateJd}>Tạo JD mới</button>
            </div>

            {loading && <p>Đang tải...</p>}
            {!loading && jdList.length === 0 && <p>Không có JD nào.</p>}

            {!loading && jdList.length > 0 && (
                <ul className="jd-list">
                    {jdList.map(jd => (
                        <li 
                            key={jd.id} 
                            className={`jd-item ${selectedJd?.id === jd.id ? 'selected' : ''}`} 
                            onClick={(e) => handleViewDetails(e, jd)}
                        >
                            <div className="jd-header">
                                <img src={jd.company.logoUrl} alt={`${jd.company.name} logo`} className="jd-company-logo" />
                                <div>
                                    <h2 className="jd-title">{jd.position}</h2>
                                    <p className="jd-company-name">{jd.company.name}</p>
                                </div>
                            </div>
                            <p className="jd-location">Địa điểm: {jd.location}</p>
                            <p className="jd-salary">Mức lương: {jd.salaryMin} - {jd.salaryMax} VND</p>
                            <p className="jd-description">{jd.description}</p>
                            <div className="jd-skills">
                                <h3>Kỹ năng yêu cầu:</h3>
                                <ul>
                                    {jd.skills.map((skill, index) => (
                                        <li key={index} className={skill.required ? 'required-skill' : ''}>
                                            {skill.name} {skill.required && '(Bắt buộc)'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="jd-actions">
                                <button onClick={(e) => handleViewDetails(e, jd)}>Xem thông tin</button>
                                <button onClick={(e) => handleDeleteJd(e, jd.id)}>Xóa</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
};

export default JdList;