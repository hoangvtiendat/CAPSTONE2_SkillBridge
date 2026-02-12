import React from "react";
import { LoginForm } from "../../components/auth/LoginForm";
import Sidebar from '../../components/home/Sidebar';
import './LoginPage.css';

const LoginPage = () => {
    return (
        <div className="home-page">
            {/* Header removed: App.jsx provides global Header */}
            <div className="home-container">
                <Sidebar />
                <main className="Login-main">
                    <LoginForm />
                </main>
            </div>
        </div>
    );
}

export default LoginPage;