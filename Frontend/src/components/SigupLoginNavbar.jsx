import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { ShoppingCart, User, LogIn } from 'lucide-react'

const SignUpLoginNavbar = () => {
    const [hoverButton, setHoverButton] = useState(null);

    return (
        <div className='flex items-center justify-between py-1 px-1 bg-gradient-to-r text-black w-full'>
            <Link to="/" className='flex items-center transition-transform duration-300 hover:scale-105'>
                <img className='w-36' src={assets.logo} alt="C-max Online Store Logo" />
            </Link>

            <div className='flex items-center gap-6'>
                <NavLink
                    to='/'
                    className={({ isActive }) =>
                        `relative flex items-center gap-2 font-medium transition-all duration-300 overflow-hidden group
                        ${isActive ? 'text-cyan-500 border-b-2 border-cyan-400' : 'text-green-400 hover:text-cyan-400'}`
                    }
                    onMouseEnter={() => setHoverButton('login')}
                    onMouseLeave={() => setHoverButton(null)}
                >
                    <LogIn size={18} className={`transition-all duration-300 ${hoverButton === 'login' ? 'rotate-12' : ''}`} />
                    <span>Login</span>
                    <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full'></span>
                </NavLink>

                <NavLink
                    to='/signup'
                    className={({ isActive }) =>
                        `relative flex items-center gap-2 font-medium transition-all duration-300 overflow-hidden group
                        ${isActive ? 'text-cyan-500 border-b-2 border-cyan-400' : 'text-green-400 hover:text-cyan-400'}`
                    }
                    onMouseEnter={() => setHoverButton('signup')}
                    onMouseLeave={() => setHoverButton(null)}
                >
                    <User size={18} className={`transition-all duration-300 ${hoverButton === 'signup' ? 'rotate-12' : ''}`} />
                    <span>Signup</span>
                    <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full'></span>
                </NavLink>
            </div>
        </div>
    )
}

export default SignUpLoginNavbar