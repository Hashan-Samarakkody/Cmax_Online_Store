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
            navigate('/');
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
                // Update user state in parent component if needed
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
            {/* Profile image at the top */}
            <div className="flex justify-center py-6 bg-gray-50">
                <div className="relative">
                    <div className="h-35 w-35 rounded-full overflow-hidden border-4 border-white shadow-md">
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

                    {/* Edit button overlay */}
                    <button
                        onClick={triggerFileInput}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 bg-green-500 hover:bg-green-600 text-white rounded-full p-1 shadow-md"
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

            {/* User name and email */}
            <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>

            {/* Navigation links */}
            <div className="p-2">
                <button
                    onClick={() => location.pathname === '/profile' ? setActiveSection('personalInfo') : navigate('/profile')}
                    className={`w-full text-left p-3 mb-1 rounded-md flex items-center ${(location.pathname === '/profile' && activeSection === 'personalInfo') ?
                        'bg-yellow-100 font-medium text-yellow-800' : 'hover:bg-gray-100'
                        }`}
                >
                    <span>Personal Information</span>
                </button>

                <button
                    onClick={() => location.pathname === '/profile' ? setActiveSection('addresses') : navigate('/profile?section=addresses')}
                    className={`w-full text-left p-3 mb-1 rounded-md hover:bg-gray-100 flex items-center ${(location.pathname === '/profile' && activeSection === 'addresses') ?
                        'bg-yellow-100 font-medium text-yellow-800' : ''
                        }`}
                >
                    <span>Manage Addresses</span>
                </button>

                <button
                    onClick={onShowPasswordModle}
                    className="w-full text-left p-3 mb-1 rounded-md hover:bg-gray-100 flex items-center"
                >
                    <span>Change Password</span>
                </button>

                <button
                    onClick={onShowDeleteModle}
                    className="w-full text-left p-3 mb-1 rounded-md hover:bg-gray-100 flex items-center text-red-600"
                >
                    <span>Delete Account</span>
                </button>

                <button
                    onClick={onShowLogoutModle}
                    className="w-full text-left p-3 mb-1 rounded-md hover:bg-gray-100 flex items-center"
                >
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileSidebar;