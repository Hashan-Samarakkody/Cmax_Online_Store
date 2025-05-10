import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProfileSidebar = ({ user, setActiveSection, activeSection, onShowPasswordModle, onShowDeleteModle, onShowLogoutModle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Debug logging
    console.log("ProfileSidebar user data:", user);

    // Get profile image URL with fallback to default avatar
    const getProfileImageUrl = () => {
        if (user?.profileImage) {
            return user.profileImage;
        }
        return assets.user_placeholder;
    };

    // Handle image change
    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size must be less than 2MB');
                return;
            }

            // Upload image
            await uploadImage(file);
        }
    };

    // Upload profile image
    const uploadImage = async (file) => {
        setUploading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('You must be logged in to update your profile');
            navigate('/login');
            return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await axios.put(`${backendUrl}/api/user/update-profile`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('Profile image updated successfully');
                if (response.data.user) {
                    // This will refresh the image without requiring a full page reload
                    window.location.reload();
                }
            } else {
                toast.error(response.data.message || 'Failed to update profile image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Error uploading profile image');
        } finally {
            setUploading(false);
        }
    };

    // Trigger file input click
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Profile image at the top with OAuth badge */}
            <div className="flex justify-center py-6 bg-gray-50">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                        <img
                            src={getProfileImageUrl()}
                            alt={user?.firstName || "Profile"}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = assets.user_placeholder;
                            }}
                        />
                        {uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                            </div>
                        )}
                    </div>

                    {/* OAuth badge if applicable */}
                    {user?.authProvider && user.authProvider !== 'local' && (
                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                            {user.authProvider === 'google' ? (
                                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 3.48V7.68H14.6C14.4 9.04 13.8 10.08 12.9 10.8C12 11.52 10.7 12 9 12C6.48 12 4.37 10.36 3.5 8.08C3.3 7.56 3.2 7.04 3.2 6.48C3.2 5.92 3.3 5.4 3.5 4.88C4.14 3.04 5.64 1.64 7.52 1.16C8.12 1 8.8 0.92 9.48 0.96C11.04 1.08 12.35 1.84 13.32 2.92L16.22 0C14.5 -1.44 12.5 -2 10.36 -2C6.64 -2 3.37 0.4 1.6 3.68C0.88 4.96 0.5 6.44 0.5 8C0.5 9.56 0.88 11.04 1.6 12.32C3.37 15.6 6.64 18 10.36 18C12.8 18 14.96 17.12 16.5 15.44C18.28 13.56 19.2 10.96 19.2 8C19.2 7.52 19.16 7.04 19.08 6.6H9V3.48Z" fill="#4285F4" />
                                    </svg>
                                </div>
                            ) : user.authProvider === 'facebook' ? (
                                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 12.993 3.92547 16.3027 7.78125 16.9028V11.3906H5.67188V9H7.78125V7.23672C7.78125 5.19141 8.9375 4.10938 10.8125 4.10938C11.7344 4.10938 12.6562 4.27031 12.6562 4.27031V6.32812H11.6016C10.5469 6.32812 10.2188 6.96328 10.2188 7.59844V9H12.5625L12.1953 11.3906H10.2188V16.9028C14.0745 16.3027 17 12.993 17 9Z" fill="#1877F2" />
                                    </svg>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Edit button overlay */}
                    <button
                        onClick={triggerFileInput}
                        disabled={uploading}
                        className="absolute bottom-0 left-0 bg-green-500 hover:bg-green-600 text-white rounded-full p-1 shadow-md"
                        title="Change profile picture"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>

                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg,image/gif"
                    />
                </div>
            </div>

            {/* User name and email with OAuth indicator */}
            <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 truncate flex items-center">
                    {user?.firstName || user?.username || "User"} {user?.lastName || ""}
                    {user?.authProvider && user.authProvider !== 'local' && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {user.authProvider === 'google' ? 'Google' : 'Facebook'}
                        </span>
                    )}
                </h3>
                <p className="text-sm text-gray-500 truncate">{user?.email || "No email"}</p>
            </div>

            {/* Navigation links */}
            <div className="p-2">
                <button
                    onClick={() => location.pathname === '/profile' ? setActiveSection('personalInfo') : navigate('/profile')}
                    className={`w-full text-left p-3 mb-1 rounded-md flex items-center ${(location.pathname === '/profile' && activeSection === 'personalInfo') ?
                        'bg-yellow-100 font-medium text-yellow-800' : 'hover:bg-gray-100'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>Personal Information</span>
                </button>

                <button
                    onClick={() => location.pathname === '/profile' ? setActiveSection('addresses') : navigate('/profile?section=addresses')}
                    className={`w-full text-left p-3 mb-1 rounded-md hover:bg-gray-100 flex items-center ${(location.pathname === '/profile' && activeSection === 'addresses') ?
                        'bg-yellow-100 font-medium text-yellow-800' : ''
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Manage Addresses</span>
                </button>

                <button
                    onClick={onShowPasswordModle}
                    className="w-full text-left p-3 mb-1 rounded-md hover:bg-gray-100 flex items-center"
                >
                    {user?.authProvider && user.authProvider !== 'local' ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                            <span>OAuth Account</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-1.243-1.243A6 6 0 1118 8zm-6-4a1 1 0 00-1 1v1.586l-1.707 1.707A1 1 0 008 8.586V11h2v-.586a1 1 0 01.293-.707L12 8l-1.293-1.293A1 1 0 0010 6V4.414a1 1 0 00-1-1H6.414a1 1 0 00-.707.293L4.586 5H2.414A1 1 0 001 6a1 1 0 001 1h2.172l1.707 1.707A1 1 0 006.586 9H4a1 1 0 00-1 1v1a1 1 0 001 1h2v-.586a1 1 0 01.293-.707L9 9l-1.293-1.293A1 1 0 007 7V5.414a1 1 0 01.293-.707L9 3l-1.293-1.293A1 1 0 007 1h2a1 1 0 00.707.293L11 3l1.293-1.293A1 1 0 0013 1h5a1 1 0 011 1v5a1 1 0 01-.293.707L17 9l1.293 1.293A1 1 0 0119 11v1a1 1 0 01-1 1h-2v-.586a1 1 0 00-.293-.707L14 10l1.293 1.293A1 1 0 0116 12v3a1 1 0 01-1 1h-6a1 1 0 01-1-1v-3a1 1 0 01.293-.707L9 10l1.293 1.293A1 1 0 0111 12v.586l.707.707A1 1 0 0012 14h1a1 1 0 001-1v-1a1 1 0 00-1-1h-1.586l-.707-.707A1 1 0 0010 9.414V8h2v1.586a1 1 0 00.293.707L13 11h1v-1.586a1 1 0 00-.293-.707L12 7.414V6h2v1.586a1 1 0 01.293.707L16 10v1a1 1 0 01-1 1h-6a1 1 0 01-1-1v-1a1 1 0 01.293-.707L9 8V6.414a1 1 0 01.293-.707L11 4.414V6h2V4.414a1 1 0 00-.293-.707L11 2h-1a1 1 0 00-1 1v2z" clipRule="evenodd" />
                            </svg>
                            <span>Change Password</span>
                        </>
                    )}
                </button>

                <button
                    onClick={onShowDeleteModle}
                    className="w-full text-left p-3 mb-1 rounded-md hover:bg-gray-100 flex items-center text-red-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Delete Account</span>
                </button>

                <button
                    onClick={onShowLogoutModle}
                    className="w-full text-left p-3 mb-1 rounded-md hover:bg-gray-100 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileSidebar;