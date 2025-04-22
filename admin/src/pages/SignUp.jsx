import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

const AdminSignup = ({ setShowSignup, setToken }) => {
    // Form states
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [adminKey, setAdminKey] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [role, setRole] = useState('staff');

    // Form errors
    const [errors, setErrors] = useState({});

    // Refs
    const fileInputRef = useRef(null);

    // Sanitize text inputs
    const sanitizeInput = (input) => {
        return DOMPurify.sanitize(input.trim());
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!name) newErrors.name = 'Name is required';
        else if (name.length < 3) newErrors.name = 'Name must be at least 3 characters';

        // Username validation
        if (!username) newErrors.username = 'Username is required';
        else if (username.length < 4) newErrors.username = 'Username must be at least 4 characters';
        else if (!/^[a-zA-Z0-9_]+$/.test(username)) newErrors.username = 'Username can only contain letters, numbers and underscore';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) newErrors.email = 'Email is required';
        else if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email';

        // Password validation
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';

        // Confirm password
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        // Admin key validation
        if (!adminKey) newErrors.adminKey = 'Admin registration key is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image must be less than 2MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                toast.error('Only image files are allowed');
                return;
            }

            setProfileImage(file);
            setProfilePreview(URL.createObjectURL(file));
        }
    };

    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('name', sanitizeInput(name));
            formData.append('username', sanitizeInput(username));
            formData.append('email', sanitizeInput(email));
            formData.append('password', password);
            formData.append('role', role);

            if (profileImage) {
                formData.append('profileImage', profileImage);
            }

            const response = await axios.post(`${backendUrl}/api/admin/register`, formData, {
                headers: {
                    'adminkey': adminKey,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('Admin account created successfully!');
                localStorage.setItem('adminToken', response.data.token);

                // Delay setting token to show success message
                setTimeout(() => {
                    setToken(response.data.token);
                }, 1000);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Signup error:', error);
            toast.error(error.response?.data?.message || 'Failed to create admin account');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left side - Signup Form */}
            <motion.div
                className="w-full md:w-1/2 flex items-center justify-center p-8"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="w-full max-w-md">
                    <motion.h2
                        className="text-2xl font-semibold mb-6 text-gray-700"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        Create Admin Account
                    </motion.h2>

                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="space-y-4"
                    >
                        {/* Profile Image Upload */}
                        <div className="flex flex-col items-center mb-4">
                            <div
                                className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-500 mb-2 cursor-pointer"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <img
                                    src={profilePreview || assets.profile_icon}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="text-sm text-green-700 hover:text-green-800"
                            >
                                Upload Photo
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Name</label>
                            <input
                                type="text"
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Username</label>
                            <input
                                type="text"
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            {errors.username && (
                                <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Email</label>
                            <input
                                type="email"
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Role</label>
                            <select
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 border-gray-300"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Password</label>
                            <input
                                type="password"
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Admin Key */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Admin Registration Key</label>
                            <input
                                type="password"
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${errors.adminKey ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Enter admin registration key"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                            />
                            {errors.adminKey && (
                                <p className="mt-1 text-xs text-red-500">{errors.adminKey}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            className="w-full bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 transition duration-300 mt-6"
                            disabled={isSubmitting}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Creating Account...
                                </div>
                            ) : (
                                'Create Admin Account'
                            )}
                        </motion.button>

                        {/* Back to Login */}
                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => setShowSignup(false)}
                                className="text-sm text-green-700 hover:text-green-800"
                            >
                                Back to Login
                            </button>
                        </div>
                    </motion.form>
                </div>
            </motion.div>

            {/* Right side - Logo/Branding */}
            <motion.div
                className="hidden md:flex w-1/2 bg-green-700 items-center justify-center"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="text-center">
                    <motion.h1
                        className="text-4xl font-bold text-white mb-2"
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.7 }}
                    >
                        Join Admin Team!
                    </motion.h1>
                    <motion.div
                        className="bg-white rounded-full p-8 mx-auto w-64 h-64 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                    >
                        <motion.div
                            className="text-green-700"
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <img src={assets.logo} alt="Company Logo" />
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminSignup;