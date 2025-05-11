import React from 'react'
import { useEffect, useState, useContext } from 'react'
import { assets } from '../assets/assets'
import { NavLink, Link } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { FiHome, FiGrid, FiHeart, FiPackage, FiRefreshCw, FiUser, FiInfo, FiMessageSquare, FiX, FiChevronLeft } from 'react-icons/fi'

const Navbar = () => {
	const [visible, setVisible] = useState(false);
	const { setShowSearch, getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext);
	const [activeMobileCategory, setActiveMobileCategory] = useState('');
	const [user, setUser] = useState(null);
	const backendUrl = import.meta.env.VITE_BACKEND_URL;

	useEffect(() => {
		// Fetch user profile data when token exists
		const fetchUserProfile = async () => {
			if (token) {
				try {
					const response = await fetch(`${backendUrl}/api/user/profile`, {
						method: 'GET',
						headers: {
							'Authorization': `Bearer ${token}`
						}
					});

					const data = await response.json();
					if (data.success) {
						setUser(data.user);
					}
				} catch (error) {
					console.error('Error fetching user profile:', error);
				}
			} else {
				setUser(null);
			}
		};

		fetchUserProfile();
	}, [token]);

	const logout = () => {
		navigate('/')
		localStorage.removeItem('token')
		setToken('')
		setCartItems({})
		setUser(null)
	}

	const mobileMenuLinks = [
		{ to: '/home', label: 'Home', icon: <FiHome className="w-5 h-5" /> },
		{ to: '/collection', label: 'Collection', icon: <FiGrid className="w-5 h-5" /> },
		{ to: '/wishlist', label: 'Wishlist', icon: <FiHeart className="w-5 h-5" /> },
		{ to: '/orders', label: 'My Orders', icon: <FiPackage className="w-5 h-5" /> },
		{ to: '/returns', label: 'My Returns', icon: <FiRefreshCw className="w-5 h-5" /> },
		{ to: '/profile', label: 'My Profile', icon: <FiUser className="w-5 h-5" /> },
		{ to: '/about', label: 'About Us', icon: <FiInfo className="w-5 h-5" /> },
		{ to: '/contact', label: 'Contact', icon: <FiMessageSquare className="w-5 h-5" /> }
	];

	return (
		<div className='relative flex items-center justify-between py-1 px-0 font-medium'>
			<img className='w-36' src={assets.logo} alt="" />

			{/* Desktop Navigation */}
			<ul className='w-2/4 sm:flex gap-5 text-sm text-gray-700 hidden'>
				<NavLink to='/home' className='flex flex-col items-center gap-2 px-1x text-[16px]'>
					<p>HOME</p>
					<hr className='w-3/4 border-none h-[2px] bg-gray-700 hidden' />
				</NavLink>
				<NavLink to='/collection' className='flex flex-col items-center gap-2 px-1x text-[16px]'>
					<p>COLLECTION</p>
					<hr className='w-3/4 border-none h-[2px] bg-gray-700 hidden' />
				</NavLink>
				<NavLink to='/wishlist' className='flex flex-col items-center gap-2 px-1x text-[16px]'>
					<p>WISHLIST</p>
					<hr className='w-3/4 border-none h-[2px] bg-gray-700 hidden' />
				</NavLink>
				<NavLink to='/about' className='flex flex-col items-center gap-2 px-1x text-[16px]'>
					<p>ABOUT</p>
					<hr className='w-3/4 border-none h-[2px] bg-gray-700 hidden' />
				</NavLink>
				<NavLink to='/contact' className='flex flex-col items-center gap-2 px-1x text-[16px]'>
					<p>CONTACT</p>
					<hr className='w-3/4 border-none h-[2px] bg-gray-700 hidden' />
				</NavLink>
			</ul>

			{/* Right Icons */}
			<div className='flex items-center gap-6'>
				<img onClick={() => setShowSearch(true)} src={assets.search_icon} alt="" className='w-5 cursor-pointer' />

				<div className='group relative'>
					<img onClick={() => token ? null : navigate('/')} src={assets.profile_icon} alt="" className='w-5 cursor-pointer' />

					{/* Dropdown Menu */}
					{token &&
						<div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4'>
							<div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded'>
								<p onClick={() => navigate('/profile')} className='cursor-pointer hover:text-black'>My Profile</p>
								<p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-black'>My Orders</p>
								<p onClick={() => navigate('/returns')} className='cursor-pointer hover:text-black'>My Returns</p>
								<p onClick={logout} className='cursor-pointer hover:text-black'>Logout</p>
							</div>
						</div>
					}
				</div>
				<Link to='/cart' className='relative'>
					<img src={assets.cart_icon} alt="" className='w-5 min-w-5 cursor-pointer' />
					<p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[10.5px]'>{getCartCount()}</p>
				</Link>
				<img
					onClick={() => setVisible(true)}
					src={assets.menu_icon}
					alt=""
					className='w-5 sm:hidden cursor-pointer'
				/>
			</div>

			{/* Overlay */}
			<div
				className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
				onClick={() => setVisible(false)}
			/>

			{/* Enhanced Mobile Menu */}
			<div className={`fixed top-0 right-0 h-screen z-50 bg-white shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${visible ? 'w-full md:w-80' : 'w-0'}`}>
				<div className='flex flex-col h-full'>
					{/* Header */}
					<div className='flex items-center justify-between p-4 border-b'>
						<div className='flex items-center'>
							<img src={assets.logo} alt="Logo" className='h-15' />
						</div>
						<button
							onClick={() => setVisible(false)}
							className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
						>
							<FiX className="w-5 h-5 text-gray-600" />
						</button>
					</div>

					{/* User section */}
					{token ? (
						<div className='p-4 bg-gray-50 border-b'>
							<div className='flex items-center space-x-3'>
								<div className='w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center'>
									{/* Use profile image from state or fallback to default icon */}
									<img
										src={user?.profileImage || assets.profile_icon}
										alt="Profile"
										className={`${user?.profileImage ? 'w-full h-full object-cover' : 'w-6 h-6 opacity-60'}`}
									/>
								</div>
								<div>
									<p className='font-medium'>
										{user?.firstName ? `Welcome, ${user.firstName}!` : 'Welcome back!'}
									</p>
									<button
										onClick={() => {
											logout();
											setVisible(false);
										}}
										className='text-sm text-red-600 hover:underline'
									>
										Logout
									</button>
								</div>
							</div>
						</div>
					) : (
						<div className='p-4 bg-gray-50 border-b'>
							<div className='flex justify-between'>
								<button
									onClick={() => {
										navigate('/');
										setVisible(false);
									}}
									className='px-5 py-2 bg-black text-white rounded-md text-sm font-medium'
								>
									Login
								</button>
								<button
									onClick={() => {
										navigate('/signup');
										setVisible(false);
									}}
									className='px-5 py-2 border border-gray-300 rounded-md text-sm font-medium'
								>
									Register
								</button>
							</div>
						</div>
					)}

					{/* Navigation links */}
					<div className='flex-1 overflow-y-auto py-2'>
						<nav className='space-y-1'>
							{mobileMenuLinks.map((link) => (
								<NavLink
									key={link.to}
									to={link.to}
									onClick={() => setVisible(false)}
									className={({ isActive }) =>
										`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors
                                        ${isActive ? 'bg-gray-50 text-black font-medium border-l-4 border-black' : 'text-gray-600'}`
									}
								>
									<span className={`flex items-center justify-center`}>
										{link.icon}
									</span>
									<span>{link.label}</span>
								</NavLink>
							))}
						</nav>

						{/* Current cart items - quick look */}
						<div className='mt-4 px-4 py-3 border-t border-gray-100'>
							<div className='flex justify-between items-center mb-3'>
								<h3 className='font-medium'>Cart</h3>
								<Link
									to='/cart'
									onClick={() => setVisible(false)}
									className='text-sm text-blue-600 hover:underline'
								>
									View Cart ({getCartCount()})
								</Link>
							</div>
							{getCartCount() > 0 ? (
								<div className='text-sm text-gray-600'>
									You have {getCartCount()} items in your cart
								</div>
							) : (
								<div className='text-sm text-gray-500 italic'>
									Your cart is empty
								</div>
							)}
						</div>
					</div>

					{/* Footer */}
					<div className='p-4 border-t border-gray-200 bg-gray-50'>
						<div className='flex justify-center gap-6'>
							<a href="#" className='text-gray-500 hover:text-gray-800'>
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
								</svg>
							</a>
							<a href="#" className='text-gray-500 hover:text-gray-800'>
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
								</svg>
							</a>
							<a href="#" className='text-gray-500 hover:text-gray-800'>
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
								</svg>
							</a>
						</div>
						<p className='text-center text-xs text-gray-500 mt-3'>© 2025 Cmax Online Store. All rights reserved.</p>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Navbar