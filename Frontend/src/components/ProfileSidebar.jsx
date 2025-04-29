import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';

const ProfileSidebar = ({ user, setActiveSection, activeSection, onShowPasswordModle, onShowDeleteModle, onShowLogoutModle }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get profile image URL with fallback to default avatar
    const getProfileImageUrl = () => {
        if (user?.profileImage) {
            return user.profileImage;
        }
        return assets.user_placeholder;
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
                    </div>
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