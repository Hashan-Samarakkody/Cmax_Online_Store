import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';
import { useNavigate } from 'react-router-dom';

const Profile = ({ token, setToken }) => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        profileImage: null
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        code: ''
    });
    const [updateLoading, setUpdateLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Function to handle actual logout
    const handleLogout = () => {
        setToken('');
        navigate('/');
    };

    // Fetch admin profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${backendUrl}/api/admin/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    setAdmin(response.data.admin);
                    // Initialize form data with admin details
                    setFormData({
                        name: response.data.admin.name,
                        username: response.data.admin.username,
                        email: response.data.admin.email,
                        profileImage: null
                    });
                } else {
                    toast.error(response.data.message || 'Failed to load profile');
                    // If token is invalid, logout
                    if (response.data.message === 'Invalid token') {
                        setToken('');
                        navigate('/');
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Error loading profile. Please try again.');
                // If unauthorized error, logout
                if (error.response && error.response.status === 401) {
                    setToken('');
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        } else {
            navigate('/');
        }
    }, [token, navigate, setToken]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle image upload
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload a valid image file (JPEG, PNG, GIF)');
                return;
            }

            setFormData({ ...formData, profileImage: file });

            // Add and set preview URL
            const previewUrl = URL.createObjectURL(file);
            setPreviewImage(previewUrl);
        }
    };

    // Handle password input changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    // Validate email format
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Open edit profile modal and reset form data
    const openEditModal = () => {
        setFormData({
            name: admin.name,
            username: admin.username,
            email: admin.email,
            profileImage: null
        });
        setPreviewImage(null);
        setShowEditModal(true);
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

        // Check if anything actually changed
        const hasNameChanged = formData.name !== admin.name;
        const hasImageChanged = formData.profileImage !== null;

        // If nothing changed, just exit edit mode
        if (!hasNameChanged && !hasImageChanged) {
            setShowEditModal(false);
            toast.info('No changes were made');
            return;
        }

        try {
            setUpdateLoading(true);
            const form = new FormData();

            // Only append changed fields
            if (hasNameChanged) form.append('name', formData.name);
            // Always append email and username to maintain the same values
            form.append('username', admin.username);
            form.append('email', admin.email);
            if (hasImageChanged) form.append('profileImage', formData.profileImage);

            const response = await axios.put(
                `${backendUrl}/api/admin/profile`,
                form,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                setAdmin(response.data.admin);
                toast.success('Profile updated successfully');
                setShowEditModal(false);

                // Clear preview image
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

    // Handle password change submission
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // Password validation
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        // Password strength check (at least 8 characters with mix of letters, numbers, special chars)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(passwordData.newPassword)) {
            toast.error('Password must be at least 8 characters and include letters, numbers, and special characters');
            return;
        }

        try {
            setUpdateLoading(true);
            const response = await axios.put(
                `${backendUrl}/api/admin/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                toast.success('Password changed successfully');
                setShowPasswordModal(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(response.data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);

            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error changing password. Please try again.');
            }
        } finally {
            setUpdateLoading(false);
        }
    };

    // Handle account deletion
    const handleDeleteAccount = async () => {
        try {
            setUpdateLoading(true);
            const response = await axios.delete(
                `${backendUrl}/api/admin/delete`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                toast.success('Account deleted successfully');

                // Check if setToken is a function before calling it
                if (typeof setToken === 'function') {
                    setToken(''); // Log out the user
                } else {
                    // Alternative: use localStorage directly if setToken isn't available
                    localStorage.removeItem('adminToken'); // Assuming you store the token in localStorage
                }

                setShowDeleteModal(false);
                navigate('/signup');
            } else {
                toast.error(response.data.message || 'Failed to delete account');
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error('Error deleting account:', error);

            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error deleting account. Please try again.');
            }

            setShowDeleteModal(false);
        } finally {
            setUpdateLoading(false);
        }
    };

    // Handle escape key to cancel modals
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                if (showPasswordModal) setShowPasswordModal(false);
                if (showDeleteModal) setShowDeleteModal(false);
                if (showEditModal) setShowEditModal(false);
                if (showLogoutModal) setShowLogoutModal(false);
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [showPasswordModal, showDeleteModal, showEditModal, showLogoutModal]);
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
        <div className="bg-gray-50 min-h-screen">
            <ToastContainer position="top-right" autoClose={500} />

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Page Header */}
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Administrator Profile</h1>
                    <p className="text-sm sm:text-base text-gray-500">Manage your account settings and preferences</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Left Sidebar - Profile Summary */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-800 p-3 sm:p-4 text-white">
                                <h2 className="font-semibold text-sm sm:text-base">Profile Information</h2>
                            </div>

                            {/* Profile Image and Basic Info */}
                            <div className="p-4 sm:p-5 flex flex-col items-center">
                                <div className="relative mb-4">
                                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-2 border-gray-200">
                                        <img
                                            src={previewImage || (admin?.profileImage
                                                ? (admin.profileImage.includes('http')
                                                    ? admin.profileImage
                                                    : `${backendUrl}/uploads/${admin.profileImage}`)
                                                : assets.profile_icon)}
                                            alt={admin?.name || "Profile"}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = assets.profile_icon;
                                            }}
                                        />
                                    </div>
                                    <div
                                        className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                                        onClick={openEditModal}
                                        title="Edit profile picture"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </div>
                                </div>

                                <h3 className="text-lg sm:text-xl font-bold text-gray-800">{admin?.name}</h3>
                                <p className="text-gray-500 mb-2 text-sm sm:text-base">@{admin?.username}</p>
                                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {admin?.role.charAt(0).toUpperCase() + admin?.role.slice(1)}
                                </span>
                            </div>

                            {/* Contact Information */}
                            <div className="border-t border-gray-100 p-4 sm:p-5">
                                <h3 className="text-sm font-medium text-gray-600 uppercase mb-3">Contact Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        <span className="text-gray-800 text-xs sm:text-sm break-all">{admin?.email}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-800 capitalize text-xs sm:text-sm">{admin?.role}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="border-t border-gray-100 p-4 sm:p-5">
                                <h3 className="text-sm font-medium text-gray-600 uppercase mb-3">Quick Actions</h3>
                                <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1">
                                    <button
                                        onClick={openEditModal}
                                        className="w-full text-left px-3 py-2 flex items-center text-sm rounded hover:bg-gray-100 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="w-full text-left px-3 py-2 flex items-center text-sm rounded hover:bg-gray-100 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Change Password
                                    </button>
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="w-full text-left px-3 py-2 flex items-center text-sm rounded hover:bg-gray-100 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                        </svg>
                                        Logout
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full text-left px-3 py-2 flex items-center text-sm rounded hover:bg-gray-100 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Admin Details */}
                    <div className="w-full lg:w-2/3 mt-4 lg:mt-0">
                        {/* Admin Information Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
                            <div className="bg-gray-800 p-3 sm:p-4 text-white">
                                <h2 className="font-semibold text-sm sm:text-base">Administrative Details</h2>
                            </div>
                            <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-600 uppercase mb-3">Basic Information</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-gray-500 text-xs mb-1">Full Name</label>
                                                <p className="text-gray-800 font-medium text-sm sm:text-base">{admin?.name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 text-xs mb-1">Username</label>
                                                <p className="text-gray-800 font-medium text-sm sm:text-base">{admin?.username}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0">
                                        <h3 className="text-sm font-medium text-gray-600 uppercase mb-3">System Information</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-gray-500 text-xs mb-1">Email Address</label>
                                                <p className="text-gray-800 font-medium text-sm sm:text-base break-all">{admin?.email}</p>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 text-xs mb-1">Role</label>
                                                <p className="text-gray-800 font-medium text-sm sm:text-base capitalize">{admin?.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Admin Permissions Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="bg-gray-800 p-3 sm:p-4 text-white">
                                <h2 className="font-semibold text-sm sm:text-base">Permissions & Access Control</h2>
                            </div>
                            <div className="p-4 sm:p-5">
                                <h3 className="text-sm font-medium text-gray-600 uppercase mb-3">Assigned Permissions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                                    {Object.entries(admin?.permissions || {}).map(([key, value]) => (
                                        value && (
                                            <div key={key} className="bg-gray-50 border border-gray-200 rounded p-2 flex items-center text-xs sm:text-sm">
                                                <span className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></span>
                                                <span className="text-gray-700 truncate">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                </span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-green-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-lg border border-green-200 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Profile</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="flex justify-center mb-5 sm:mb-6">
                                <div className="relative">
                                    <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl overflow-hidden border-4 border-green-400/30">
                                        <img
                                            src={previewImage || (admin?.profileImage?.includes('http') ? admin.profileImage : `${backendUrl}/uploads/${admin.profileImage}`)}
                                            alt={admin.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = assets.profile_icon;
                                            }}
                                        />
                                    </div>
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full shadow-lg hover:bg-green-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-black text-sm font-medium mb-2" htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-green-200 rounded-lg py-2.5 px-4 text-gray-800 focus:ring-2 focus:ring-green-400 focus:border-green-400 shadow-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button type="submit" disabled={updateLoading} className="bg-green-600 hover:bg-reen-700 text-white font-bold py-2.5 px-4 sm:px-6 rounded-lg flex items-center shadow-md">
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
            {showPasswordModal && (
                <div className="fixed inset-0 bg-yellow-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-lg border border-yellow-200 animate-fade-in-up overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Change Password</h2>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Request verification code */}
                        <div className="mb-4">
                            <button
                                type="button"
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto"
                                onClick={async () => {
                                    try {
                                        const res = await axios.post(`${backendUrl}/api/admin/send-code`, {}, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        toast[res.data.success ? 'success' : 'error'](res.data.message);
                                    } catch (err) {
                                        toast.error("Failed to send code");
                                    }
                                }}
                            >
                                Send Verification Code to Email
                            </button>
                        </div>

                        {/* Code input + Verify */}
                        <div className="mb-4">
                            <label className="block mb-1 text-sm text-gray-700">Verification Code</label>
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="Enter code from email"
                                    value={passwordData.code}
                                    onChange={(e) => setPasswordData({ ...passwordData, code: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded sm:whitespace-nowrap"
                                    onClick={async () => {
                                        try {
                                            const res = await axios.post(`${backendUrl}/api/admin/verify-code`, {
                                                code: passwordData.code
                                            }, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            toast[res.data.success ? 'success' : 'error'](res.data.message);
                                        } catch (err) {
                                            toast.error("Failed to verify code");
                                        }
                                    }}
                                >
                                    Verify Code
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit}>
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
                                <p className="text-xs text-gray-600 mt-2">
                                    Password must be at least 8 characters and include letters, numbers, and special characters.
                                </p>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-black hover:text-white font-bold py-2.5 px-4 sm:px-6 rounded-lg flex items-center shadow-md transition-colors"
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

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-red-900/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-xl p-6 w-full max-w-md border border-red-200 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-red-600">Delete Account</h2>
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
                            <p className="text-gray-600 text-center text-sm">This action cannot be undone. All your data will be permanently removed.</p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors md:w-1/2"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={updateLoading}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center md:w-1/2"
                            >
                                {updateLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Account"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-200 animate-fade-in-up">
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
                                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            <p className="text-gray-800 text-center font-medium mb-2">Are you sure you want to logout?</p>
                            <p className="text-gray-600 text-center text-sm">You'll need to sign in again to access your account.</p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(false)}
                                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors md:w-1/2"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center md:w-1/2"
                            >
                                Confirm Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;