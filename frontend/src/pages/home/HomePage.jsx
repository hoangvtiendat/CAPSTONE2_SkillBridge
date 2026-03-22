import React, { useRef, useEffect } from 'react';
import Sidebar from '../../components/home/Sidebar';
import Hero from '../../components/home/Hero';
import JobGrid from '../../components/home/JobGrid';
import CompanyGrid from '../../components/home/CompanyGrid';
import Stats from '../../components/home/Stats';
import CTA from '../../components/home/CTA';
import Footer from '../../components/home/Footer';
import './HomePage.css';
import { useLocation } from 'react-router-dom';

const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    // Nếu trong URL có hash (ví dụ #job-grid)
    if (location.hash) {
      const sectionId = location.hash.replace('#', '');
      setTimeout(() => {
        handleScrollToSection(sectionId);
      }, 200);
    }
  }, [location]);

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Offset for fixed header (approx 90px)
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="home-page">

      <div className="home-container">
        <Sidebar onScrollToSection={handleScrollToSection} />

        <main className="home-main">
          <Hero />
          <JobGrid />
          <CompanyGrid />
        </main>
      </div>
      <CTA />
      <Stats />
      <Footer />
    </div>
  );
};

export default HomePage;
