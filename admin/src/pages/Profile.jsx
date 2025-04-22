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
    const [editMode, setEditMode] = useState(false);
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
        confirmPassword: ''
    });

    const fileInputRef = useRef(null);

    // Fetch admin profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/admin/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    setAdmin(response.data.admin);
                    setFormData({
                        name: response.data.admin.name,
                        username: response.data.admin.username,
                        email: response.data.admin.email,
                    });
                    setLoading(false);
                } else {
                    toast.error(response.data.message || 'Failed to load profile');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Error loading profile. Please try again.');
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [token]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle image upload
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, profileImage: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    // Handle password input changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    // Handle profile update submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.username || !formData.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const form = new FormData();
            form.append('name', formData.name);
            form.append('username', formData.username);
            form.append('email', formData.email);

            if (formData.profileImage) {
                form.append('profileImage', formData.profileImage);
            }

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
                setEditMode(false);
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
            toast.error('Error updating profile. Please try again.');
        }
    };

    // Handle password change submission
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
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
            toast.error('Error changing password. Please try again.');
        }
    };

    // Handle account deletion
    const handleDeleteAccount = async () => {
        try {
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
                navigate('/login'); // Redirect to login page
            } else {
                toast.error(response.data.message || 'Failed to delete account');
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Error deleting account. Please try again.');
            setShowDeleteModal(false);
        }
    };

    // Cancel edit mode
    const handleCancel = () => {
        setEditMode(false);
        setFormData({
            name: admin.name,
            username: admin.username,
            email: admin.email,
            profileImage: null
        });
        if (previewImage) {
            URL.revokeObjectURL(previewImage);
            setPreviewImage(null);
        }
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

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-800 to-green-400 p-6 text-white">
                    <h1 className="text-2xl font-bold">Admin Profile</h1>
                </div>

                <div className="p-6">
                    {/* Profile Header with Image */}
                    <div className="flex flex-col md:flex-row items-center mb-8">
                        <div className="relative mb-4 md:mb-0 md:mr-8">
                            {editMode ? (
                                <>
                                    <div
                                        className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200 relative"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <img
                                            src={previewImage || (admin?.profileImage?.includes('http') ? admin.profileImage : `${backendUrl}/uploads/${admin.profileImage}`)}
                                            alt={admin.name}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-sm font-medium">
                                            Change Photo
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </>
                            ) : (
                                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200">
                                    <img
                                        src={admin?.profileImage?.includes('http') ? admin.profileImage : `${backendUrl}/uploads/${admin.profileImage}`}
                                        alt={admin.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = assets.defaultAvatar || 'https://ralfvanveen.com/wp-content/uploads/2021/06/Placeholder-_-Glossary-800x450.webp';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold text-gray-800">{admin.name}</h2>
                            <p className="text-gray-600 mb-1">@{admin.username}</p>
                            <div className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    Full Name
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                ) : (
                                    <p className="text-gray-800 py-2">{admin.name}</p>
                                )}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                                    Username
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                ) : (
                                    <p className="text-gray-800 py-2">@{admin.username}</p>
                                )}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                    Email Address
                                </label>
                                {editMode ? (
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                ) : (
                                    <p className="text-gray-800 py-2">{admin.email}</p>
                                )}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Role & Permissions
                                </label>
                                <p className="text-gray-800 py-2 capitalize">{admin.role}</p>
                                <div className="mt-2">
                                    {Object.entries(admin.permissions || {}).map(([key, value]) => (
                                        value && (
                                            <span key={key} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2 mb-2">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </span>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-wrap gap-3">
                            {editMode ? (
                                <>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Change Password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setToken('')}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Logout
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Delete Account
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Change Password</h2>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Delete Account</h2>
                        <p className="mb-6 text-gray-700">
                            Are you sure you want to delete your account? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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