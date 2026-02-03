import React from "react";
import Header from '../../components/home/Header';
import Sidebar from '../../components/home/Sidebar';
import Hero from '../../components/home/Hero';
import {ProfileEditor} from "../../components/candidate/ProfileEditor";
const ForgotPasswordPage = () => {
    return(
    <div className="home-page">
        <Header />
        <div className="home-container">
        <Sidebar />
        <main className="ProfileEditor-main">
            <ProfileEditor />
        </main>
        </div>
    </div>

       
    );
}


export default ForgotPasswordPage;