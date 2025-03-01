import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  return (
    <div>
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'ABOUT'} text2={'US'}/>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img className='w-full md:max-w-[450px] rounded-sm' src={assets.about_img} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600 text-center'>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni explicabo
            repudiandae ad? Non architecto itaque tempora at fugit voluptatum, ipsum,
            culpa suscipit repellat molestiae harum totam sequi accusantium assumenda maiores!</p>
          <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Totam aut
            incidunt magnam recusandae perferendis aliquam eos iste unde pariatur
            expedita delectus accusamus cum ipsam veniam, ea ratione minus distinctio numquam!</p>
          
          <b className='text-gray-800'>Our Mission</b>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni explicabo</p>
        </div>
      </div>

      <div className='text-4xl py-4'>
        <Title text1={'WHY'} text2={'CHOOSE US?'}/>
      </div>

      <div className='flex flex-col md:flex-row text-sm mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Quality Assuarance:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Convenience:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Exceptional Customer Service:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Fast Delivery:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
        </div>
      </div>

      <NewsletterBox/>

    </div>
  )
}

export default About