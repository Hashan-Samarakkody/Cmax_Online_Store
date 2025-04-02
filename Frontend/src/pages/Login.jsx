import React, { useState, useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import DOMPurify from 'dompurify'
import { assets } from '../assets/assets';

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    username: '',
    phoneNumber: ''
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

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Validate form first
    if (!validateForm()) {
      return;
    }

    try {
      if (currentState === 'Sign Up') {
        const response = await axios.post(backendUrl + '/api/user/register', {
          name,
          email,
          password,
          username, // Include new fields if needed by your API
          phoneNumber: phoneNumber || undefined
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
    }
  };

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

  // Signup form based on Image 1
  const renderSignupForm = () => {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-gray-600">Enter your details below</p>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-4 rounded">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Name"
              className={`w-full p-2 border-b ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-gray-500`}
              value={name}
              onChange={(e) => handleInputChange(e, setName, 'name')}
              required
            />
            <ErrorMessage message={errors.name} />
          </div>

          <div>
            <input
              type="tel"
              placeholder="Phone Number"
              className={`w-full p-2 border-b ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-gray-500`}
              value={phoneNumber}
              onChange={(e) => handleInputChange(e, setPhoneNumber, 'phoneNumber')}
            />
            <ErrorMessage message={errors.phoneNumber} />
          </div>

          <div>
            <input
              type="text"
              placeholder="User Name"
              className={`w-full p-2 border-b ${errors.username ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-gray-500`}
              value={username}
              onChange={(e) => handleInputChange(e, setUsername, 'username')}
              required
            />
            <ErrorMessage message={errors.username} />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full p-2 border-b ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-gray-500`}
              value={email}
              onChange={(e) => handleInputChange(e, setEmail, 'email')}
              required
            />
            <ErrorMessage message={errors.email} />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className={`w-full p-2 border-b ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-gray-500`}
              value={password}
              onChange={(e) => handleInputChange(e, setPassword, 'password')}
              required
            />
            <ErrorMessage message={errors.password} />
            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-3 rounded hover:bg-green-800 transition"
          >
            Create Account
          </button>

          <div className="my-4">
            <button
              type="button"
              className="w-full border border-gray-300 py-3 rounded flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>
          </div>

          <div className="text-center mt-4 text-sm">
            <span className="text-gray-600">Already have account? </span>
            <span
              className="text-green-700 cursor-pointer"
              onClick={() => setCurrentState('Login')}
            >
              Log in
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Login form based on Image 2
  const renderLoginForm = () => {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Log in to Cmax</h1>
          <p className="text-gray-600">Enter your details below</p>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-4 rounded">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full p-2 border-b ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-gray-500`}
              value={email}
              onChange={(e) => handleInputChange(e, setEmail, 'email')}
              required
            />
            <ErrorMessage message={errors.email} />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className={`w-full p-2 border-b ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-gray-500`}
              value={password}
              onChange={(e) => handleInputChange(e, setPassword, 'password')}
              required
            />
            <ErrorMessage message={errors.password} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="bg-green-700 text-white py-2 px-6 rounded hover:bg-green-800 transition"
            >
              Log In
            </button>

            <span className="text-green-700 cursor-pointer text-sm">
              Forgot Password?
            </span>
          </div>

          <div className="text-center mt-4 text-sm">
            <span
              className="text-green-700 cursor-pointer"
              onClick={() => setCurrentState('Sign Up')}
            >
              Create Account
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <form onSubmit={onSubmitHandler} className="py-8">
            {currentState === 'Login' ? renderLoginForm() : renderSignupForm()}
          </form>
        </div>
      </div>

      <div className="hidden md:block md:w-1/2 bg-blue-50 relative">
        {/* Illustration section - we'll use a colored div as placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-3/4 h-3/4 bg-blue-100 rounded-full flex items-center justify-center">
            {/* This would be where the illustrations from the images would go */}
            {currentState === 'Login' ? (
              <img src={assets.login_img} />
            ) : (
              <img src={assets.signup_img} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
