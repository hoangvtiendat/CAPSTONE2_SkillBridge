import React from "react";
import Header from '../../components/home/Header';
import Sidebar from '../../components/home/Sidebar';
import { ResetPass } from "../../components/auth/resetPass";
import './authForm.css';
const LoginPage = () => {
    return(
    <div className="home-page">
        <Header />
        <div className="home-container">
        <main className="card-main">
            <ResetPass />
        </main>
        </div>
    </div>

       
    );
}


export default LoginPage;