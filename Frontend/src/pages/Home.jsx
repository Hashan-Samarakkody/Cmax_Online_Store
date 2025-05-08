import React, { useEffect } from 'react'
import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewsletterBox from '../components/NewsletterBox'
import { motion } from 'framer-motion'
import AOS from 'aos'
import 'aos/dist/aos.css'

const Home = () => {
  useEffect(() => {
    // Initialize AOS animation library
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true
    });

    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      // Cleanup
      document.documentElement.style.scrollBehavior = 'auto';
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <div className="container mx-auto px-4">
        <div data-aos="fade-up">
          <LatestCollection />
        </div>
        <div data-aos="fade-up" data-aos-delay="100">
          <BestSeller />
        </div>
        <div data-aos="fade-up" data-aos-delay="200">
          <OurPolicy />
        </div>
        <div data-aos="fade-up" data-aos-delay="300">
          <NewsletterBox />
        </div>
      </div>
    </motion.div>
  )
}

export default Home