import express from 'express';
import {
    adminLogin,
    registerAdmin,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    deleteAdminAccount,
    sendVerificationCode,
    verifyCode,
    sendResetCode,
    verifyResetCode,
    resetPassword,
    toggleAdminStatus,
    getAllAdmins,
    sendVerificationCodeinRegistration,
    verifyCodeinRegistration,
    resendVerificationCode,
    completeRegistration
} from '../controllers/adminController.js';
import uploadMiddleware from '../middleware/upload.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// Public routes
adminRouter.post('/login', adminLogin);
adminRouter.post('/register', uploadMiddleware.single('profileImage'), registerAdmin);
adminRouter.post('/send-verification-code', uploadMiddleware.single('profileImage'), sendVerificationCodeinRegistration);
adminRouter.post('/verify-code', verifyCodeinRegistration);
adminRouter.post('/complete-registration', uploadMiddleware.single('profileImage'), completeRegistration);
adminRouter.post('/resend-verification-code', resendVerificationCode);
adminRouter.post('/reset-password/send-code', sendResetCode);
adminRouter.post('/reset-password/verify-code', verifyResetCode);
adminRouter.post('/reset-password/reset', resetPassword);

// Protected routes (require authentication)
adminRouter.get('/profile', adminAuth, getAdminProfile);
adminRouter.put('/profile', adminAuth, uploadMiddleware.single('profileImage'), updateAdminProfile);
adminRouter.put('/change-password', adminAuth, changePassword);
adminRouter.delete('/delete', adminAuth, deleteAdminAccount);
adminRouter.post('/send-code', adminAuth, sendVerificationCode);
adminRouter.post('/verify-code', adminAuth, verifyCode);

// Admin management routes (superadmin only)
adminRouter.get('/all', adminAuth, getAllAdmins);
adminRouter.patch('/toggle-status/:adminId', adminAuth, toggleAdminStatus);

export default adminRouter;