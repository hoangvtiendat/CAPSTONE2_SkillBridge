import React from "react";
import { LoginForm } from "../../components/auth/LoginForm";
import Header from '../../components/home/Header';
import Sidebar from '../../components/home/Sidebar';

import './LoginPage.css';
const LoginPage = () => {
    return(
    <div className="home-page">
        <Header />
        <div className="home-container">
        <main className="Login-main">
            <LoginForm />
        </main>
        </div>
    </div>

       
    );
}


export default LoginPage;