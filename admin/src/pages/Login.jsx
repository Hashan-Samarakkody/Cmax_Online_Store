import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';
import { motion } from 'framer-motion';
import AdminSignup from './SignUp';
import DOMPurify from 'dompurify';

const LoginPage = ({ setToken }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sanitize input
  const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input.trim());
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  // Validate password
  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  // Handle email change
  const handleEmailChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    setEmail(sanitized);
    validateEmail(sanitized);
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    setPassword(sanitized);
    validatePassword(sanitized);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(backendUrl + '/api/admin/login', { email, password });

      if (response.data.success) {
        // Save token to localStorage
        localStorage.setItem('adminToken', response.data.token);

        // Success animation before setting token
        toast.success('Login successful!');
        setTimeout(() => {
          setToken(response.data.token);
        }, 800);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If signup mode is active, show signup component
  if (showSignup) {
    return <AdminSignup setShowSignup={setShowSignup} setToken={setToken} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Login Form */}
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
            Admin Login
          </motion.h2>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label className="block text-sm text-gray-600 mb-2">Email Address</label>
              <input
                type="email"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${emailError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                placeholder="Enter your email address"
                value={email}
                onChange={handleEmailChange}
                required
              />
              {emailError && (
                <motion.p
                  className="mt-1 text-xs text-red-500"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  {emailError}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <label className="block text-sm text-gray-600 mb-2">Password</label>
              <input
                type="password"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${passwordError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
              {passwordError && (
                <motion.p
                  className="mt-1 text-xs text-red-500"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  {passwordError}
                </motion.p>
              )}
              <div className="flex justify-end mt-2">
                <motion.a
                  href="#"
                  className="text-sm text-green-700 hover:text-green-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Forget password
                </motion.a>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              className="w-full bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 transition duration-300"
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
                  Logging in...
                </div>
              ) : (
                'Log in'
              )}
            </motion.button>
          </motion.form>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-sm text-gray-600">
              Need a new admin account?
              <motion.button
                type="button"
                className="text-green-700 hover:text-green-800 ml-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSignup(true)}
              >
                Sign up here
              </motion.button>
            </p>
          </motion.div>
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
            Welcome!
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

export default LoginPage;