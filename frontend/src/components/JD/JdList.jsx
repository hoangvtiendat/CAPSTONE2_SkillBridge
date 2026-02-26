import React, { useEffect, useState } from 'react';
import jdService from '../../services/api/JD';
import './JdList.css';
import { useAuth } from '../../context/AuthContext';

const JdList = () => {
    return (
        <div className="jd-list-container">
            <h2>Danh sách JD của công ty</h2>
            {/* Hiển thị danh sách JD ở đây */}
            <p>Đang tải danh sách JD...</p>
        </div>
    );
};

export default JdList;