import React from "react";
import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";


import './authForm.css';
const ForgotPasswordPage = () => {
    return(
    <div className="home-page">
        <div className="home-container">
        <main className="card-main">
            <ForgotPasswordForm />
        </main>
        </div>
    </div>

       
    );
}


export default ForgotPasswordPage;