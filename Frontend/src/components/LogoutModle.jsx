import React from 'react';

const LogoutModle = ({ isOpen, onClose, onLogout }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-md border border-gray-200 animate-fade-in-up">
                <div className="flex justify-between items-center mb-4 sm:mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Logout</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 transition-colors p-2 -mr-2"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex justify-center mb-5">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <p className="text-gray-800 text-center font-medium mb-2 text-base sm:text-lg">
                        Are you sure you want to logout?
                    </p>
                    <p className="text-gray-600 text-center text-xs sm:text-sm">
                        You'll need to sign in again to access your account.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-3 sm:py-2.5 bg-gray-200 hover:bg-gray-300 active:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors sm:w-1/2 order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="px-5 py-3 sm:py-2.5 bg-gray-600 hover:bg-gray-700 active:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center sm:w-1/2 order-1 sm:order-2"
                    >
                        Confirm Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModle;