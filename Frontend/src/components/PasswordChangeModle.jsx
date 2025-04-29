import React, { useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { FiLoader, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

const PasswordChangeModle = ({ isOpen, onClose }) => {
    const { backendUrl, token, user } = useContext(ShopContext);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    // Errors
    const [errors, setErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        verificationCode: ''
    });

    // Reset all form fields
    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setVerificationCode('');
        setCodeSent(false);
        setErrors({});
        setStep(1);
    };

    // Close modal and reset form
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Sanitize inputs
    const sanitizeInput = (input) => {
        return DOMPurify.sanitize(input.trim());
    };

    // Handle input changes
    const handleInputChange = (e, setter, field) => {
        const sanitized = sanitizeInput(e.target.value);
        setter(sanitized);

        // Clear error when user starts typing again
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    // Verify current password and send verification code
    const validateCurrentPassword = async () => {
        if (!currentPassword) {
            setErrors({ ...errors, currentPassword: 'Current password is required' });
            return;
        }

        setIsLoading(true);

        try {
            // First verify the current password
            const verifyResponse = await axios.post(
                `${backendUrl}/api/user/verify-password`,
                { password: currentPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!verifyResponse.data.success) {
                setErrors({ ...errors, currentPassword: 'Current password is incorrect' });
                setIsLoading(false);
                return;
            }

            // Then send a verification code to user's email using the new endpoint
            const response = await axios.post(
                `${backendUrl}/api/user/send-change-password-code`,
                {},  // No need to send email, it will use the authenticated user
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setCodeSent(true);
                toast.info('A verification code has been sent to your email');
                setStep(2);
            } else {
                toast.error(response.data.message || 'Failed to send verification code');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to send verification code';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


    // Verify the code and proceed
    const verifyCode = async () => {
        if (!verificationCode) {
            setErrors({ ...errors, verificationCode: 'Verification code is required' });
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(
                `${backendUrl}/api/user/verify-change-password-code`,
                {
                    code: verificationCode
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setStep(3);
            } else {
                toast.error(response.data.message || 'Invalid verification code');
                setErrors({ ...errors, verificationCode: 'Invalid verification code' });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to verify code';
            toast.error(errorMessage);
            setErrors({ ...errors, verificationCode: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    // Change password (final step)
    const changePassword = async () => {
        // Validate passwords
        if (!newPassword) {
            setErrors({ ...errors, newPassword: 'New password is required' });
            return;
        }

        if (newPassword.length < 8) {
            setErrors({ ...errors, newPassword: 'Password must be at least 8 characters' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.put(
                `${backendUrl}/api/user/change-password`,
                {
                    currentPassword,
                    newPassword,
                    code: verificationCode
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Password changed successfully');
                handleClose();
            } else {
                toast.error(response.data.message || 'Failed to change password');

                // Handle specific errors
                if (response.data.message?.toLowerCase().includes('current password')) {
                    setStep(1);
                    setErrors({ ...errors, currentPassword: response.data.message });
                } else if (response.data.message?.toLowerCase().includes('verify')) {
                    setStep(2);
                    setErrors({ ...errors, verificationCode: response.data.message });
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to change password';
            toast.error(errorMessage);

            // Handle specific errors
            if (errorMessage.toLowerCase().includes('current password')) {
                setStep(1);
                setErrors({ ...errors, currentPassword: errorMessage });
            } else if (errorMessage.toLowerCase().includes('verify')) {
                setStep(2);
                setErrors({ ...errors, verificationCode: errorMessage });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Change Password</h3>
                        <p className="mb-4 text-gray-600">Enter your current password</p>

                        <div className="mb-4">
                            <input
                                type="password"
                                className={`w-full p-3 rounded-lg border ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                                placeholder="Current Password"
                                value={currentPassword}
                                onChange={(e) => handleInputChange(e, setCurrentPassword, 'currentPassword')}
                            />
                            {errors.currentPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                onClick={validateCurrentPassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <FiLoader className="animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    <>Next <FiArrowRight className="ml-1" /></>
                                )}
                            </button>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Verify Your Email</h3>
                        <p className="mb-4 text-gray-600">Enter the verification code sent to your email</p>

                        <div className="mb-4">
                            <input
                                type="text"
                                className={`w-full p-3 rounded-lg border ${errors.verificationCode ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                                placeholder="Verification Code"
                                value={verificationCode}
                                onChange={(e) => handleInputChange(e, setVerificationCode, 'verificationCode')}
                            />
                            {errors.verificationCode && (
                                <p className="text-red-500 text-xs mt-1">{errors.verificationCode}</p>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                className="px-4 py-2 flex items-center text-gray-600 hover:text-gray-800"
                                onClick={() => setStep(1)}
                            >
                                <FiArrowLeft className="mr-1" /> Back
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                onClick={verifyCode}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <FiLoader className="animate-spin mr-2" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>Next <FiArrowRight className="ml-1" /></>
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
                            {errors.newPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                            )}

                            <input
                                type="password"
                                className={`w-full p-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500`}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => handleInputChange(e, setConfirmPassword, 'confirmPassword')}
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                className="px-4 py-2 flex items-center text-gray-600 hover:text-gray-800"
                                onClick={() => setStep(2)}
                            >
                                <FiArrowLeft className="mr-1" /> Back
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                onClick={changePassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <FiLoader className="animate-spin mr-2" />
                                        Changing...
                                    </>
                                ) : (
                                    "Change Password"
                                )}
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <motion.div
                className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <div className="text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center pt-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                    <div className={`h-1 w-10 ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                    <div className={`h-1 w-10 ${step >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
                </div>

                {/* Dynamic content based on current step */}
                {renderStepContent()}
            </motion.div>
        </div>
    );
};

export default PasswordChangeModle;