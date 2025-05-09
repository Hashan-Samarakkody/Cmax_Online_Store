import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const Hero = () => {

    const navigate = useNavigate()

    // Define carousel images - add your image paths to assets or directly here
    const carouselImages = [
        assets.hero_img,
        assets.hero_img2,
        assets.hero_img3,
        assets.hero_img4,
        assets.hero_img5
    ]

    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
            )
        }, 10000)

        return () => clearInterval(interval)
    }, [])


    return (
        <motion.div
            className='flex flex-col sm:flex-row border border-gray-400 rounded-xl h-full sm:h-auto xl:h-[750px]'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
        >
            {/* Hero Left Side */}
            <motion.div
                className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.1 }}
            >
                <div className='text-[#414141]'>
                    <motion.div
                        className='flex items-center gap-2'
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <motion.p
                            className='w-8 md:w-11 h-[2px] bg-[#414141]'
                            initial={{ width: 0 }}
                            animate={{ width: "2rem" }}
                            transition={{ delay: 0.9, duration: 0.5 }}
                        ></motion.p>
                        <motion.p
                            className='font-semibold text-sm md:text-base'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.1, duration: 0.5 }}
                        >
                            Makes your life easier with
                        </motion.p>
                    </motion.div>

                    <motion.h1
                        className='text-4xl font-bold sm:py-3 lg:text-5xl leading-relaxed'
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.3, duration: 0.6 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        C-max
                    </motion.h1>

                    <motion.div
                        className='flex items-center gap-2'
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.6, duration: 0.5 }}
                    >
                        <motion.p
                            className='font-semibold text-sm md:text-base'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8, duration: 0.5 }}
                        >
                            Everything you need in one place
                        </motion.p>
                        <motion.p
                            className='w-8 md:w-11 h-[2px] bg-[#414141]'
                            initial={{ width: 0 }}
                            animate={{ width: "2rem" }}
                            transition={{ delay: 2.0, duration: 0.5 }}
                        ></motion.p>
                    </motion.div>

                    <motion.button
                        className='mt-6 px-8 py-3 bg-black text-white rounded-sm hover:bg-gray-800 transition-colors'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.2, duration: 0.5 }}
                        whileHover={{
                            scale: 1.05,
                            boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.1)'
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/collection')}
                    >
                        Shop Now
                    </motion.button>
                </div>
            </motion.div>

            {/* Hero Right Side - Carousel */}
            <motion.div
                className='w-full sm:w-1/2 relative overflow-hidden rounded-xl'
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.1 }}
                style={{ zIndex: -1 }} // Lower z-index to prevent overlap with navigation
            >
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentImageIndex}
                        className='w-full h-full object-cover rounded-xl'
                        src={carouselImages[currentImageIndex]}
                        alt={`C-Max Product Showcase ${currentImageIndex + 1}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        whileHover={{ scale: 1.03 }}
                    />
                </AnimatePresence>

                {/* Carousel Navigation Dots */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {carouselImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </motion.div>
        </motion.div>
    )
}

export default Hero