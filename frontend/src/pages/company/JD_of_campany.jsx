import React from "react";
import Header from '../../components/home/Header';
import Sidebar from '../../components/home/Sidebar';
import Hero from '../../components/home/Hero';
import JD_of_company from '../../components/company/JD_of_company';
import Stats from '../../components/home/Stats';
import CTA from '../../components/home/CTA';
import Footer from '../../components/home/Footer';
const JD_of_companyPage = () => {


      return (
    <div className="home-page">
      <Header />
      
      <div className="home-container">
        <Sidebar />
        
        <main className="JD_of_company-main">
           <JD_of_company />
        </main>
      </div>
   
    </div>
  );
}


export default JD_of_companyPage;