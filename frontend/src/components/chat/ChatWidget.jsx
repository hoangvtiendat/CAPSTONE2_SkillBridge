import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send } from 'lucide-react';
import api from '../../config/axiosConfig';
import './ChatWidget.css';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const quickSuggestions = [
        "Cách đăng tin tuyển dụng",
        "Quên mật khẩu",
        "Cập nhật thông tin",
        "Chức năng nổi bật?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (text) => {
        if (!text.trim()) return;

        // Thêm user message
        const newMsg = { id: Date.now(), sender: 'user', text };
        setMessages(prev => [...prev, newMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8081/identity/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ message: text })
            });

            if (!response.ok) throw new Error('Network Error');
            const data = await response.json();

            // Thêm bot message
            setMessages(prev => [
                ...prev,
                { id: Date.now() + 1, sender: 'bot', text: data.result?.answer || "Xin lỗi, tôi không thể trả lời lúc này." }
            ]);
        } catch (error) {
            console.error("Chat API Error:", error);
            setMessages(prev => [
                ...prev,
                { id: Date.now() + 1, sender: 'bot', text: "Đã xảy ra lỗi khi kết nối với máy chủ." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-widget-container">
            {/* Nút Toggle */}
            <button
                className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <X size={28} strokeWidth={2} />
                ) : (
                    <Bot size={28} color="#fff" strokeWidth={1.5} />
                )}
            </button>

            {/* Panel Chat */}
            <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-header-avatar">
                            <Bot size={28} color="#fff" strokeWidth={1.5} />
                            <span className="online-indicator"></span>
                        </div>
                        <div>
                            <h3>SkillBridge AI <Sparkles size={16} color="#fbbf24" style={{ marginBottom: '-2px' }} /></h3>
                            <p>Trợ lý ảo thông minh 24/7</p>
                        </div>
                    </div>
                    <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                            {msg.sender === 'bot' && (
                                <div className="bot-avatar">
                                    <Bot size={16} strokeWidth={2} />
                                </div>
                            )}
                            <div className={`chat-bubble ${msg.sender}`}>
                                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="chat-message-row bot">
                            <div className="bot-avatar">
                                <Bot size={16} strokeWidth={2} />
                            </div>
                            <div className="chat-bubble bot loading">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-suggestions">
                    {quickSuggestions.map((sug, idx) => (
                        <button key={idx} className="suggestion-chip" onClick={() => handleSend(sug)}>
                            {sug}
                        </button>
                    ))}
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        placeholder="Nhập câu hỏi..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                        disabled={isLoading}
                    />
                    <button onClick={() => handleSend(inputValue)} disabled={!inputValue.trim() || isLoading}>
                        <Send size={20} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
