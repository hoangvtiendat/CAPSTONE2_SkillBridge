import React from "react";
import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";
import Sidebar from '../../components/home/Sidebar';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
    return (
        <div className="home-page">
            {/* Header removed to avoid duplication with App.jsx */}
            <div className="home-container">
                <Sidebar />
                <main className="ForgotPassword-main">
                    <ForgotPasswordForm />
                </main>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;