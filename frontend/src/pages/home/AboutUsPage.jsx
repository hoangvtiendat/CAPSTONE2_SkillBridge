import React from 'react';
import { Target, Lightbulb, Users, Briefcase, TrendingUp, Award, Zap, Shield, Globe, BarChart, Server, Binary } from 'lucide-react';
import './AboutUsPage.css';

const AboutUsPage = () => {
    return (
        <div className="about-us-container">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-content">
                    <h1>Cách mạng <span className="text-highlight">Kết nối</span> Sự nghiệp</h1>
                    <p>
                        SkillBridge là một nền tảng được hỗ trợ bởi AI biến đổi cách các ứng viên và nhà tuyển dụng kết nối.
                        Chúng tôi sử dụng công nghệ tiên tiến để kết nối những người phù hợp với các cơ hội phù hợp.
                    </p>
                </div>

                <div className="mission-vision-wrapper">
                    <div className="mv-card mission-card">
                        <div className="mv-header">
                            <Target size={24} className="mv-icon" />
                            <h3>Sứ mệnh của chúng tôi</h3>
                        </div>
                        <p>
                            Trao quyền cho người tìm kiếm việc làm và nhà tuyển dụng bằng cách cung cấp các kết nối sự nghiệp thông minh, hiệu quả và minh bạch được hỗ trợ bởi trí tuệ nhân tạo tiên tiến.
                        </p>
                        <ul className="mv-list">
                            <li>Làm cho các kết nối sự nghiệp chính xác hơn và có ý nghĩa hơn</li>
                            <li>Giảm thời gian tuyển dụng và ma sát tìm kiếm việc làm</li>
                            <li>Xây dựng niềm tin thông qua tính minh bạch và bảo mật dữ liệu</li>
                        </ul>
                    </div>

                    <div className="mv-card vision-card">
                        <div className="mv-header">
                            <Lightbulb size={24} className="mv-icon" />
                            <h3>Tầm nhìn của chúng tôi</h3>
                        </div>
                        <p>
                            Trở thành nền tảng sự nghiệp được hỗ trợ bởi AI đáng tin cậy nhất trên thế giới, nơi mọi chuyên gia tìm thấy vai trò lý tưởng và mọi nhà tuyển dụng khám phá nhân tài lực lượng.
                        </p>
                        <ul className="mv-list">
                            <li>Phạm vi toàn cầu với mức độ liên quan địa phương</li>
                            <li>Cơ hội toàn diện cho tất cả các mức kỹ năng</li>
                            <li>Đổi mới liên tục trong các thuật toán kết nối AI</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="about-stats-section">
                <h2>Theo Những Con Số</h2>
                <p className="section-subtitle">Các số liệu tăng trưởng và tác động ấn tượng</p>

                <div className="stats-grid">
                    <div className="stat-card">
                        <Users size={32} className="stat-icon icon-blue" />
                        <h3>50K+</h3>
                        <p>Người dùng tích cực</p>
                    </div>
                    <div className="stat-card">
                        <Briefcase size={32} className="stat-icon icon-purple" />
                        <h3>15K+</h3>
                        <p>Công việc đã đăng</p>
                    </div>
                    <div className="stat-card">
                        <TrendingUp size={32} className="stat-icon icon-green" />
                        <h3>10K+</h3>
                        <p>Vị trí tuyển dụng thành công</p>
                    </div>
                    <div className="stat-card">
                        <Award size={32} className="stat-icon icon-orange" />
                        <h3>95%</h3>
                        <p>Độ chính xác kết nối</p>
                    </div>
                </div>
            </section>

            {/* Platform Highlights */}
            <section className="about-features-section">
                <h2>Điểm nổi bật của nền tảng</h2>
                <p className="section-subtitle">Các tính năng nâng cao tạo ra sự khác biệt</p>

                <div className="features-grid">
                    <div className="feature-card">
                        <Zap size={28} className="feature-icon" />
                        <h3>Trình phân tích CV bằng AI</h3>
                        <p>Tự động trích xuất kỹ năng, kinh nghiệm và bằng cấp từ sơ yếu lý lịch trong vài giây.</p>
                        <div className="feature-tags">
                            <span>Trích xuất tức thời</span>
                            <span>Độ chính xác cao</span>
                            <span>Hỗ trợ đa định dạng</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <Binary size={28} className="feature-icon" />
                        <h3>Kết nối công việc thông minh</h3>
                        <p>Các thuật toán máy học khớp các ứng viên với những công việc hoàn hảo dựa trên kỹ năng.</p>
                        <div className="feature-tags">
                            <span>Độ chính xác 95%</span>
                            <span>Tính điểm thực thời</span>
                            <span>Học liên tục</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <Shield size={28} className="feature-icon" />
                        <h3>Nền tảng an toàn</h3>
                        <p>Bảo mật cấp độ doanh nghiệp với mã hóa và tuân thủ các tiêu chuẩn quốc tế.</p>
                        <div className="feature-tags">
                            <span>Mã hóa SSL</span>
                            <span>Tuân thủ GDPR</span>
                            <span>Kiểm tra định kỳ</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <Globe size={28} className="feature-icon" />
                        <h3>Phạm vi toàn cầu</h3>
                        <p>Kết nối với cơ hội và nhân tài từ khắp thế giới bằng ngôn ngữ ưu tiên của bạn.</p>
                        <div className="feature-tags">
                            <span>Đa ngôn ngữ</span>
                            <span>180+ quốc gia</span>
                            <span>Chuyên môn địa phương</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <BarChart size={28} className="feature-icon" />
                        <h3>Bảng điều khiển phân tích</h3>
                        <p>Những hiểu biết chi tiết về xu hướng thị trường việc làm, mô hình tuyển dụng và cơ hội phát triển.</p>
                        <div className="feature-tags">
                            <span>Dữ liệu thực thời</span>
                            <span>Báo cáo tùy chỉnh</span>
                            <span>Phân tích dự đoán</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack & Core Values */}
            <section className="about-tech-values-section">
                <div className="tech-stack-container">
                    <h2>Công nghệ được sử dụng</h2>
                    <p className="section-subtitle">Xây dựng với các công nghệ hiện đại và có khả năng mở rộng</p>

                    <div className="tech-grid">
                        <div className="tech-column">
                            <h4>Frontend</h4>
                            <ul>
                                <li><span>✓</span> React 19</li>
                                <li><span>✓</span> Next.js 15</li>
                                <li><span>✓</span> TypeScript</li>
                                <li><span>✓</span> Tailwind CSS</li>
                            </ul>
                        </div>
                        <div className="tech-column">
                            <h4>Backend</h4>
                            <ul>
                                <li><span>✓</span> Java</li>
                                <li><span>✓</span> PostgreSQL</li>
                                <li><span>✓</span> RESTful APIs</li>
                                <li><span>✓</span> Microservices</li>
                            </ul>
                        </div>
                        <div className="tech-column">
                            <h4>AI/ML</h4>
                            <ul>
                                <li><span>✓</span> Google Gemini LLM</li>
                                <li><span>✓</span> NLP Processing</li>
                                <li><span>✓</span> Skill Matching</li>
                                <li><span>✓</span> Resume Parsing</li>
                            </ul>
                        </div>
                        <div className="tech-column">
                            <h4>Infrastructure</h4>
                            <ul>
                                <li><span>✓</span> AWS Cloud</li>
                                <li><span>✓</span> Docker</li>
                                <li><span>✓</span> Vercel Deploy</li>
                                <li><span>✓</span> Database Optimization</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="core-values-container">
                    <h2>Các giá trị cốt lõi của chúng tôi</h2>
                    <p className="section-subtitle">Điều thúc đẩy chúng tôi tiến về phía trước</p>

                    <div className="values-grid">
                        <div className="value-card">
                            <Lightbulb size={24} className="value-icon" />
                            <h4>Đổi mới</h4>
                            <p>Chúng tôi liên tục đầu tư vào AI và máy học để cải thiện độ chính xác kết nối và trải nghiệm người dùng.</p>
                        </div>
                        <div className="value-card">
                            <Globe size={24} className="value-icon" />
                            <h4>Minh bạch</h4>
                            <p>Giao tiếp rõ ràng và các thuật toán trung thực cho thấy cách và lý do các kết nối được thực hiện.</p>
                        </div>
                        <div className="value-card">
                            <Users size={24} className="value-icon" />
                            <h4>Tính toàn diện</h4>
                            <p>Tạo cơ hội bình đẳng cho các chuyên gia từ mọi nền tảng và mức độ kinh nghiệm.</p>
                        </div>
                        <div className="value-card">
                            <Shield size={24} className="value-icon" />
                            <h4>Bảo mật</h4>
                            <p>Bảo vệ dữ liệu người dùng bằng bảo mật cấp độ doanh nghiệp và duy trì các tiêu chuẩn quyền riêng tư cao nhất.</p>
                        </div>
                        <div className="value-card">
                            <Award size={24} className="value-icon" />
                            <h4>Xuất sắc</h4>
                            <p>Cam kết cung cấp dịch vụ tốt nhất và cải tiến liên tục trong mọi điều chúng tôi làm.</p>
                        </div>
                        <div className="value-card">
                            <TrendingUp size={24} className="value-icon" />
                            <h4>Tác động</h4>
                            <p>Tạo ra những kết nối có ý nghĩa dẫn đến sự nghiệp thành công và tổ chức phát triển.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUsPage;
