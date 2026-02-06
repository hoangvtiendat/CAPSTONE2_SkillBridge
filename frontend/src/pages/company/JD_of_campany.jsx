import React from "react";
import Header from '../../components/home/Header';
import Sidebar from '../../components/home/Sidebar';
import Hero from '../../components/home/Hero';
import JD_of_company from '../../components/company/JD_of_company';
const JD_of_companyPage = () => {
    return(
    <div className="home-page">
        <Header />
        <div className="home-container">
        <main className="JD_of_company-main">
            <JD_of_company />
        </main>
        </div>
    </div>

       
    );
}


export default JD_of_companyPage;