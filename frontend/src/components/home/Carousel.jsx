import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Carousel.css';
import AppImage from '../common/AppImage';
import { DEFAULT_COMPANY_IMAGE } from '../../utils/imageUtils';

const Carousel = ({ items = [], autoSlideInterval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [transitionMode, setTransitionMode] = useState('auto');
  const resumeAutoPlayRef = useRef(null);

  useEffect(() => {
    if (!isAutoPlay || items.length === 0) return;

    const timer = setInterval(() => {
      setTransitionMode('auto');
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [isAutoPlay, items.length, autoSlideInterval]);

  useEffect(() => {
    return () => {
      if (resumeAutoPlayRef.current) {
        clearTimeout(resumeAutoPlayRef.current);
      }
    };
  }, []);

  const goToSlide = (index) => {
    setTransitionMode('manual');
    setCurrentIndex(index);
    setIsAutoPlay(false);

    if (resumeAutoPlayRef.current) {
      clearTimeout(resumeAutoPlayRef.current);
    }

    resumeAutoPlayRef.current = setTimeout(() => {
      setIsAutoPlay(true);
      setTransitionMode('auto');
    }, 10000);
  };

  const nextSlide = () => {
    goToSlide((currentIndex + 1) % items.length);
  };

  const prevSlide = () => {
    goToSlide((currentIndex - 1 + items.length) % items.length);
  };

  if (!items.length) {
    return <div className="carousel-empty">No items to display</div>;
  }

  return (
      <div
          className={`carousel ${transitionMode === 'manual' ? 'manual-transition' : ''}`}
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
      >
        <div className="carousel-slides">
          {items.map((item, index) => (
              <div
                  key={item.id}
                  className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
                  style={{
                    background: item.bgGradient || item.bgColor
                  }}
              >
                <div className="slide-content">
                  <div className="slide-text">
                    <h1 className="slide-title">{item.title}</h1>
                    <p className="slide-subtitle">{item.subtitle}</p>
                    <p className="slide-description">{item.description}</p>
                    <Link to={item.cta.url} className="btn-slide">
                      {item.cta.text}
                    </Link>
                  </div>

                  <div className="slide-image">
                    <AppImage src={item.image} fallbackSrc={DEFAULT_COMPANY_IMAGE} alt={item.title} />
                  </div>
                </div>
              </div>
          ))}
        </div>

        <button className="carousel-nav carousel-nav-prev" onClick={prevSlide} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <button className="carousel-nav carousel-nav-next" onClick={nextSlide} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div className="carousel-indicators">
          {items.map((item, index) => (
              <button
                  key={item.id}
                  className={`indicator ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  type="button"
              />
          ))}
        </div>

        <div className="carousel-info">
        <span className="info-counter">
          {currentIndex + 1} / {items.length}
        </span>
        </div>
      </div>
  );
};

export default Carousel;