import React, { useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const DeleteAccountModle = ({ isOpen, onClose }) => {
    const { backendUrl, token, setToken, navigate } = useContext(ShopContext);
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Handle password input
    const handlePasswordChange = (e) => {
        const sanitized = DOMPurify.sanitize(e.target.value);
        setPassword(sanitized);
        setError('');
    };

    // Handle confirm text input
    const handleConfirmTextChange = (e) => {
        setConfirmText(e.target.value);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password) {
            setError('Password is required');
            return;
        }

        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.delete(
                `${backendUrl}/api/user/delete-account`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { password }
                }
            );

            if (response.data.success) {
                toast.success('Your account has been deleted');
                localStorage.removeItem('token');
                setToken('');
                navigate('/signup');
            } else {
                setError(response.data.message || 'Failed to delete account');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'An error occurred';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <motion.div
                className="bg-white rounded-lg shadow-xl w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center text-red-500">
                        <FiAlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                        <h3 className="text-base sm:text-lg font-semibold">Delete Account</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="bg-red-50 text-red-800 p-3 sm:p-4 rounded-md mb-4">
                        <p className="font-medium text-sm sm:text-base">Warning: This action cannot be undone</p>
                        <p className="mt-2 text-xs sm:text-sm">
                            Deleting your account will permanently remove all your data, including order history,
                            saved addresses, and preferences. You will no longer have access to your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 sm:px-4 sm:py-3 mb-4 rounded-md text-xs sm:text-sm">
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="mb-5">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Type DELETE to confirm <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={handleConfirmTextChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="DELETE"
                                required
                            />
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium w-full sm:w-auto mt-2 sm:mt-0"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || confirmText !== 'DELETE'}
                                className={`px-4 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center text-sm font-medium w-full sm:w-auto ${isSubmitting || confirmText !== 'DELETE' ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FiLoader className="animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    'Delete My Account'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteAccountModle;