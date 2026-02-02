import React from 'react';
import Carousel from './Carousel';
import { bannersMockData } from '../../data/bannersMockData';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <Carousel items={bannersMockData} autoSlideInterval={4000} />
    </section>
  );
};

export default Hero;
