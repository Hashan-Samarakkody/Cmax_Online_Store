import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const NewsletterBox = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [ref, inView] = useInView({
        triggerOnce: false,
        threshold: 0.1,
    });

    const onSubmitHandler = (event) => {
        event.preventDefault();
        // Adding animation before submission
        setIsSubmitting(true);

        // Simulate api call with timeout
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
            setEmail('');

            // Reset submission state after showing success message
            setTimeout(() => {
                setIsSubmitted(false);
            }, 3000);
        }, 1500);
    }

    return (
        <motion.div
            className='text-center py-16 my-8 bg-gray-50 rounded-xl px-4 sm:px-8'
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.7 }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <p className='text-2xl font-medium text-gray-800'>Subscribe to our newsletter</p>
                <p className='text-gray-400 mt-3 max-w-2xl mx-auto'>
                    Stay updated with the latest trends, exclusive offers, and new arrivals.
                    Join our community for insider access to special promotions and product launches.
                </p>
            </motion.div>

            <motion.form
                onSubmit={onSubmitHandler}
                className='w-full sm:w-1/2 flex items-center gap-3 mx-auto my-8 pl-3 border border-gray-500 rounded-lg overflow-hidden bg-white'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ boxShadow: "0px 5px 15px rgba(0,0,0,0.1)" }}
            >
                <input
                    type='email'
                    placeholder='Enter your email address'
                    className='w-full sm:flex-1 outline-none text-center rounded-lg py-4'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting || isSubmitted}
                />
                <motion.button
                    type='submit'
                    className='px-10 py-4 bg-black text-white text-xs rounded-r-lg'
                    whileHover={{ backgroundColor: "#333" }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isSubmitting || isSubmitted}
                >
                    {isSubmitting ? (
                        <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing
                        </span>
                    ) : isSubmitted ? "Subscribed!" : "Subscribe"}
                </motion.button>
            </motion.form>

            {isSubmitted && (
                <motion.div
                    className="text-green-500 mt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Thank you for subscribing to our newsletter!
                </motion.div>
            )}
        </motion.div>
    )
}

export default NewsletterBox