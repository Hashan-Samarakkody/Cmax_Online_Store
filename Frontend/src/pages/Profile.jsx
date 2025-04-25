import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { assets } from '../assets/assets';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const fileInputRef = useRef(null);

  // Form states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    profileImage: null
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    code: ''
  });

  // Handle account deletion
  const handleDeleteAccount = async () => {
    // Validate password is provided
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }

    try {
      setUpdateLoading(true);
      const response = await axios.delete(`${backendUrl}/api/user/delete-account`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          password: deletePassword
        }
      });

      if (response.data.success) {
        toast.success('Account deleted successfully');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        navigate('/signup');
      } else {
        toast.error(response.data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);

      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error deleting account. Please try again.');
      }
    } finally {
      setUpdateLoading(false);
      setDeletePassword('');
    }
  };



  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${backendUrl}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setUser(response.data.user);
          setFormData({
            name: response.data.user.name,
            phoneNumber: response.data.user.phoneNumber || '',
            profileImage: null
          });
        } else {
          toast.error(response.data.message || 'Failed to load profile');
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Error loading profile. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token, navigate, backendUrl]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, or WebP)');
        return;
      }

      setFormData({ ...formData, profileImage: file });
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  // Open edit profile modal
  const openEditModal = () => {
    if (!user) return;  // Missing return statement

    setFormData({
      name: user.name,
      phoneNumber: user.phoneNumber || '',
      profileImage: null
    });
    setPreviewImage(null);
    setShowEditModal(true);
  };

  // Get profile image URL with fallback
  const getProfileImageUrl = () => {
    if (!user) return 'https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg';

    if (!user.profileImage) return 'https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg';

    // If profileImage already contains a complete URL (from Cloudinary)
    if (user.profileImage.startsWith('http')) {
      return user.profileImage;  // Missing return statement
    }

    // Fallback to the placeholder image
    return 'https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg';
  };

  // Handle profile update submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    if (formData.name.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    if (!user) {
      toast.error('User data not available');
      return;
    }

    // Check if anything actually changed
    const hasNameChanged = formData.name !== user.name;
    const hasPhoneChanged = formData.phoneNumber !== user.phoneNumber;
    const hasImageChanged = formData.profileImage !== null;

    // If nothing changed, just exit edit mode
    if (!hasNameChanged && !hasPhoneChanged && !hasImageChanged) {
      setShowEditModal(false);
      toast.info('No changes were made');
      return;
    }

    try {
      setUpdateLoading(true);
      const form = new FormData();

      // Only append changed fields
      if (hasNameChanged) form.append('name', formData.name);
      if (hasPhoneChanged) form.append('phoneNumber', formData.phoneNumber);
      if (hasImageChanged) form.append('profileImage', formData.profileImage);

      const response = await axios.put(
        `${backendUrl}/api/user/update-profile`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
        setShowEditModal(false);
        toast.success('Profile updated successfully');

        // Clear the URL object to prevent memory leaks
        if (previewImage) {
          URL.revokeObjectURL(previewImage);
          setPreviewImage(null);
        }
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);

      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error updating profile. Please try again.');
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  // Send verification code for password change
  const sendVerificationCode = async () => {
    if (!user) {
      toast.error('User data not available');
      return;
    }

    try {
      setUpdateLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/user/send-reset-code`,
        { email: user.email },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Verification code sent to your email');
      } else {
        toast.error(response.data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast.error('Error sending verification code. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Verify reset code
  const verifyResetCode = async () => {
    if (!user) {
      toast.error('User data not available');
      return;
    }

    try {
      setUpdateLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/user/verify-reset-code`,
        {
          email: user.email,
          code: passwordData.code
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Code verified successfully');
      } else {
        toast.error(response.data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error('Error verifying code. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('User data not available');
      return;
    }

    // Password validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setUpdateLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/user/reset-password`,
        {
          email: user.email,
          code: passwordData.code,
          password: passwordData.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setShowPasswordModal(false);
        toast.success('Password changed successfully');

        // Clear password data
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          code: ''
        });
      } else {
        toast.error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error changing password. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setToken(null);
    navigate('/login');
    toast.info('You have been logged out');
  };

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

  // If no user data after loading (should not happen normally)
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-red-500 text-xl mb-4">Failed to load profile data</div>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Profile Card */}
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-500 p-5 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
          <h1 className="text-2xl md:text-3xl font-bold relative z-10">My Profile</h1>
          <p className="text-blue-100 opacity-90 mt-1 relative z-10">Manage your account details and settings</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Profile Header with Image */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
            <div className="relative group">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl overflow-hidden border-4 border-blue-400/30 shadow-lg shadow-blue-400/20 transition-all duration-300 group-hover:border-blue-400/60">
                <img
                  src={previewImage || getProfileImageUrl()}
                  alt={user.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg';
                  }}
                />
              </div>
              <div
                className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                onClick={openEditModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            </div>

            <div className="text-center md:text-left md:flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-1">{user.name}</h2>
              <p className="text-blue-700 font-medium">@{user.username}</p>
              <p className="text-gray-600 mt-2">{user.email}</p>

              {user.phoneNumber && (
                <div className="flex justify-center md:justify-start items-center mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="ml-2 text-gray-600">{user.phoneNumber}</span>
                </div>
              )}

              <div className="mt-5 bg-white rounded-xl p-4 backdrop-blur-sm border border-blue-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  Account Summary
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center text-sm">
                    <span className="h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
                    <span className="text-gray-600">Member since: {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
                    <span className="text-gray-600">Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <button
              type="button"
              onClick={openEditModal}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-lg shadow-blue-400/20 flex items-center transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-lg shadow-yellow-400/20 flex items-center transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Change Password
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-lg shadow-orange-400/20 flex items-center transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-lg shadow-red-400/20 flex items-center transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && user && (
        <div className="fixed inset-0 bg-blue-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 w-full max-w-lg border border-blue-200 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-blue-400/30">
                    <img
                      src={previewImage || getProfileImageUrl()}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-user.png';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-full shadow-lg hover:bg-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-blue-200 rounded-lg py-2.5 px-4 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full bg-white border border-blue-200 rounded-lg py-2.5 px-4 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Email (Cannot be changed)</label>
                  <input
                    type="text"
                    value={user.email}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2.5 px-4 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Username (Cannot be changed)</label>
                  <input
                    type="text"
                    value={user.username}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2.5 px-4 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center shadow-md"
                >
                  {updateLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && user && (
        <div className="fixed inset-0 bg-yellow-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-xl p-6 w-full max-w-lg border border-yellow-200 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Request verification code */}
            <div className="mb-6 p-4 bg-white rounded-lg border border-yellow-200">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Step 1: Get Verification Code</h3>
              <p className="text-sm text-gray-600 mb-3">We'll send a verification code to your email {user.email}</p>
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                onClick={sendVerificationCode}
                disabled={updateLoading}
              >
                {updateLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>

            {/* Verification code input */}
            <div className="mb-6 p-4 bg-white rounded-lg border border-yellow-200">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Step 2: Verify Code</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter verification code"
                  value={passwordData.code}
                  onChange={(e) => setPasswordData({ ...passwordData, code: e.target.value })}
                />
                <button
                  type="button"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                  onClick={verifyResetCode}
                  disabled={updateLoading || !passwordData.code}
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Password change form */}
            <form onSubmit={handlePasswordSubmit}>
              <div className="p-4 bg-white rounded-lg border border-yellow-200 mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Step 3: Set New Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="currentPassword">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full bg-white border border-yellow-200 rounded-lg py-2.5 px-4 text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="newPassword">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full bg-white border border-yellow-200 rounded-lg py-2.5 px-4 text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full bg-white border border-yellow-200 rounded-lg py-2.5 px-4 text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-4">
                Password must be at least 8 characters long.
              </p>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateLoading || !passwordData.code}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-6 rounded-lg flex items-center shadow-md transition-colors disabled:bg-gray-300"
                >
                  {updateLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-orange-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-xl p-6 w-full max-w-md border border-orange-200 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Logout</h2>
              <button onClick={() => setShowLogoutModal(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <p className="text-gray-800 text-center font-medium mb-2">Are you sure you want to logout?</p>
              <p className="text-gray-600 text-center text-sm">You'll need to sign in again to access your account</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors sm:w-1/2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors sm:w-1/2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-red-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-xl p-6 w-full max-w-md border border-red-200 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Delete Account</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <p className="text-gray-800 text-center font-medium mb-2">Are you sure you want to delete your account?</p>
              <p className="text-red-600 text-center text-sm font-medium">This action cannot be undone and all your data will be permanently removed.</p>

              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Enter your password to confirm</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full border border-red-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:border-red-400"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors sm:w-1/2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors sm:w-1/2"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;