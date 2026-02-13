import React from "react";
import { LoginForm } from "../../components/auth/LoginForm";
import Header from '../../components/home/Header';

import './authForm.css';
const LoginPage = () => {
    return (
        <div className="home-page">

            <div className="home-container">
                <main className="card-main">
                    <LoginForm />
                </main>
            </div>
        </div>


    );
}


export default LoginPage;