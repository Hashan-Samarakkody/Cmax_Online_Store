import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';

const Navbar = ({ setToken }) => {
  const [adminName, setAdminName] = useState('Admin');
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();

  const fetchAdminDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        const response = await axios.get(`${backendUrl}/api/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });


        if (response.data && response.data.admin && response.data.admin.name) {
          setAdminName(response.data.admin.name);
        }

        if (response.data && response.data.admin && response.data.admin.profileImage) {
          setProfilePic(response.data.admin.profileImage);
        }

        // Store admin ID in localStorage if not already stored
        if (response.data && response.data.admin && response.data.admin._id) {
          localStorage.setItem('adminId', response.data.admin._id);

        }
      }
    } catch (error) {
      console.error('Error fetching admin details:', error);
    }
  };

  useEffect(() => {
    // Initial fetch of admin details
    fetchAdminDetails();

    // Connect to WebSocket if not already connected
    if (!WebSocketService.isConnected()) {
      WebSocketService.connect(() => {
      });
    }

    // Setup profile update listener
    const handleProfileUpdate = (data) => {

      // Only update if the profile update is for the current admin
      const currentAdminId = localStorage.getItem('adminId');
      if (currentAdminId && data.admin) {

        // Check both string and ObjectId format
        const isCurrentAdmin =
          data.admin.id === currentAdminId ||
          data.admin._id === currentAdminId;

        if (isCurrentAdmin) {
          if (data.admin.name) {
            setAdminName(data.admin.name);
          }

          if (data.admin.profileImage) {
            setProfilePic(data.admin.profileImage);
          }
        }
      }
    };

    // Register WebSocket event listener
    WebSocketService.on('profileUpdate', handleProfileUpdate);

    // Cleanup WebSocket listener when component unmounts
    return () => {
      WebSocketService.off('profileUpdate', handleProfileUpdate);
    };
  }, []);

  // Helper function to get the appropriate profile image
  const getProfileImageSrc = () => {
    // If no profile pic or it's the default value from database
    if (!profilePic || profilePic === 'default-admin.png') {
      return assets.profile_icon;
    }

    // If the image is a full URL (from cloud storage)
    if (profilePic.includes('http')) {
      return profilePic;
    }

    // If it's a relative path (stored locally)
    return `${backendUrl}/uploads/${profilePic}`;
  };

  return (
    <div className='flex items-center py-1 px-[4%] justify-between'>
      <img className='w-[max(5%,70px)]' src={assets.logo} alt="Cmax Logo" />

      <div className='flex items-center gap-3'>
        <h1 className='hidden sm:block text-3xl font-semibold text-green-400'>
          Welcome, {adminName}!
        </h1>
        <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-green-400'>
          <img
            src={getProfileImageSrc()}
            onClick={() => navigate('/profile')}
            alt={`${adminName}'s profile`}
            className='w-full h-full object-cover'
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = assets.profile_icon;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;