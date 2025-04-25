import React, { useState, useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify'
import { assets } from '../assets/assets';
import { FiMail, FiLock, FiLoader, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
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
      const response = await axios.post(backendUrl + '/api/user/reset-password/send-code', {
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
      const response = await axios.post(backendUrl + '/api/user/reset-password/verify-code', {
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
      const response = await axios.post(backendUrl + '/api/user/reset-password/reset', {
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
      <p className="text-red-500 text-xs mt-1">{message}</p>
    ) : null;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <form onSubmit={onSubmitHandler} className="py-8 px-4 sm:px-0">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-teal-400 bg-clip-text text-transparent">Welcome Back!</h1>
                <p className="text-gray-600">Log in to your account</p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="space-y-5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiMail className="text-gray-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    className={`w-full p-3 pl-10 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300`}
                    value={email}
                    onChange={(e) => handleInputChange(e, setEmail, 'email')}
                    required
                  />
                  <ErrorMessage message={errors.email} />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    className={`w-full p-3 pl-10 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300`}
                    value={password}
                    onChange={(e) => handleInputChange(e, setPassword, 'password')}
                    required
                  />
                  <ErrorMessage message={errors.password} />
                </div>
              </div>

              <div className="mt-2 text-right">
                <span
                  className="text-green-600 text-sm cursor-pointer hover:underline"
                  onClick={() => setShowResetModal(true)}
                >
                  Forgot Password?
                </span>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </button>

                <div className="my-4 flex items-center">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <p className="mx-4 text-gray-500 text-sm">OR</p>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <button
                  type="button"
                  className="w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                >
                  <FcGoogle size={20} />
                  <span>Continue with Google</span>
                </button>

                <div className="text-center mt-6 text-sm">
                  <span className="text-gray-600">Don't have an account? </span>
                  <Link
                    to="/signup"
                    className="text-green-600 font-medium cursor-pointer hover:underline"
                  >
                    Sign up now
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600">
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${Math.random() * 20 + 5}px`,
                  height: `${Math.random() * 20 + 5}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.8 + 0.2,
                  animation: `float ${Math.random() * 10 + 10}s infinite linear`
                }}
              />
            ))}
          </div>
        </div>

        {/* Centered image with glass effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-3/4 h-3/4 backdrop-blur-sm bg-white/20 rounded-3xl overflow-hidden border border-white/30 shadow-2xl flex items-center justify-center p-8">
            <img src={assets.login_img} className="max-w-full max-h-full object-contain" alt="Login illustration" />
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
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

      {/* Add some keyframe animations for the floating effect */}
      <style dangerouslySetInnerHTML={{
        __html: `
    @keyframes float {
      0%, 100% {
        transform: translateY(0) translateX(0);
      }
      25% {
        transform: translateY(-20px) translateX(10px);
      }
      50% {
        transform: translateY(0) translateX(20px);
      }
      75% {
        transform: translateY(20px) translateX(10px);
      }
    }
  `
      }} />
    </div>
  )
}

export default Login