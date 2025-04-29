import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { assets } from '../assets/assets';
import ProfileSidebar from '../components/ProfileSidebar';
import AddressManager from '../components/AddressManager';
import PasswordChangeModle from '../components/PasswordChangeModle';
import DeleteAccountModle from '../components/DeleteAccountModle';
import LogoutModle from '../components/LogoutModle';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Get section from URL if available
  const queryParams = new URLSearchParams(location.search);
  const sectionParam = queryParams.get('section');

  // Form states
  const [activeSection, setActiveSection] = useState(sectionParam || 'personalInfo');
  const [showPasswordModle, setShowPasswordModle] = useState(false);
  const [showDeleteModle, setShowDeleteModle] = useState(false);
  const [showLogoutModle, setShowLogoutModle] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch user data
  const fetchUserData = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser(response.data.user);
      } else {
        toast.error('Failed to load profile');
        localStorage.removeItem('token');
        setToken('');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile data');

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken('');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle image change
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };

      reader.readAsDataURL(file);

      // Upload image
      uploadImage(file);
    }
  };

  // Upload profile image
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const response = await axios.post(`${backendUrl}/api/user/profile/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Profile image updated');
        setUser({ ...user, profileImage: response.data.imageUrl });
      } else {
        toast.error('Failed to update profile image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading profile image');
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      };

      const response = await axios.put(`${backendUrl}/api/user/profile`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/login');
    toast.info('You have been logged out');
  };

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [token]);

  // Handle section from URL params
  useEffect(() => {
    if (sectionParam) {
      setActiveSection(sectionParam);

      if (sectionParam === 'password') {
        setShowPasswordModle(true);
      }

      if (sectionParam === 'delete') {
        setShowDeleteModle(true);
      }

      if (sectionParam === 'logout') {
        setShowLogoutModle(true);
      }
    }
  }, [sectionParam]);


  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-24 h-24">
          {/* Pulsing circle animation */}
          <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-t-4 border-green-400 rounded-full animate-spin"></div>
          {/* Shop icon or logo in center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <img
              src={assets.logo}
              alt="Loading"
              className="w-12 h-12 object-contain animate-pulse"
            />
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left sidebar navigation */}
        <div className="md:col-span-1">
          <ProfileSidebar
            user={user}
            setActiveSection={setActiveSection}
            activeSection={activeSection}
            onShowPasswordModle={() => setShowPasswordModle(true)}
            onShowDeleteModle={() => setShowDeleteModle(true)}
            onShowLogoutModle={() => setShowLogoutModle(true)}
          />
        </div>

        {/* Main content area */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            {activeSection === 'personalInfo' && (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={user?.firstName || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={user?.lastName || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  {/* Email (disabled) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={user?.phoneNumber || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 font-medium"
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'addresses' && (
              <AddressManager user={user} setUser={setUser} />
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modle */}
      <PasswordChangeModle
        isOpen={showPasswordModle}
        onClose={() => setShowPasswordModle(false)}
        token={token}
        backendUrl={backendUrl}
        user={user}
        setToken={setToken}
        navigate={navigate}
      />

      {/* Logout Modle */}
      <LogoutModle
        isOpen={showLogoutModle}
        onClose={() => setShowLogoutModle(false)}
        onLogout={handleLogout}
      />

      {/* Delete Account Modle */}
      <DeleteAccountModle
        isOpen={showDeleteModle}
        onClose={() => setShowDeleteModle(false)}
        token={token}
        backendUrl={backendUrl}
        setToken={setToken}
        navigate={navigate}
      />
    </div>
  );
};

export default Profile;