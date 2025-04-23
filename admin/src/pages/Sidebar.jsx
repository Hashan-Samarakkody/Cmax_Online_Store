import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'
import axios from 'axios'
import { backendUrl } from '../App'

const Sidebar = () => {
    const [admin, setAdmin] = useState(null);

    // Fetch admin profile to determine role
    useEffect(() => {
        const fetchAdminDetails = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                const response = await axios.get(`${backendUrl}/api/admin/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data.success) {
                    setAdmin(response.data.admin);
                }
            } catch (error) {
                console.error("Error fetching admin profile:", error);
            }
        };
        
        fetchAdminDetails();
    }, []);

    return (
        <div className='w-[18%] min-h-screen border-r-2'>
            <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>

                <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/">
                    <img className='w-5 h-5' src={assets.dashboard_icon} alt="" />
                    <p className='hidden md:block'>Dashboard</p>
                </NavLink>

                <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/add">
                    <img className='w-5 h-5' src={assets.add_icon} alt="" />
                    <p className='hidden md:block'>Add Items</p>
                </NavLink>

                <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/list">
                    <img className='w-5 h-5' src={assets.list_icon} alt="" />
                    <p className='hidden md:block'>List Items</p>
                </NavLink>

                <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/category">
                    <img className='w-5 h-5' src={assets.category_icon} alt="" />
                    <p className='hidden md:block'>Categories</p>
                </NavLink>

                <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/orders">
                    <img className='w-5 h-5' src={assets.order_iocn} alt="" />
                    <p className='hidden md:block'>Orders</p>
                </NavLink>

                <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/profile">
                    <img className='w-5 h-5' src={assets.profile_icon} alt="" />
                    <p className='hidden md:block'>Profile</p>
                </NavLink>
                
                {/* Admin Management link - only visible to superadmins */}
                {admin?.role === 'superadmin' && (
                    <NavLink 
                        className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" 
                        to="/admin-management"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        <p className='hidden md:block'>Manage Admins</p>
                    </NavLink>
                )}
            </div>
        </div>
    )
}

export default Sidebar