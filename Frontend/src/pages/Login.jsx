import React, { useState, useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify'
import { assets } from '../assets/assets';
import { FiMail, FiLock, FiLoader, FiArrowRight, FiArrowLeft, FiShoppingBag, FiShield, FiTruck } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Login = () => {
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [isResetting, setIsResetting] = useState(false);

  // Animation & carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);

  // Carousel content
  const carouselItems = [
    {
      image: assets.exclusive_collections,
      title: "Exclusive Collections",
      quote: "Style is a way to say who you are without having to speak."
    },
    {
      image: assets.premium_quality,
      title: "Premium Quality",
      quote: "Quality is remembered long after the price is forgotten."
    },
    {
      image: assets.fast_delivery,
      title: "Fast Delivery",
      quote: "Time is valuable. We make sure you get your items quickly."
    },
    {
      image: assets.luxury_fashion,
      title: "Trendy Fashion",
      quote: "Fashion is about dressing according to what's fashionable. Style is more about being yourself."
    },
    {
      image: assets.sustainable_choices,
      title: "Sustainable Choices",
      quote: "We don't need a handful of people doing zero waste perfectly. We need millions doing it imperfectly."
    },
    {
      image: assets.seasonal_favorites,
      title: "Seasonal Favorites",
      quote: "To be irreplaceable, one must always be different."
    },
    {
      image: assets.custome_satisfaction,
      title: "Customer Satisfaction",
      quote: "The customer's perception is your reality."
    },
    {
      image: assets.modern_lifestyle,
      title: "Modern Lifestyle",
      quote: "Life isn't perfect, but your outfit can be."
    }
  ];

  // Validation errors
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    resetEmail: '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  // General form error
  const [formError, setFormError] = useState('');

  // Sanitize all inputs with DOMPurify
  const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input.trim());
  };

  // Social login functions
  const handleGoogleLogin = () => {
    window.location.href = `${backendUrl}/api/user/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${backendUrl}/api/user/auth/facebook`;
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle input changes with sanitization
  const handleInputChange = (e, setter, field) => {
    const sanitized = sanitizeInput(e.target.value);
    setter(sanitized);

    // Clear error when user starts typing again
    setErrors({ ...errors, [field]: '' });
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Reset form error
    setFormError('');

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Form submit handler
  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Validate form first
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(backendUrl + '/api/user/login', { email, password });

      if (response.data.success) {
        toast.success('Logged in successfully!');
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      } else {
        setFormError(response.data.message || 'Login failed');
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password reset handlers
  const handleResetEmailSubmit = async () => {
    // Validate email
    if (!resetEmail || !validateEmail(resetEmail)) {
      setErrors({ ...errors, resetEmail: 'Please enter a valid email address' });
      return;
    }

    setIsResetting(true);
    try {
      const response = await axios.post(backendUrl + '/api/user/send-reset-code', {
        email: resetEmail
      });

      if (response.data.success) {
        toast.success('Verification code sent to your email');
        setResetStep(2);
      } else {
        toast.error(response.data.message || 'Failed to send verification code');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode || resetCode.length < 4) {
      setErrors({ ...errors, resetCode: 'Please enter the verification code' });
      return;
    }

    setIsResetting(true);
    try {
      const response = await axios.post(backendUrl + '/api/user/verify-reset-code', {
        email: resetEmail,
        code: resetCode
      });

      if (response.data.success) {
        toast.success('Code verified successfully');
        setResetStep(3);
      } else {
        toast.error(response.data.message || 'Invalid verification code');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetPassword = async () => {
    // Validate passwords
    if (!newPassword || newPassword.length < 8) {
      setErrors({ ...errors, newPassword: 'Password must be at least 8 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsResetting(true);
    try {
      const response = await axios.post(backendUrl + '/api/user/reset-password', {
        email: resetEmail,
        code: resetCode,
        password: newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successfully');
        setShowResetModal(false);
        setResetStep(1);
        // Clear all reset form fields
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatingOut(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
        setAnimatingOut(false);
      }, 500);
    }, 7000); // Increased from 5000 to 7000 to give more time for reading quotes

    return () => clearInterval(timer);
  }, [carouselItems.length]);

  // Reset modal content based on current step
  const renderResetModalContent = () => {
    switch (resetStep) {
      case 1:
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Reset Password</h3>
            <p className="mb-4 text-gray-600">Enter your email address to receive a verification code</p>
            <div className="mb-4">
              <input
                type="email"
                className={`w-full p-3 rounded-lg border ${errors.resetEmail ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="Email Address"
                value={resetEmail}
                onChange={(e) => handleInputChange(e, setResetEmail, 'resetEmail')}
              />
              {errors.resetEmail && <p className="text-red-500 text-xs mt-1">{errors.resetEmail}</p>}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                onClick={handleResetEmailSubmit}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Code <FiArrowRight className="ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Verification Code</h3>
            <p className="mb-4 text-gray-600">Enter the verification code sent to {resetEmail}</p>
            <div className="mb-4">
              <input
                type="text"
                className={`w-full p-3 rounded-lg border ${errors.resetCode ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="Verification Code"
                value={resetCode}
                onChange={(e) => handleInputChange(e, setResetCode, 'resetCode')}
              />
              {errors.resetCode && <p className="text-red-500 text-xs mt-1">{errors.resetCode}</p>}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 flex items-center text-gray-600 hover:text-gray-800"
                onClick={() => setResetStep(1)}
              >
                <FiArrowLeft className="mr-1" /> Back
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                onClick={handleVerifyCode}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code <FiArrowRight className="ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Create New Password</h3>
            <p className="mb-4 text-gray-600">Enter your new password</p>
            <div className="mb-4">
              <input
                type="password"
                className={`w-full p-3 rounded-lg border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 mb-3`}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => handleInputChange(e, setNewPassword, 'newPassword')}
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}

              <input
                type="password"
                className={`w-full p-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => handleInputChange(e, setConfirmPassword, 'confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 flex items-center text-gray-600 hover:text-gray-800"
                onClick={() => setResetStep(2)}
              >
                <FiArrowLeft className="mr-1" /> Back
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                onClick={handleResetPassword}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Navigate home if already logged in
  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  // Error message component for form fields
  const ErrorMessage = ({ message }) => {
    return message ? (
      <motion.p
        className="text-red-500 text-xs mt-1"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {message}
      </motion.p>
    ) : null;
  };

  return (
    <div className="flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden h-fit">
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={onSubmitHandler} className="py-4 px-4 sm:px-0">
            <div className="w-full max-w-md mx-auto">

              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-green-500 to-teal-400 bg-clip-text text-transparent">Welcome Back!</h1>
                <p className="text-gray-600 text-sm">Log in to continue your shopping experience</p>
              </motion.div>

              {formError && (
                <motion.div
                  className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 mb-3 rounded-lg text-sm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formError}
                </motion.div>
              )}

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiMail className="text-green-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    className={`w-full p-2 pl-10 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-sm`}
                    value={email}
                    onChange={(e) => handleInputChange(e, setEmail, 'email')}
                    required
                  />
                  <ErrorMessage message={errors.email} />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiLock className="text-green-500" />
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    className={`w-full p-2 pl-10 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-sm`}
                    value={password}
                    onChange={(e) => handleInputChange(e, setPassword, 'password')}
                    required
                  />
                  <ErrorMessage message={errors.password} />
                </div>
              </motion.div>

              <motion.div
                className="mt-1 text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span
                  className="text-green-600 text-xs cursor-pointer hover:underline transition-colors duration-200"
                  onClick={() => setShowResetModal(true)}
                >
                  Forgot Password?
                </span>
              </motion.div>

              <motion.div
                className="mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded-lg shadow-md transition-all duration-300 transform hover:shadow-lg hover:translate-y-[-2px] disabled:opacity-70 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <FiLoader className="animate-spin mr-2" />
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    <span>Log In</span>
                  )}
                </motion.button>

                <div className="my-3 flex items-center">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <p className="mx-4 text-gray-500 text-xs">OR</p>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-md py-2.5 hover:bg-gray-50 transition-all"
                  >
                    <FcGoogle className="text-red-500" />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white rounded-md py-2.5 hover:bg-[#166FE5] transition-all"
                  >
                    <FaFacebook />
                    <span>Continue with Facebook</span>
                  </button>
                </div>

                <div className="text-center mt-3">
                  <span className="text-gray-600 text-sm">Don't have an account? </span>
                  <Link
                    to="/signup"
                    className="text-green-600 font-medium hover:text-green-800 hover:underline transition-colors duration-200 text-sm"
                  >
                    Sign up now
                  </Link>
                </div>
              </motion.div>
            </div>
          </form>
        </motion.div>
      </div>

      <motion.div
        className="hidden md:block md:w-1/2 relative overflow-hidden"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
      >
        {/* Full-screen carousel - reduced padding/margins */}
        <div className="absolute inset-0">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={currentSlide}
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              onAnimationStart={() => setAnimatingOut(true)}
            >
              <img
                src={carouselItems[currentSlide].image}
                alt={carouselItems[currentSlide].title}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40"></div>

              {/* Quote with reduced padding */}
              <motion.div
                className="absolute top-0 left-0 p-5 z-10"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <p className="text-white/95 text-base text-center font-light italic max-w-md">
                  "{carouselItems[currentSlide].quote}"
                </p>
              </motion.div>

              {/* Title with reduced padding */}
              <motion.div
                className="absolute inset-x-0 bottom-0 p-5 z-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-green-400 mr-2"></div>
                  <h2 className="text-white text-2xl font-bold">
                    {carouselItems[currentSlide].title}
                  </h2>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Smaller navigation arrows */}
        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 transform -translate-y-1/2 z-20">
          <motion.button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1))}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <motion.button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselItems.length)}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Reset Password Modal - More compact version */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-3 text-white flex justify-between items-center">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h3 className="font-bold text-sm">Password Recovery</h3>
              </div>
              <motion.button
                onClick={() => {
                  setShowResetModal(false);
                  setResetStep(1);
                  setResetEmail('');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-white hover:text-gray-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>

            {/* Step indicators - more compact */}
            <div className="flex items-center justify-center py-2 bg-green-50">
              <motion.div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs ${resetStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                animate={{ scale: resetStep === 1 ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              >1</motion.div>
              <motion.div
                className={`h-1 w-8 ${resetStep >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}
                animate={{
                  width: resetStep >= 2 ? "2rem" : "1.5rem",
                  backgroundColor: resetStep >= 2 ? "#22c55e" : "#e5e7eb"
                }}
                transition={{ duration: 0.4 }}
              ></motion.div>
              <motion.div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs ${resetStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                animate={{ scale: resetStep === 2 ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              >2</motion.div>
              <motion.div
                className={`h-1 w-8 ${resetStep >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}
                animate={{
                  width: resetStep >= 3 ? "2rem" : "1.5rem",
                  backgroundColor: resetStep >= 3 ? "#22c55e" : "#e5e7eb"
                }}
                transition={{ duration: 0.4 }}
              ></motion.div>
              <motion.div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs ${resetStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                animate={{ scale: resetStep === 3 ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              >3</motion.div>
            </div>

            {/* Modify the renderResetModalContent function to have more compact padding */}
            <AnimatePresence mode="wait">
              <motion.div
                key={resetStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderResetModalContent()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Login