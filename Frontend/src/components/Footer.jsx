import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Footer = () => {
    const navigate = useNavigate();

    return (
        <div>
            <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
                <div>
                    <img className='ml-10' src={assets.footer_logo} alt="" />
                    <p className='w-full md:w-2/3 text-gray-600 text-justify'>
                        C-max is a leading online store for all your electronic needs.
                        We offer a wide range of products at competitive prices, ensuring
                        that you get the best value for your money. Our mission is to provide
                        our customers with the best shopping experience possible,
                        and  are committed to delivering high-quality products
                        and exceptional customer service.
                    </p>
                </div>

                <div>
                    <p className='text-xl font-medium md-5'>COMPANY</p>
                    <ul className='flex flex-col gap-1 text-gray-600 cursor-pointer'>
                        <li className="hover:text-gray-800" onClick={() => navigate('/home')}>Home</li>
                        <li className="hover:text-gray-800" onClick={() => navigate('/about')}>About Us</li>
                        <li className="hover:text-gray-800" onClick={() => navigate('/contact')}>Contact</li>
                        <li className="hover:text-gray-800" onClick={() => window.open('https://www.termsfeed.com/live/5a451764-de21-4687-a9fb-79d8a495ad2c')}>Privacy Policy</li>
                    </ul>
                </div>
                <div>
                    <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                    <ul className='flex flex-col gap-1 text-gray-600 cursor-pointer' >
                        <li onClick={() => window.open('https://maps.app.goo.gl/hVnYzQiTcsq4Z9Bk6')}><strong>Address:</strong> 22/B, Kandy - Colombo Rd, Kiribathkumbura</li>
                        <li onClick={() => window.open('tel:+94716263856')}><strong>Phone</strong>: +94 71 626 3856</li>
                        <li onClick={() => window.open('mailto:cmaxinfohelp@gmail.com')}><strong>Email</strong>: cmaxinfohelp@gmail.com</li>
                    </ul>
                </div>
            </div>

            <div>
                <hr />
                {/* Copyright for current year */}
                <p className='py-5 text-sm text-center font-semibold'>Copyright {new Date().getFullYear()}@ cmaxonliestore.com - All rights reserved</p>
            </div>

        </div>
    )
}

export default Footer