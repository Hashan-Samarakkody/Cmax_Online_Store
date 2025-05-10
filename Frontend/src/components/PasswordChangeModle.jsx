import React, { useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';

// Set app element for accessibility
Modal.setAppElement('#root');

const PasswordChangeModle = ({ isOpen, onClose, token, backendUrl, user, setToken, navigate }) => {
    const [step, setStep] = useState(1);

    // Check if user is OAuth user
    const isOAuthUser = user?.authProvider && user.authProvider !== 'local';

    // Password visibility
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Loading states
    const [verifyingPassword, setVerifyingPassword] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Verify password
    const handleVerifyPassword = async () => {
        if (!currentPassword) {
            toast.error('Please enter your current password');
            return;
        }

        setVerifyingPassword(true);
        try {
            const response = await axios.post(
                `${backendUrl}/api/user/verify-password`,
                { password: currentPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Password verified');
                setStep(2);
                // Automatically send verification code
                handleSendVerificationCode();
            } else {
                toast.error('Incorrect password');
            }
        } catch (error) {
            console.error('Error verifying password:', error);
            toast.error('Error verifying password');
        } finally {
            setVerifyingPassword(false);
        }
    };

    // Send verification code
    const handleSendVerificationCode = async () => {
        setSendingCode(true);
        try {
            const response = await axios.post(
                `${backendUrl}/api/user/send-change-password-code`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Verification code sent to your email');
                setStep(3);
            } else {
                toast.error(response.data.message || 'Failed to send verification code');
            }
        } catch (error) {
            console.error('Error sending verification code:', error);
            toast.error('Error sending verification code');
        } finally {
            setSendingCode(false);
        }
    };

    // Verify code
    const handleVerifyCode = async () => {
        if (!verificationCode) {
            toast.error('Please enter the verification code');
            return;
        }

        setVerifyingCode(true);
        try {
            const response = await axios.post(
                `${backendUrl}/api/user/verify-change-password-code`,
                { code: verificationCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Code verified successfully');
                setStep(4);
            } else {
                toast.error(response.data.message || 'Invalid verification code');
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            toast.error('Error verifying code');
        } finally {
            setVerifyingCode(false);
        }
    };

    // Change password
    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setChangingPassword(true);
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
                // Clear all fields
                setCurrentPassword('');
                setVerificationCode('');
                setNewPassword('');
                setConfirmPassword('');
                setStep(1);
                onClose();
            } else {
                toast.error(response.data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error('Error changing password');
        } finally {
            setChangingPassword(false);
        }
    };

    // Handle close and reset form
    const handleClose = () => {
        // Reset form state
        setCurrentPassword('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
        setStep(1);
        onClose();
    };

    // Special view for OAuth users
    if (isOAuthUser) {
        return (
            <Modal
                isOpen={isOpen}
                onRequestClose={handleClose}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">OAuth Account</h2>
                        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="mr-4 bg-white p-2 rounded-full">
                            {user.authProvider === 'google' ? (
                                <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                                        fill="#4285F4" />
                                </svg>
                            ) : user.authProvider === 'facebook' ? (
                                <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                        fill="#1877F2" />
                                </svg>
                            ) : null}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-800">
                                {user.authProvider === 'google' ? 'Google Account' : 'Facebook Account'}
                            </h3>
                            <p className="text-sm text-gray-600">
                                Connected as {user.email}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg mb-6">
                        <p className="text-gray-700 mb-2">
                            Your account uses {user.authProvider === 'google' ? 'Google' : 'Facebook'} for authentication.
                        </p>
                        <p className="text-gray-700">
                            To change your password, please visit your {user.authProvider === 'google' ? 'Google' : 'Facebook'} account settings directly.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }

    // Regular password change flow for non-OAuth users
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Change Password</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">
                            Please enter your current password to continue
                        </p>

                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="Current Password"
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyPassword}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                                disabled={verifyingPassword}
                            >
                                {verifyingPassword ? (
                                    <>
                                        <FiLoader className="animate-spin mr-2" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify Password"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">
                            We're sending a verification code to your email address.
                        </p>

                        <div className="h-8 flex justify-center items-center">
                            <FiLoader className="animate-spin text-green-600 text-xl" />
                        </div>

                        <p className="text-sm text-gray-500 text-center">
                            Please wait...
                        </p>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">
                            Enter the verification code sent to your email
                        </p>

                        <input
                            type="text"
                            placeholder="Verification Code"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                        />

                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyCode}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                                disabled={verifyingCode}
                            >
                                {verifyingCode ? (
                                    <>
                                        <FiLoader className="animate-spin mr-2" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify Code"
                                )}
                            </button>
                        </div>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={handleSendVerificationCode}
                                className="text-green-600 text-sm hover:underline"
                                disabled={sendingCode}
                            >
                                {sendingCode ? "Sending..." : "Resend code"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">
                            Enter your new password
                        </p>

                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="New Password"
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Password must be at least 8 characters long
                        </p>

                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleChangePassword}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                                disabled={changingPassword}
                            >
                                {changingPassword ? (
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
                )}
            </div>
        </Modal>
    );
};

export default PasswordChangeModle;