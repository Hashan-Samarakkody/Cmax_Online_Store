import React, { useState, useContext, useEffect, useRef } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import DOMPurify from 'dompurify'
import { assets } from '../assets/assets';
import { FiUser, FiMail, FiLock, FiPhone, FiCamera, FiLoader, FiShoppingBag, FiShield } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SignUp = () => {
 const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

 // Form fields
 const [firstName, setFirstName] = useState('');
 const [lastName, setLastName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [username, setUsername] = useState('');
 const [phoneNumber, setPhoneNumber] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);

 // Profile image state
 const [profileImage, setProfileImage] = useState(null);
 const [previewImage, setPreviewImage] = useState(null);
 const fileInputRef = useRef(null);

 // Carousel state
 const [currentSlide, setCurrentSlide] = useState(0);
 const testimonials = [
  { name: "Sarah J.", text: "The shopping experience was incredible. Fast delivery and excellent products!", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Michael T.", text: "Best online store I've used. Their customer service is outstanding!", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Emma R.", text: "I love the quality and variety of products. Will definitely shop again!", avatar: "https://randomuser.me/api/portraits/women/68.jpg" }
 ];

 // Animation state
 const [animationComplete, setAnimationComplete] = useState(false);

 // Validation errors
 const [errors, setErrors] = useState({
  email: '',
  password: '',
  username: '',
  phoneNumber: '',
  firstName: '',
  lastName: '',
  profileImage: ''
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
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
 };

 // Validate password strength
 const validatePassword = (password) => {
  return password.length >= 8;
 };

 // Validate image file
 const validateImageFile = (file) => {
  // Check if file exists
  if (!file) return true;

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
   return false;
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
   return false;
  }

  return true;
 };

 // Handle image selection
 const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Clear any previous image error
  setErrors({ ...errors, profileImage: '' });

  // Validate image
  if (!validateImageFile(file)) {
   setErrors({
    ...errors,
    profileImage: 'Please select a valid image file (JPEG, PNG or WebP) under 5MB'
   });
   return;
  }

  setProfileImage(file);

  // Create preview URL
  const reader = new FileReader();
  reader.onloadend = () => {
   setPreviewImage(reader.result);
  };
  reader.readAsDataURL(file);
 };

 // Trigger file input click
 const triggerFileInput = () => {
  fileInputRef.current.click();
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

  // Sanitize all inputs
  const sanitizedFirstName = sanitizeInput(firstName);
  const sanitizedLastName = sanitizeInput(lastName);
  const sanitizedUsername = sanitizeInput(username);
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedPassword = sanitizeInput(password);
  const sanitizedPhoneNumber = sanitizeInput(phoneNumber);

  // First name and last name validation
  if (!validateName(sanitizedFirstName)) {
   newErrors.firstName = 'First name must be at least 2 characters and contain only letters';
   isValid = false;
  }

  if (!validateName(sanitizedLastName)) {
   newErrors.lastName = 'Last name must be at least 2 characters and contain only letters';
   isValid = false;
  }

  // Username validation
  if (!sanitizedUsername) {
   newErrors.username = 'Username is required';
   isValid = false;
  } else if (!validateUsername(sanitizedUsername)) {
   newErrors.username = 'Username must be alphanumeric and at least 3 characters';
   isValid = false;
  }

  // Email validation
  if (!sanitizedEmail) {
   newErrors.email = 'Email is required';
   isValid = false;
  } else if (!validateEmail(sanitizedEmail)) {
   newErrors.email = 'Please enter a valid email';
   isValid = false;
  }

  // Phone validation (if provided)
  if (sanitizedPhoneNumber && !validatePhoneNumber(sanitizedPhoneNumber)) {
   newErrors.phoneNumber = 'Please enter a valid phone number (starting with 0, 10 digits)';
   isValid = false;
  }

  // Password validation
  if (!sanitizedPassword) {
   newErrors.password = 'Password is required';
   isValid = false;
  } else if (!validatePassword(sanitizedPassword)) {
   newErrors.password = 'Password must be at least 8 characters';
   isValid = false;
  }

  // Profile image validation
  if (profileImage && !validateImageFile(profileImage)) {
   newErrors.profileImage = 'Please select a valid image file (JPEG, PNG or WebP) under 5MB';
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
   // Create form data for multipart form submission
   const formData = new FormData();
   formData.append('firstName', firstName);
   formData.append('lastName', lastName);
   formData.append('email', email);
   formData.append('password', password);
   formData.append('username', username);
   if (phoneNumber) formData.append('phoneNumber', phoneNumber);
   if (profileImage) formData.append('profileImage', profileImage);

   const response = await axios.post(`${backendUrl}/api/user/register`, formData, {
    headers: {
     'Content-Type': 'multipart/form-data',
    }
   });

   if (response.data.success) {
    toast.success('Account created successfully!');
    setToken(response.data.token);
    localStorage.setItem('token', response.data.token);
    navigate('/');
   } else {
    setFormError(response.data.message || 'Registration failed');
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

 // Navigate home if already logged in
 useEffect(() => {
  if (token) {
   navigate('/');
  }
 }, [token, navigate]);

 // Auto-advance carousel
 useEffect(() => {
  const timer = setInterval(() => {
   setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  }, 5000);

  return () => clearInterval(timer);
 }, [testimonials.length]);

 useEffect(() => {
  // Set animation complete after initial load
  const timer = setTimeout(() => {
   setAnimationComplete(true);
  }, 1500);

  return () => clearTimeout(timer);
 }, []);

 // Error message component for form fields
 const ErrorMessage = ({ message }) => {
  return message ? (
   <motion.p
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-red-500 text-xs mt-1"
   >
    {message}
   </motion.p>
  ) : null;
 };

 // Feature benefits
 const features = [
  { icon: <FiShoppingBag />, title: "Easy Shopping", desc: "Browse thousands of products" },
  { icon: <FiShield />, title: "Secure Checkout", desc: "Your data is always protected" },
 ];

 return (
  <div className="min-h-screen overflow-hidden relative">
   <div className="max-w-7xl mx-auto">
    <div className="flex flex-col md:flex-row">
     {/* Left side - Form */}
     <motion.div
      className="w-full md:w-1/2 p-6 md:p-10"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
     >


      <div className="mb-8">
       <motion.h1
        className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
       >
        Welcome to Cmax Store!
       </motion.h1>
       <motion.p
        className="text-gray-600 text-center mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
       >
        Create an account to get started with your shopping journey
       </motion.p>
      </div>

      <motion.form
       onSubmit={onSubmitHandler}
       className="space-y-6"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.4, duration: 0.5 }}
      >
       {formError && (
        <motion.div
         className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
        >
         {formError}
        </motion.div>
       )}

       {/* Profile Image Upload */}
       <div className="flex flex-col items-center my-6">
        <motion.div
         className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-400 relative cursor-pointer group"
         whileHover={{ scale: 1.05, borderColor: "#16a34a" }}
         whileTap={{ scale: 0.95 }}
         onClick={triggerFileInput}
        >
         {previewImage ? (
          <img
           src={previewImage}
           alt="Profile preview"
           className="w-full h-full object-cover"
          />
         ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-teal-50 flex items-center justify-center">
           <FiUser size={36} className="text-green-500" />
          </div>
         )}
         <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <FiCamera size={24} className="text-white" />
         </div>

         <motion.div
          className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white"
          initial={{ scale: 0 }}
          animate={{ scale: previewImage ? 0 : 1 }}
          transition={{ delay: 0.2 }}
         >
          <FiCamera size={16} />
         </motion.div>
        </motion.div>
        <button
         type="button"
         className="text-sm text-green-600 hover:text-green-800 mt-3 transition-colors duration-200"
         onClick={triggerFileInput}
        >
         {previewImage ? "Change Photo" : "Upload Profile Picture"}
        </button>
        <input
         type="file"
         ref={fileInputRef}
         onChange={handleImageChange}
         accept="image/jpeg,image/png,image/webp"
         className="hidden"
        />
        <ErrorMessage message={errors.profileImage} />
        {profileImage && (
         <motion.button
          type="button"
          className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
           setProfileImage(null);
           setPreviewImage(null);
          }}
         >
          <span className="mr-1">Remove</span>
         </motion.button>
        )}
       </div>

       {/* Name Fields */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiUser className="text-green-500" />
         </div>
         <input
          type="text"
          placeholder="First Name"
          className={`w-full p-3 pl-10 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-sm`}
          value={firstName}
          onChange={(e) => handleInputChange(e, setFirstName, 'firstName')}
          required
         />
         <ErrorMessage message={errors.firstName} />
        </div>

        <div className="relative">
         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiUser className="text-green-500" />
         </div>
         <input
          type="text"
          placeholder="Last Name"
          className={`w-full p-3 pl-10 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-sm`}
          value={lastName}
          onChange={(e) => handleInputChange(e, setLastName, 'lastName')}
          required
         />
         <ErrorMessage message={errors.lastName} />
        </div>
       </div>

       {/* Username Field */}
       <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
         <FiUser className="text-green-500" />
        </div>
        <input
         type="text"
         placeholder="Username"
         className={`w-full p-3 pl-10 rounded-lg border ${errors.username ? 'border-red-500' : 'border-gray-300'} bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-sm`}
         value={username}
         onChange={(e) => handleInputChange(e, setUsername, 'username')}
         required
        />
        <ErrorMessage message={errors.username} />
       </div>

       {/* Email Field */}
       <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
         <FiMail className="text-green-500" />
        </div>
        <input
         type="email"
         placeholder="Email Address"
         className={`w-full p-3 pl-10 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-sm`}
         value={email}
         onChange={(e) => handleInputChange(e, setEmail, 'email')}
         required
        />
        <ErrorMessage message={errors.email} />
       </div>

       {/* Phone Number Field */}
       <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
         <FiPhone className="text-green-500" />
        </div>
        <input
         type="tel"
         placeholder="Phone Number (e.g. 0712345678)"
         pattern="0[0-9]{9}"
         className={`w-full p-3 pl-10 rounded-lg border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-sm`}
         value={phoneNumber}
         onChange={(e) => handleInputChange(e, setPhoneNumber, 'phoneNumber')}
        />
        <ErrorMessage message={errors.phoneNumber} />
       </div>

       {/* Password Field */}
       <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
         <FiLock className="text-green-500 mb-5" />
        </div>
        <input
         type="password"
         placeholder="Password"
         className={`w-full p-3 pl-10 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-sm`}
         value={password}
         onChange={(e) => handleInputChange(e, setPassword, 'password')}
         required
        />
        <ErrorMessage message={errors.password} />
        <p className="text-xs text-gray-500 mt-1 pl-1">Password must be at least 8 characters</p>
       </div>

       {/* Submit Button */}
       <motion.button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg shadow-md transition-all duration-300 transform hover:shadow-lg hover:translate-y-[-2px] disabled:opacity-70 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
       >
        {isSubmitting ? (
         <div className="flex items-center justify-center">
          <FiLoader className="animate-spin mr-2" />
          <span>Creating Account...</span>
         </div>
        ) : (
         <span>Create Account</span>
        )}
       </motion.button>

       <div className="my-6 flex items-center">
        <div className="flex-1 h-px bg-gray-300"></div>
        <p className="mx-4 text-gray-500 text-sm">OR</p>
        <div className="flex-1 h-px bg-gray-300"></div>
       </div>

       <motion.button
        type="button"
        className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
       >
        <FcGoogle size={20} />
        <span>Sign up with Google</span>
       </motion.button>

       <div className="text-center mt-6">
        <span className="text-gray-600">Already have an account? </span>
        <Link
         to="/login"
         className="text-green-600 font-medium hover:text-green-800 hover:underline transition-colors duration-200"
        >
         Log in
        </Link>
       </div>
      </motion.form>
     </motion.div>

     {/* Right side - Animated content */}
     <motion.div
      className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-600 to-teal-700 relative overflow-hidden"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
     >
      {/* Enhanced background with subtle texture */}
      <div className="absolute inset-0 overflow-hidden">
       {/* Improved subtle pattern overlay */}
       <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonales-decalees.png')" }}
       />

       {/* Better positioned floating images */}
       <div className="absolute w-full h-full">
        {['fashion', 'electronics', 'home'].map((category, i) => (
         <motion.div
          key={i}
          className="absolute rounded-xl shadow-xl overflow-hidden"
          style={{
           width: `${130 + i * 20}px`,
           height: `${130 + i * 10}px`,
           left: `${i * 28 + 5}%`,
           top: `${(i * 30 + 15) % 70}%`,
           zIndex: 1,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
           opacity: 0.15,
           y: [0, -8, 0],
          }}
          transition={{
           duration: 6 + i,
           repeat: Infinity,
           repeatType: "reverse",
           ease: "easeInOut",
           delay: i * 0.5
          }}
         >
          <img
           src={`https://source.unsplash.com/400x400/?${category},premium`}
           alt=""
           className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
          />
         </motion.div>
        ))}
       </div>

       {/* More elegant geometric elements */}
       <div className="absolute inset-0">
        {Array.from({ length: 4 }).map((_, i) => (
         <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
           width: `${60 + i * 30}px`,
           height: `${60 + i * 30}px`,
           left: `${i * 22 + 5}%`,
           top: `${(i * 28 + 5) % 85}%`,
           opacity: 0.04,
          }}
          animate={{
           y: [0, -12, 0],
           scale: [1, 1.03, 1],
          }}
          transition={{
           duration: 8 + i * 2,
           repeat: Infinity,
           ease: "easeInOut",
           delay: i * 0.7
          }}
         />
        ))}
       </div>
      </div>

      {/* Content - Welcome message with improved layout */}
      <div className="relative h-full flex flex-col justify-between items-center p-12 z-10">
       {/* Enhanced testimonial section */}
       <div className="w-full max-w-md mt-8">
        <motion.div
         className="relative bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-7 border border-white/10"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.9, duration: 0.8 }}
        >
         {/* More elegant quote marks */}
         <svg className="absolute top-6 left-6 w-10 h-10 text-white/10" fill="currentColor" viewBox="0 0 32 32">
          <path d="M10,8H6a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h4v2a4,4,0,0,1-4,4H6a2,2,0,0,0,0,4h.2A8,8,0,0,0,14,18V10A2,2,0,0,0,12,8Z" />
          <path d="M26,8H22a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h4v2a4,4,0,0,1-4,4H22a2,2,0,0,0,0,4h.2A8,8,0,0,0,30,18V10A2,2,0,0,0,28,8Z" />
         </svg>

         <div className="flex items-center space-x-4 pl-6">
          <AnimatePresence mode="wait">
           <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
           >
            <div className="flex items-center mb-4">
             <img
              src={testimonials[currentSlide].avatar}
              alt={testimonials[currentSlide].name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/70 mr-3 shadow-md"
             />
             <div>
              <p className="font-bold text-white text-lg">{testimonials[currentSlide].name}</p>
              <div className="flex text-yellow-300 mt-1">
               {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
               ))}
              </div>
             </div>
            </div>
            <p className="text-white font-medium italic text-base leading-relaxed">
             {testimonials[currentSlide].text}
            </p>
           </motion.div>
          </AnimatePresence>
         </div>

         {/* Enhanced navigation indicators */}
         <div className="flex justify-center mt-5 space-x-3">
          {testimonials.map((_, i) => (
           <motion.button
            key={i}
            className={`h-1.5 transition-all duration-300 rounded-full ${i === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
            whileHover={{ scale: 1.2 }}
            onClick={() => setCurrentSlide(i)}
           />
          ))}
         </div>
        </motion.div>
       </div>

       {/* Enhanced product showcase carousel */}
       <div className="w-full max-w-lg mx-auto my-auto">
        <motion.div
         className="rounded-xl overflow-hidden shadow-2xl bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-10"
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.7, duration: 0.8 }}
         whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)" }}
        >

         <div className="relative h-72 overflow-hidden">
          <AnimatePresence mode="popLayout">
           <motion.img
            key={currentSlide}
            src={[assets.luxury_fashion, assets.premium_electronics, assets.highend_cosmetics][currentSlide % 3]}
            alt="Featured products"
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
           />
          </AnimatePresence>

          {/* Overlay with product category */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-16">
           <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
           >
            <h3 className="text-white text-xl font-bold">
             {['Luxury Fashion', 'Premium Electronics', 'High-end Cosmetics'][currentSlide % 3]}
            </h3>
            <p className="text-white/80 text-sm mt-1">
             {['Discover the latest trends', 'Cutting edge technology', 'Beauty essentials'][currentSlide % 3]}
            </p>
           </motion.div>
          </div>

          {/* Improved navigation arrows */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
           <motion.button
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white border border-white/20"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentSlide(prev => (prev - 1 + 3) % 3)}
           >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
           </motion.button>
           <motion.button
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white border border-white/20"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentSlide(prev => (prev + 1) % 3)}
           >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
           </motion.button>
          </div>

          {/* Enhanced carousel indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
           {[0, 1, 2].map(idx => (
            <motion.button
             key={idx}
             className={`h-1.5 ${idx === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/50'} rounded-full transition-all duration-300`}
             whileHover={{ scale: 1.2 }}
             onClick={() => setCurrentSlide(idx)}
            />
           ))}
          </div>
         </div>

         {/* Improved feature cards */}
         <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-b from-transparent bg-green-100/10 to-green-100/30 rounded-b-xl">
          {[
           {
            icon: <FiShoppingBag />,
            title: "Premium Selection",
            desc: "Curated products for discerning shoppers"
           },
           {
            icon: <FiShield />,
            title: "Secure Shopping",
            desc: "Your data is always protected and encrypted"
           }
          ].map((feature, i) => (
           <motion.div
            key={i}
            className="bg-green-50/30 backdrop-blur-sm p-4 rounded-lg border border-green-300"
            whileHover={{
             translateY: -5,
             backgroundColor: "rgba(167, 243, 208, 0.3)", // light green with transparency
             boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }}
            transition={{ duration: 0.3 }}
           >
            <div className="text-green-800 text-xl p-2.5 bg-green-100/50 rounded-full w-11 h-11 flex items-center justify-center mb-3 shadow-inner">
             {feature.icon}
            </div>
            <h3 className="font-semibold text-green-900 text-lg mb-1 text-center">{feature.title}</h3>
            <p className="text-sm text-green-800/90 leading-relaxed text-center">{feature.desc}</p>
           </motion.div>
          ))}
         </div>
        </motion.div>
       </div>

       
      </div>
     </motion.div>
    </div>
   </div>
  </div>
 )
}

export default SignUp