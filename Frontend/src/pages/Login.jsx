import React, { useState, useContext, useEffect, useRef } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import DOMPurify from 'dompurify'
import { assets } from '../assets/assets';
import { FiUser, FiMail, FiLock, FiPhone, FiCamera, FiLoader, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);
  const fileInputRef = useRef(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
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
    name: '',
    email: '',
    password: '',
    username: '',
    phoneNumber: '',
    profileImage: '',
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

  // Validate name
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name) && name.length >= 2;
  };

  // Validate username
  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username) && username.length >= 3;
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[\d\s\+\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  };

  // Validate password strength
  const validatePassword = (password) => {
    return password.length >= 8;
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      setErrors({ ...errors, profileImage: 'Please select a valid image file (JPEG, PNG, or WebP)' });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, profileImage: 'Image size should be less than 5MB' });
      return;
    }

    // Clear any previous errors
    setErrors({ ...errors, profileImage: '' });

    // Set image preview
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setProfileImage(file);
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

    if (currentState === 'Sign Up') {
      // Name validation
      if (!name) {
        newErrors.name = 'Name is required';
        isValid = false;
      } else if (!validateName(name)) {
        newErrors.name = 'Name must be at least 2 characters and contain only letters and spaces';
        isValid = false;
      }

      // Username validation
      if (!username) {
        newErrors.username = 'Username is required';
        isValid = false;
      } else if (!validateUsername(username)) {
        newErrors.username = 'Username must be alphanumeric and at least 3 characters';
        isValid = false;
      }

      // Phone validation (if provided)
      if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
        isValid = false;
      }
    }

    // Email validation (for both login and signup)
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
    } else if (currentState === 'Sign Up' && !validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
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
      if (currentState === 'Sign Up') {
        // Create form data for multipart form submission (for image upload)
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('username', username);

        if (phoneNumber) {
          formData.append('phoneNumber', phoneNumber);
        }

        if (profileImage) {
          formData.append('profileImage', profileImage);
        }

        const response = await axios.post(backendUrl + '/api/user/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });

        if (response.data.success) {
          toast.success('Account created successfully!');
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
        } else {
          setFormError(response.data.message || 'Registration failed');
          toast.error(response.data.message);
        }
      } else {
        const response = await axios.post(backendUrl + '/api/user/login', { email, password });

        if (response.data.success) {
          toast.success('Logged in successfully!');
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
        } else {
          setFormError(response.data.message || 'Login failed');
          toast.error(response.data.message);
        }
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
                className={`w-full p-3 rounded-lg border ${errors.resetEmail ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
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
                className={`w-full p-3 rounded-lg border ${errors.resetCode ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
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
                className={`w-full p-3 rounded-lg border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3`}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => handleInputChange(e, setNewPassword, 'newPassword')}
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}

              <input
                type="password"
                className={`w-full p-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
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

  // Enhanced signup form with image upload
  const renderSignupForm = () => {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create an account</h1>
          <p className="text-gray-600">Join the Cmax community today</p>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-4 rounded-lg">
            {formError}
          </div>
        )}

        {/* Profile Image Upload */}
        <div className="mb-6 flex flex-col items-center">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden mb-3 bg-gray-100 flex items-center justify-center border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            {profilePreview ? (
              <img
                src={profilePreview}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser size={40} className="text-gray-400" />
            )}
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full">
              <FiCamera size={14} />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          <p className="text-sm text-gray-500 mb-1">Profile Picture</p>
          <ErrorMessage message={errors.profileImage} />
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiUser className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Full Name"
              className={`w-full p-3 pl-10 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={name}
              onChange={(e) => handleInputChange(e, setName, 'name')}
              required
            />
            <ErrorMessage message={errors.name} />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiPhone className="text-gray-500" />
            </div>
            <input
              type="tel"
              placeholder="Phone Number"
              className={`w-full p-3 pl-10 rounded-lg border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={phoneNumber}
              onChange={(e) => handleInputChange(e, setPhoneNumber, 'phoneNumber')}
            />
            <ErrorMessage message={errors.phoneNumber} />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiUser className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Username"
              className={`w-full p-3 pl-10 rounded-lg border ${errors.username ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={username}
              onChange={(e) => handleInputChange(e, setUsername, 'username')}
              required
            />
            <ErrorMessage message={errors.username} />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiMail className="text-gray-500" />
            </div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full p-3 pl-10 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
              className={`w-full p-3 pl-10 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={password}
              onChange={(e) => handleInputChange(e, setPassword, 'password')}
              required
            />
            <ErrorMessage message={errors.password} />
            <p className="text-xs text-gray-500 mt-1 pl-1">Password must be at least 8 characters</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Account"
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
            <span>Sign up with Google</span>
          </button>

          <div className="text-center mt-6 text-sm">
            <span className="text-gray-600">Already have account? </span>
            <span
              className="text-blue-600 font-medium cursor-pointer hover:underline"
              onClick={() => setCurrentState('Login')}
            >
              Log in
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced login form with futuristic UI
  const renderLoginForm = () => {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Welcome Back</h1>
          <p className="text-gray-600">Log in to your Cmax account</p>
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
              className={`w-full p-3 pl-10 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
              className={`w-full p-3 pl-10 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={password}
              onChange={(e) => handleInputChange(e, setPassword, 'password')}
              required
            />
            <ErrorMessage message={errors.password} />
          </div>
        </div>

        <div className="mt-2 text-right">
          <span
            className="text-blue-600 text-sm cursor-pointer hover:underline"
            onClick={() => setShowResetModal(true)}
          >
            Forgot Password?
          </span>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center"
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
            <span
              className="text-blue-600 font-medium cursor-pointer hover:underline"
              onClick={() => setCurrentState('Sign Up')}
            >
              Sign up now
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <form onSubmit={onSubmitHandler} className="py-8 px-4 sm:px-0">
            {currentState === 'Login' ? renderLoginForm() : renderSignupForm()}
          </form>
        </div>
      </div>

      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600">
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
            {currentState === 'Login' ? (
              <img src={assets.login_img} className="max-w-full max-h-full object-contain" alt="Login illustration" />
            ) : (
              <img src={assets.signup_img} className="max-w-full max-h-full object-contain" alt="Signup illustration" />
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {renderResetModalContent()}
          </div>
        </div>
      )}

      {/* Add some keyframe animations for the floating effect */}
      <style jsx>{`
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
      `}</style>
    </div>
  )
}

export default Login