import React from 'react'
import { assets } from '../assets/assets'
import { motion } from 'framer-motion'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const Hero = () => {
    // Sample images for carousel (replace with your actual images)
    const heroImages = [
        assets.hero_img,
        // Add more images to the carousel if available
    ];

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        fade: true
    };

    return (
        <div className='flex flex-col sm:flex-row border border-gray-400 rounded-xl h-full sm:h-auto xl:h-[750px] overflow-hidden'>
            {/* Hero Left Side with Animation */}
            <motion.div
                className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className='text-[#414141]'>
                    <div className='flex items-center gap-2'>
                        <motion.div
                            className='w-8 md:w-11 h-[2px] bg-[#414141]'
                            initial={{ width: 0 }}
                            animate={{ width: "2rem" }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        ></motion.div>
                        <motion.p
                            className='font-semibold text-sm md:text-base'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            Makes your life easier with
                        </motion.p>
                    </div>

                    <motion.h1
                        className='text-4xl font-bold sm:py-3 lg:text-6xl leading-relaxed bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent'
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.7 }}
                    >
                        C-max
                    </motion.h1>

                    <div className='flex items-center gap-2'>
                        <motion.p
                            className='font-semibold text-sm md:text-base'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.1 }}
                        >
                            Everything you need in one place
                        </motion.p>
                        <motion.div
                            className='w-8 md:w-11 h-[2px] bg-[#414141]'
                            initial={{ width: 0 }}
                            animate={{ width: "2rem" }}
                            transition={{ delay: 1.3, duration: 0.5 }}
                        ></motion.div>
                    </div>

                    <motion.button
                        className="mt-6 px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                    >
                        Shop Now
                    </motion.button>
                </div>
            </motion.div>

            {/* Hero Right Side */}
            <motion.div
                className='w-full sm:w-1/2'
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <Slider {...settings} className="h-full">
                    {heroImages.map((image, index) => (
                        <div key={index} className="outline-none">
                            <img
                                className='w-full rounded-xl h-full object-cover'
                                src={image}
                                alt={`C-Max Hero ${index + 1}`}
                            />
                        </div>
                    ))}
                </Slider>
            </motion.div>
        </div>
    )
}

export default Hero