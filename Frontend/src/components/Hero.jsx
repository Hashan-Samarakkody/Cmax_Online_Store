import React from 'react'
import { assets } from '../assets/assets'

const Hero = () => {
  return (
      <div className='flex flex-col sm:flex-row border border-gray-400 rounded-xl h-full sm:h-auto xl:h-[750px]'>
          {/* Hero Left Side */}
          <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
              <div className='text-[#414141]'>
                  <div className='flex items-center gap-2'>
                      <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                      <p className='font-semibold text-sm md:text-base'>Makes your life easier with</p>
                  </div>
                  <h1 className='text-4xl font-bold sm:py-3 lg:text-5xl leading-relaxed'>C-max </h1>

                  <div className='flex items-center gap-2'>
                      <p className='font-semibold text-sm md:text-base'>Evething you need in one place</p>
                      <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                  </div>
              </div>
          </div>

          {/* Hero Right Side */}

          <img className='w-full sm:w-1/2 rounded-xl' src={assets.hero_img} alt="Welcome To C-Max" />
    </div>
  )
}

export default Hero