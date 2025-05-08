import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'
import { motion } from 'framer-motion'

const Contact = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className='text-center text-2xl pt-10 border-t'
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Title text1={'CONTACT'} text2={'US'} />
      </motion.div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28'>
        <motion.img
          className='w-full md:max-w-[480px] rounded-sm shadow-lg'
          src={assets.contact_img}
          alt="Contact Us"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          whileHover={{
            scale: 1.03,
            shadow: "0px 10px 30px rgba(0,0,0,0.15)"
          }}
        />
        <motion.div
          className='flex flex-col justify-center items-start gap-6'
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <motion.p
            className='font-semibold text-xl text-gray-600'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Our store
          </motion.p>
          <motion.p
            className='text-gray-500'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            1 lane,<br />New York, USA
          </motion.p>
          <motion.p
            className='text-gray-500'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            Tel: (+1) 234 567 890 <br />Email: z2bX0@example.com
          </motion.p>
          <motion.p
            className='font-semibold text-xl text-gray-600'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            Careers at CMax
          </motion.p>
          <motion.p
            className='text-gray-500'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
          >
            1 Lorem ipsum dolor sit amet consectetur adipisicing elit.<br />New York, USA
          </motion.p>
          <motion.button
            className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-300 rounded-sm'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.1)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            Explore Jobs
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        className='mb-16'
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          className='text-4xl py-4 text-center'
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Title text1={'GET IN'} text2={'TOUCH'} />
        </motion.div>

        <motion.form
          className='max-w-2xl mx-auto p-6 bg-white rounded-md shadow-md'
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <input type="text" placeholder="Your Name" className='border p-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300' />
            <input type="email" placeholder="Your Email" className='border p-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300' />
          </div>
          <input type="text" placeholder="Subject" className='border p-3 rounded-sm w-full mb-6 focus:outline-none focus:ring-2 focus:ring-gray-300' />
          <textarea placeholder="Your Message" rows="5" className='border p-3 rounded-sm w-full mb-6 focus:outline-none focus:ring-2 focus:ring-gray-300'></textarea>
          <motion.button
            className='bg-black text-white px-8 py-3 rounded-sm hover:bg-gray-800 transition-colors'
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Send Message
          </motion.button>
        </motion.form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <NewsletterBox />
      </motion.div>
    </motion.div>
  )
}

export default Contact