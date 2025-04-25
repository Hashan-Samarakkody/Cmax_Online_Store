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
} from '../controllers/adminController.js';
import uploadMiddleware from '../middleware/upload.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// Public routes
adminRouter.post('/login', adminLogin);
adminRouter.post('/register', uploadMiddleware.single('profileImage'), registerAdmin);
adminRouter.post('/reset-password/send-code', sendResetCode);
adminRouter.post('/reset-password/verify-code', verifyResetCode);
adminRouter.post('/reset-password/reset', resetPassword);

// Protected routes (require authentication)
adminRouter.get('/profile', adminAuth, getAdminProfile);
adminRouter.put('/profile', adminAuth, uploadMiddleware.single('profileImage'), updateAdminProfile);
adminRouter.put('/change-password', adminAuth, changePassword);
adminRouter.delete('/delete', adminAuth, deleteAdminAccount);
adminRouter.get('/admin', adminAuth, getAdminProfile);
adminRouter.put('/admin', adminAuth, uploadMiddleware.single('profileImage'), updateAdminProfile);
adminRouter.put('/admin/change-password', adminAuth, changePassword);
adminRouter.post('/send-code', adminAuth, sendVerificationCode);
adminRouter.post('/verify-code', adminAuth, verifyCode);

// Admin management routes (superadmin only)
adminRouter.get('/all', adminAuth, getAllAdmins);
adminRouter.patch('/toggle-status/:adminId', adminAuth, toggleAdminStatus);

export default adminRouter;