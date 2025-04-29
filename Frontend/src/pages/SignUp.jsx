import React, { useState, useContext, useEffect, useRef } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import DOMPurify from 'dompurify'
import { assets } from '../assets/assets';
import { FiUser, FiMail, FiLock, FiPhone, FiCamera, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Link } from 'react-router-dom';

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

    // Validation errors
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        username: '',
        phoneNumber: '',
        firstName: '',
        lastName: ''
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
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-teal-300 bg-clip-text text-transparent">Create an account</h1>
                            </div>

                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-4 rounded-lg">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-1/2 relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <FiUser className="text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            className={`w-full p-3 pl-10 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                                            value={firstName}
                                            onChange={(e) => handleInputChange(e, setFirstName, 'firstName')}
                                            required
                                        />
                                        <ErrorMessage message={errors.firstName} />
                                    </div>

                                    <div className="w-1/2 relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <FiUser className="text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            className={`w-full p-3 pl-10 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                                            value={lastName}
                                            onChange={(e) => handleInputChange(e, setLastName, 'lastName')}
                                            required
                                        />
                                        <ErrorMessage message={errors.lastName} />
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiUser className="text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        className={`w-full p-3 pl-10 rounded-lg border ${errors.username ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
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
                                        className={`w-full p-3 pl-10 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                                        value={email}
                                        onChange={(e) => handleInputChange(e, setEmail, 'email')}
                                        required
                                    />
                                    <ErrorMessage message={errors.email} />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiPhone className="text-gray-500" />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Phone Number (e.g. 0712345678)"
                                        pattern="0[0-9]{9}"
                                        className={`w-full p-3 pl-10 rounded-lg border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                                        value={phoneNumber}
                                        onChange={(e) => handleInputChange(e, setPhoneNumber, 'phoneNumber')}
                                    />
                                    <ErrorMessage message={errors.phoneNumber} />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 mb-5 pointer-events-none">
                                        <FiLock className="text-gray-500" />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className={`w-full p-3 pl-10 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
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
                                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center"
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
                                    <Link
                                        to="/login"
                                        className="text-green-600 font-medium cursor-pointer hover:underline"
                                    >
                                        Log in
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
                        <img src={assets.signup_img} className="max-w-full max-h-full object-contain" alt="Signup illustration" />
                    </div>
                </div>
            </div>

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

export default SignUp