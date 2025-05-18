import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'
import { motion } from 'framer-motion'

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className='text-2xl text-center pt-8 border-t'
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Title text1={'ABOUT'} text2={'US'} />
      </motion.div>

      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <motion.img
          className='w-full md:max-w-[450px] rounded-sm shadow-lg hover:shadow-xl transition-shadow duration-300'
          src={assets.about_img}
          alt="About Us"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
        />
        <motion.div
          className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600 text-center'
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            C-max is a leading online store for all your electronic needs. We offer a wide range of products at competitive prices, ensuring that you get the best value for your money. Our mission is to provide our customers with the best shopping experience possible, and  are committed to delivering high-quality products and exceptional customer service.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            Our team of experts is dedicated to helping you find the right products for your needs, and  are always here to answer any questions you may have. Whether you're looking for the latest gadgets or everyday essentials, C-max has you covered.
          </motion.p>

          <motion.b
            className='text-gray-800'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            Our Mission
          </motion.b>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            Our mission is to provide our customers with the best shopping experience possible. We are committed to delivering high-quality products and exceptional customer service. Our team of experts is dedicated to helping you find the right products for your needs, and  are always here to answer any questions you may have.
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        className='text-4xl py-4'
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Title text1={'WHY'} text2={'CHOOSE US?'} />
      </motion.div>

      <div className='flex flex-col md:flex-row text-sm mb-20 cursor-pointer'>
        {[
          { title: 'Quality Assurance:', text: 'We ensure that all our products meet the highest standards of quality.' },
          { title: 'Convenience:', text: 'We offer a seamless online shopping experience, with easy navigation and quick checkout.' },
          { title: 'Exceptional Customer Service:', text: 'Our customer service team is always ready to assist you with any inquiries or issues.' },
          { title: 'Fast Delivery:', text: 'We strive to deliver your orders as quickly as possible, without compromising on quality.' }
        ].map((item, index) => (
          <motion.div
            key={index}
            className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 bg-white hover:bg-gray-50 transition-colors duration-300'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 * index, duration: 0.5 }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <b>{item.title}</b>
            <p className='text-gray-600'>{item.text}</p>
          </motion.div>
        ))}
      </div>

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

export default About