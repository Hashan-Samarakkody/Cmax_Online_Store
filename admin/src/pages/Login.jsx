import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';
import { motion } from 'framer-motion';
import AdminSignup from './SignUp';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ setToken }) => {
  // State for login form
  const navigate = useNavigate();

  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Email entry, 2: Code verification, 3: New password
  const [isResetting, setIsResetting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        // First set token in localStorage
        localStorage.setItem('adminToken', response.data.token);

        // Then set admin role if available
        if (response.data.admin && response.data.admin.role) {
          localStorage.setItem('adminRole', response.data.admin.role);
        }
        
        // Show success message
        toast.success('Login successful!');

        // Set token in context or state
        setToken(response.data.token);

        // Redirect to dashboard or home page
        navigate('/dashboard');
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

  // Handle reset password email submission
  const handleResetEmailSubmit = async () => {
    if (!resetEmail || !validateEmail(resetEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsResetting(true);

    try {
      // Create a dedicated reset password endpoint or use the existing sendVerificationCode
      const response = await axios.post(`${backendUrl}/api/admin/reset-password/send-code`, {
        email: resetEmail
      });

      if (response.data.success) {
        toast.success('Verification code has been sent to your email');
        setResetStep(2); // Move to code verification step
      } else {
        toast.error(response.data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast.error(error.response?.data?.message || 'Error sending verification code');
    } finally {
      setIsResetting(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async () => {
    if (!resetCode || resetCode.length < 6) {
      toast.error('Please enter a valid verification code');
      return;
    }

    setIsResetting(true);

    try {
      const response = await axios.post(`${backendUrl}/api/admin/reset-password/verify-code`, {
        email: resetEmail,
        code: resetCode
      });

      if (response.data.success) {
        toast.success('Code verified successfully');
        setResetStep(3); // Move to new password step
      } else {
        toast.error(response.data.message || 'Invalid or expired verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error(error.response?.data?.message || 'Error verifying code');
    } finally {
      setIsResetting(false);
    }
  };

  // Handle new password submission
  const handleResetPassword = async () => {
    // Password validation
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Password strength check 
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must contain letters, numbers, and special characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsResetting(true);

    try {
      const response = await axios.post(`${backendUrl}/api/admin/reset-password/reset`, {
        email: resetEmail,
        code: resetCode,
        newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successful! Please login with your new password');

        // Reset all fields and close modal
        setShowResetModal(false);
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetStep(1);
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Error resetting password');
    } finally {
      setIsResetting(false);
    }
  };

  // Reset modal content based on current step
  const renderResetModalContent = () => {
    switch (resetStep) {
      case 1: // Email entry
        return (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reset Your Password</h3>
            <p className="text-gray-600 mb-4">Enter your email address and we'll send you a verification code to reset your password.</p>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(sanitizeInput(e.target.value))}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 flex items-center"
                onClick={handleResetEmailSubmit}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Sending...
                  </>
                ) : "Send Verification Code"}
              </button>
            </div>
          </>
        );

      case 2: // Code verification
        return (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Enter Verification Code</h3>
            <p className="text-gray-600 mb-4">We've sent a verification code to <span className="font-medium">{resetEmail}</span>. Please check your inbox.</p>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Verification Code</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter 6-digit code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={6}
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="text-gray-600 hover:text-gray-800"
                onClick={() => setResetStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 flex items-center"
                onClick={handleVerifyCode}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : "Verify Code"}
              </button>
            </div>
          </>
        );

      case 3: // New password
        return (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Set New Password</h3>
            <p className="text-gray-600 mb-4">Create a new password for your account.</p>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(sanitizeInput(e.target.value))}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters with letters, numbers, and special characters.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(sanitizeInput(e.target.value))}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="text-gray-600 hover:text-gray-800"
                onClick={() => setResetStep(2)}
              >
                Back
              </button>
              <button
                type="button"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 flex items-center"
                onClick={handleResetPassword}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : "Reset Password"}
              </button>
            </div>
          </>
        );

      default:
        return null;
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${passwordError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
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
                <motion.button
                  type="button"
                  className="text-sm text-green-700 hover:text-green-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowResetModal(true)}
                >
                  Forget password
                </motion.button>
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

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetStep(1);
                  setResetEmail('');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${resetStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
              <div className={`h-1 w-10 ${resetStep >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${resetStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
              <div className={`h-1 w-10 ${resetStep >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${resetStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
            </div>

            {/* Dynamic content based on current step */}
            {renderResetModalContent()}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;