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
import { ShopContext } from '../context/ShopContext'
import { useContext } from 'react';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const { setCartItems } = useContext(ShopContext);


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

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  // Validate name (only letters allowed)
  const validateName = (name) => {
    return /^[A-Za-z\s]+$/.test(name);
  };

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Phone number is optional

    // Must start with 0 and have exactly 10 digits
    if (!/^0\d{9}$/.test(phone)) {
      return false;
    }

    // Check for repeated digits (same digit cannot repeat 9 times)
    for (let i = 0; i < 10; i++) {
      const regex = new RegExp(`${i}{9}`);
      if (regex.test(phone)) {
        return false;
      }
    }

    return true;
  };

  // Fetch user data
  const fetchUserData = async () => {
    if (!token) {
      navigate('/');
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
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile data');

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken('');
        navigate('/');
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

    // Clear error when field is being edited
    setErrors(prev => ({ ...prev, [name]: '' }));
  };


  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    const newErrors = {
      firstName: '',
      lastName: '',
      phoneNumber: ''
    };

    let isValid = true;

    if (!validateName(user.firstName)) {
      newErrors.firstName = 'First name should contain only letters';
      isValid = false;
    }

    if (!validateName(user.lastName)) {
      newErrors.lastName = 'Last name should contain only letters';
      isValid = false;
    }

    if (user.phoneNumber && !validatePhoneNumber(user.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must start with 0 and be exactly 10 digits, without excessive repetition';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      toast.error('Please correct the errors in the form');
      return;
    }

    setUpdateLoading(true);

    try {
      const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      };

      const response = await axios.put(`${backendUrl}/api/user/update-profile`, userData, {
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
    // Close the modal first to avoid UI glitches
    setShowLogoutModle(false);

    // Then clear all data
    localStorage.removeItem('token');

    // Use a more reliable approach to navigation
    window.location.href = '/';
    setToken('');
    setCartItems({});
    setUser(null);
    navigate('/', { replace: true });
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
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-6xl">
      <ToastContainer position="top-right" autoClose={1000} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {activeSection === 'personalInfo' && (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                      className={`w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm sm:text-base`}
                      required
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                    )}
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
                      className={`w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm sm:text-base`}
                      required
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                    )}
                  </div>

                  {/* Email (disabled) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm sm:text-base"
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
                      placeholder="0XXXXXXXXX"
                      className={`w-full border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm sm:text-base`}
                    />
                    {errors.phoneNumber ? (
                      <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">Format: 0XXXXXXXXX (10 digits)</p>
                    )}
                  </div>

                  {/* Authentication Provider section */}
                  {user?.authProvider && user.authProvider !== 'local' && (
                    <div className="col-span-1 md:col-span-2">
                      <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center flex-wrap sm:flex-nowrap">
                        <div className="mr-3 sm:mr-4 mb-2 sm:mb-0 bg-blue-50 p-2 sm:p-3 rounded-full">
                          {user.authProvider === 'google' ? (
                            <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                                fill="#4285F4" />
                            </svg>
                          ) : user.authProvider === 'facebook' ? (
                            <svg className="w-6 h-6 sm:w-8 sm:h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                fill="#1877F2" />
                            </svg>
                          ) : null}
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-medium text-gray-800">
                            Connected with {user.authProvider === 'google' ? 'Google' : 'Facebook'}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Your account is linked to your {user.authProvider === 'google' ? 'Google' : 'Facebook'} account.
                            Password changes must be made through your {user.authProvider === 'google' ? 'Google' : 'Facebook'} account.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium"
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

      {/* Modals remain the same */}
      <PasswordChangeModle
        isOpen={showPasswordModle}
        onClose={() => setShowPasswordModle(false)}
        token={token}
        backendUrl={backendUrl}
        user={user}
        setToken={setToken}
        navigate={navigate}
      />

      <LogoutModle
        isOpen={showLogoutModle}
        onClose={() => setShowLogoutModle(false)}
        onLogout={handleLogout}
      />

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