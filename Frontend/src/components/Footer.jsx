import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <div>
            <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
                <div>
                    <img className='ml-10' src={assets.footer_logo} alt="" />
                    <p className='w-full md:w-2/3 text-gray-600 text-justify'>
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                        Consequatur molestiae eligendi dolor, dolorem nobis perspiciatis
                        eaque rem! Obcaecati possimus explicabo aut expedita! Alias quaerat
                        hic quos reiciendis ut sit earum.
                    </p>
                </div>

                <div>
                    <p className='text-xl font-medium md-5'>COMPANY</p>
                    <ul className='flex flex-col gap-1 text-gray-600'>   
                        <li>Home</li>
                        <li>About Us</li>
                        <li>Delivery</li>
                        <li>Privacy Policy</li>    
                    </ul>
                </div>
                <div>
                    <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                    <ul className='flex flex-col gap-1 text-gray-600' >
                        <li><strong>Address</strong>: 123 Street Name, City, England</li>
                        <li><strong>Phone</strong>: +123 456 789</li>
                        <li><strong>Email</strong>: 6Bt2V@example.com</li>
                    </ul>
                </div>
            </div>

            <div>
                <hr />
                {/* Copyright for current year */}
                <p className='py-5 text-sm text-center font-semibold'>Copyright {new Date().getFullYear()}@ forever.com - All rights reserved</p>
            </div>

        </div>
    )
}

export default Footer