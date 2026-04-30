import {Link, useLocation, useNavigate} from 'react-router-dom';
import './Sidebar.css';
import {useAuth} from '../../context/AuthContext';
import React, {useState, useEffect} from 'react';
// Import Component Portal đúng theo đường dẫn từ Header cũ
import InvitationsPortal from '../../pages/candidate/InvitationsPortal';
import axios from 'axios';

const API_BASE_URL = "http://localhost:8081/identity";

const Sidebar = ({onScrollToSection}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const {user} = useAuth();
    const [invitationCount, setInvitationCount] = useState(0);
    // State quản lý việc mở modal chuyển từ Header sang
    const [isPortalOpen, setIsPortalOpen] = useState(false);

    const handleInternalLink = (e, sectionId) => {
        e.preventDefault();

        if (location.pathname === '/') {
            if (onScrollToSection) {
                onScrollToSection(sectionId);
            }
        } else {
            navigate(`/#${sectionId}`);
        }
    };
    useEffect(() => {
        const fetchAndCountInvitations = async () => {
            // Chỉ gọi API nếu user đã đăng nhập
            if (user) {
                try {
                    const token = localStorage.getItem('accessToken');

                    const response = await axios.get(
                        'http://localhost:8081/identity/candidates/my-invitations',
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    let invitations = [];

                    if (Array.isArray(response.data)) {
                        invitations = response.data;
                    } else if (response.data.result && Array.isArray(response.data.result)) {
                        invitations = response.data.result;
                    }

                    // 🔥 FILTER CHỈ LẤY CÒN HẠN
                    const now = new Date();

                    const validInvitations = invitations.filter(invitation => {
                        if (!invitation.expiresAt) return false;

                        const expireTime = new Date(invitation.expiresAt);
                        console.log("expireTime: ", expireTime, "\nnow: ", now)
                        return expireTime > now;
                    });
                    console.log("validInvitations.length: ", validInvitations.length)
                    setInvitationCount(validInvitations.length);
                } catch (error) {
                    console.error("Lỗi khi lấy danh sách lời mời:", error);
                }
            }
        };

        fetchAndCountInvitations();
    }, [user, isPortalOpen]);

    return (
        <>
            <aside className="sidebar">
                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <h4>DANH MỤC</h4>
                        <ul>
                            <li>
                                <a
                                    href="#job-grid"
                                    className="sidebar-link"
                                    onClick={(e) => handleInternalLink(e, 'job-grid')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960"
                                         width="24px" fill="#1f1f1f">
                                        <path
                                            d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
                                    </svg>
                                    <span>Tìm kiếm công việc</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#company-grid"
                                    className="sidebar-link"
                                    onClick={(e) => handleInternalLink(e, 'company-grid')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960"
                                         width="24px" fill="#1f1f1f">
                                        <path
                                            d="M120-120v-560h160v-160h400v320h160v400H520v-160h-80v160H120Zm80-80h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 320h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h80v-80h-80v80Zm0-160h80v-80h-80v80Z"/>
                                    </svg>
                                    <span>Tìm kiếm công ty</span>
                                </a>
                            </li>

                            {user && (
                                <>
                                    <li>
                                        <Link to="/my-applied-jobs" className="sidebar-link">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px"
                                                 viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                                                <path
                                                    d="m691-150 139-138-42-42-97 95-39-39-42 43 81 81ZM240-600h480v-80H240v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM120-80v-680q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v267q-19-9-39-15t-41-9v-243H200v562h243q5 31 15.5 59T486-86l-6 6-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60-60-60-60 60Zm120-200h203q3-21 9-41t15-39H240v80Zm0-160h284q38-37 88.5-58.5T720-520H240v80Zm-40 242v-562 562Z"/>
                                            </svg>
                                            <span>Công việc đã ứng tuyển</span>
                                        </Link>
                                    </li>
                                    <li>
                                        {/* Ép Flexbox trực tiếp để cố định layout từ ban đầu */}
                                        <a
                                            href="#invitations"
                                            className="sidebar-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsPortalOpen(true);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                                position: 'relative'
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px"
                                                 viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                                                <path
                                                    d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/>
                                            </svg>

                                            <span style={{
                                                flex: 1,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
            Lời mời của tôi
        </span>

                                            {invitationCount > 0 && (
                                                <span className="badge-count" style={{
                                                    backgroundColor: '#ff4d4f',
                                                    color: 'white',
                                                    borderRadius: '10px',
                                                    padding: '2px 6px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    lineHeight: '1.2',
                                                    minWidth: '18px',
                                                    textAlign: 'center',
                                                    marginLeft: '8px',
                                                    display: 'inline-block',
                                                    height: '20px'
                                                }}>
                {invitationCount}
            </span>
                                            )}
                                        </a>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h4>DÀNH CHO NHÀ TUYỂN DỤNG</h4>
                        <ul>
                            <li>
                                <Link to="/recruiter/identity" className="sidebar-link">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960"
                                         width="24px" fill="#1f1f1f">
                                        <path
                                            d="M480-400ZM80-160v-400q0-33 23.5-56.5T160-640h120v-80q0-33 23.5-56.5T360-800h240q33 0 56.5 23.5T680-720v80h120q33 0 56.5 23.5T880-560v400H80Zm240-200v40h-80v-40h-80v120h640v-120h-80v40h-80v-40H320ZM160-560v120h80v-40h80v40h320v-40h80v40h80v-120H160Zm200-80h240v-80H360v80Z"/>
                                    </svg>
                                    <span>Đăng ký doanh nghiệp</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>
            </aside>

            {/* Cổng hiển thị Lời mời (Chạy độc lập bên ngoài thẻ aside) */}
            <InvitationsPortal
                isOpen={isPortalOpen}
                onClose={() => setIsPortalOpen(false)}
            />
        </>
    );
};

export default Sidebar;