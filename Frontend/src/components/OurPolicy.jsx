import React from 'react'
import { assets } from '../assets/assets'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const OurPolicy = () => {
    const [ref, inView] = useInView({
        triggerOnce: false,
        threshold: 0.1,
    });

    const policyItems = [
        {
            icon: assets.exchange_icon,
            title: "Easy Exchange Policy",
            description: "We offer easy returns and exchanges on all our products"
        },
        {
            icon: assets.quality_icon,
            title: "7 Day Return Policy",
            description: "We provide a 7 day return policy on all our products"
        },
        {
            icon: assets.support_img,
            title: "Best Customer Support",
            description: "We provide 24/7 customer support on all our products"
        }
    ];

    return (
        <div
            ref={ref}
            className='my-20 py-16 bg-gradient-to-r from-gray-50 to-white rounded-2xl'
        >
            <motion.div
                className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center text-xs sm:text-sm md:text-base text-gray-700'
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                {policyItems.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        className="policy-item"
                        whileHover={{ scale: 1.05 }}
                    >
                        <motion.div
                            className='relative'
                            whileHover={{ rotate: 5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div
                                className='w-16 h-16 bg-black bg-opacity-5 rounded-full flex items-center justify-center mx-auto mb-5'
                                initial={{ scale: 0 }}
                                animate={inView ? { scale: 1 } : { scale: 0 }}
                                transition={{ delay: 0.2 * index, duration: 0.5 }}
                            >
                                <img src={item.icon} className='w-8' alt={item.title} />
                            </motion.div>
                        </motion.div>
                        <p className='font-semibold'>{item.title}</p>
                        <p className='text-gray-400 mt-2'>{item.description}</p>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    )
}

export default OurPolicy