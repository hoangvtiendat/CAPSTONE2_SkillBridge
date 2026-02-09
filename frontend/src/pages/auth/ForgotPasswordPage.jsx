import React from "react";
import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";
import Header from '../../components/home/Header';
import Sidebar from '../../components/home/Sidebar';
import Hero from '../../components/home/Hero';

import './authForm.css';
const ForgotPasswordPage = () => {
    return(
    <div className="home-page">
        <Header />
        <div className="home-container">
        <main className="card-main">
            <ForgotPasswordForm />
        </main>
        </div>
    </div>

       
    );
}


export default ForgotPasswordPage;