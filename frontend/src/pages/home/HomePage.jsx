import React from 'react';
import Header from '../../components/home/Header';
import Sidebar from '../../components/home/Sidebar';
import Hero from '../../components/home/Hero';
import JobGrid from '../../components/home/JobGrid';
import Stats from '../../components/home/Stats';
import CTA from '../../components/home/CTA';
import Footer from '../../components/home/Footer';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Header />
      
      <div className="home-container">
        <Sidebar />
        
        <main className="home-main">
          <Hero />
          <JobGrid />
        </main>
      </div>
      <CTA />
      <Stats />
      <Footer />
    </div>
  );
};

export default HomePage;
