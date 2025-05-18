import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { backendUrl } from '../App';

const AdminChatBot = ({ token }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const location = useLocation();
    const messagesEndRef = useRef(null);

    // Initialize with welcome message
    useEffect(() => {
        setMessages([
            {
                sender: 'bot',
                text: 'Hello admin! How can I assist you with the admin panel today?',
                time: new Date()
            }
        ]);
    }, []);

    // Pages where the admin chatbot should be available
    const allowedPages = [
        '/',
        '/dashboard',
        '/list',
        '/add',
        '/edit',
        '/category',
        '/orders',
        '/profile',
        '/admin-management',
        '/sales',
        '/return-requests',
        '/return-analysis',
        '/user-activity-report'
    ];

    // Function to format message text with line breaks and clickable links
    const formatMessageText = (text) => {
        if (!text) return '';

        // First, handle line breaks
        const withLineBreaks = text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i !== text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));

        return withLineBreaks;
    };

    // Auto-scroll to latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Scroll to bottom when messages change
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Scroll to bottom when chat is opened
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen]);

    // Check if current page should display chatbot
    const shouldDisplayChatbot = () => {
        return allowedPages.some(page => {
            if (page === '/' && location.pathname === '/') return true;
            if (page !== '/') return location.pathname.includes(page);
            return false;
        });
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
    };

    const sendMessage = async () => {
        if (!inputMessage.trim()) return;

        const newUserMessage = {
            sender: 'user',
            text: inputMessage,
            time: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Get contextual response based on current page
            let pageContext;

            if (location.pathname === '/') pageContext = 'login';
            else if (location.pathname.includes('/dashboard')) pageContext = 'admin_dashboard';
            else if (location.pathname.includes('/orders')) pageContext = 'admin_orders';
            else if (location.pathname.includes('/list')) pageContext = 'admin_products';
            else if (location.pathname.includes('/add')) pageContext = 'admin_add_product';
            else if (location.pathname.includes('/edit')) pageContext = 'admin_edit_product';
            else if (location.pathname.includes('/category')) pageContext = 'admin_categories';
            else if (location.pathname.includes('/admin-management')) pageContext = 'admin_management';
            else if (location.pathname.includes('/profile')) pageContext = 'admin_profile';
            else if (location.pathname.includes('/user-activity-report')) pageContext = 'admin_user_activity';
            else if (location.pathname.includes('/sales')) pageContext = 'admin_sales_report';
            else if (location.pathname.includes('/return-requests')) pageContext = 'admin_returns';
            else if (location.pathname.includes('/return-analysis')) pageContext = 'admin_return_analysis';
            else pageContext = 'admin_general';

            // Send message to backend for processing
            const response = await axios.post(`${backendUrl}/api/chatbot/admin/message`, {
                message: inputMessage,
                pageContext
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const botResponse = {
                sender: 'bot',
                text: response.data.reply || "I'm sorry, I couldn't process your request. Please try again.",
                time: new Date()
            };

            // Simulate typing delay for more natural interaction
            setTimeout(() => {
                setMessages(prev => [...prev, botResponse]);
                setIsTyping(false);
            }, 600);

        } catch (error) {
            console.error('Error getting admin chatbot response:', error);

            // Provide fallback response on error
            const errorMessage = {
                sender: 'bot',
                text: "Sorry, I'm having trouble connecting. Please try again later.",
                time: new Date()
            };

            setTimeout(() => {
                setMessages(prev => [...prev, errorMessage]);
                setIsTyping(false);
            }, 600);
        }
    };

    // Handle pressing Enter to send message
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    if (!shouldDisplayChatbot()) return null;

    return (
        <div className="admin-chatbot-container">
            {/* Chat Toggle Button */}
            <button
                className="chat-toggle-btn"
                onClick={toggleChat}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>Admin Support</h3>
                    </div>
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <div className="message-content">
                                    {formatMessageText(msg.text)}
                                </div>
                                <div className="message-time">
                                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message bot">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={inputMessage}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                        />
                        <button onClick={sendMessage}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <style>
                {`
                    .admin-chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.chat-toggle-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3f51b5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-toggle-btn:hover {
  background-color: #303f9f;
  transform: scale(1.05);
}

.chat-window {
  width: 320px;
  height: 400px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.chat-header {
  background-color: #3f51b5;
  color: white;
  padding: 15px;
  display: flex;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
}

.message {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 15px;
  margin-bottom: 5px;
  position: relative;
  word-break: break-word;
}

.message.bot {
  align-self: flex-start;
  background-color: #f1f1f1;
  border-bottom-left-radius: 5px;
}

.message.user {
  align-self: flex-end;
  background-color: #e3f2fd;
  border-bottom-right-radius: 5px;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
}

.message-content a {
  color: #0078d7;
  text-decoration: underline;
}

.message-time {
  font-size: 10px;
  color: #999;
  margin-top: 5px;
  text-align: right;
}

.chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.chat-input button {
  background-color: #3f51b5;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-left: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-input button:hover {
  background-color: #303f9f;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 10px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #999;
  border-radius: 50%;
  display: inline-block;
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .chat-window {
    width: 280px;
    height: 350px;
    bottom: 70px;
  }
}
                `}
            </style>
        </div>
    );
};

export default AdminChatBot;