import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { useNavigate } from 'react-router-dom'

const Navbar = ({ setToken }) => {
  const [adminName, setAdminName] = useState('Admin')
  const [profilePic, setProfilePic] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch admin details when component mounts
    const fetchAdminDetails = async () => {
      try {
        const token = localStorage.getItem('adminToken')
        if (token) {
          const response = await axios.get(`${backendUrl}/api/admin/profile`, {
            headers: { token }
          })

          if (response.data && response.data.admin && response.data.admin.name) {
            setAdminName(response.data.admin.name)
          }

          // Update this line to use profileImage instead of profilePic
          if (response.data && response.data.admin && response.data.admin.profileImage) {
            setProfilePic(response.data.admin.profileImage)
          }
        }
      } catch (error) {
        console.error('Error fetching admin details:', error)
      }
    }

    fetchAdminDetails()
  }, [])

  return (
    <div className='flex items-center py-2 px-[4%] justify-between'>
      <img className='w-[max(6%,50px)]' src={assets.logo} alt="Cmax Logo" />

      <div className='flex items-center gap-4'>
        <h1 className='hidden sm:block text-2xl font-semibold text-green-400'>
          Welcome, {adminName}!
        </h1>
        <div className='w-15 h-15 rounded-full overflow-hidden border-2 border-green-400'>
          {profilePic ? (
            <img
              src={profilePic}
              onClick={() => navigate('/profile')}
              alt={`${adminName}'s profile`}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full bg-gray-300 flex items-center justify-center'>
              <span className='text-gray-600 font-bold text-lg'>
                {adminName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar