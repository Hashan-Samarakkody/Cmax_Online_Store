import React, { useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const OAuthCallback = () => {
    const { setToken } = useContext(ShopContext);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Parse token from URL query params
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        console.log("OAuth callback received token:", token ? "✓ Token received" : "✗ No token");

        if (token) {
            localStorage.setItem('token', token);
            setToken(token);

            // Show success message
            toast.success('Successfully logged in with Google!');

            // Redirect to profile page to immediately show their account
            navigate('/profile');
        } else if (error) {
            toast.error('Authentication failed. Please try again.');
            navigate('/login');
        } else {
            toast.error('Something went wrong. Please try again.');
            navigate('/login');
        }
    }, [location, navigate, setToken]);

    return (
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-lg">Processing your login...</p>
                <p className="text-gray-500 text-sm mt-2">Please wait while we set up your profile</p>
            </div>
        </div>
    );
};

export default OAuthCallback;