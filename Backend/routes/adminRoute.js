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
    getAllAdmins
} from '../controllers/adminController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// Public routes
adminRouter.post('/login', adminLogin);
adminRouter.post('/register', upload.single('profileImage'), registerAdmin);
adminRouter.post('/reset-password/send-code', sendResetCode);
adminRouter.post('/reset-password/verify-code', verifyResetCode);
adminRouter.post('/reset-password/reset', resetPassword);

// Protected routes (require authentication)
adminRouter.get('/profile', adminAuth, getAdminProfile);
adminRouter.put('/profile', adminAuth, upload.single('profileImage'), updateAdminProfile);
adminRouter.put('/change-password', adminAuth, changePassword);
adminRouter.delete('/delete', adminAuth, deleteAdminAccount);
adminRouter.get('/admin', adminAuth, getAdminProfile);
adminRouter.put('/admin', adminAuth, upload.single('profileImage'), updateAdminProfile);
adminRouter.put('/admin/change-password', adminAuth, changePassword);
adminRouter.post('/send-code', adminAuth, sendVerificationCode);
adminRouter.post('/verify-code', adminAuth, verifyCode);

// Admin management routes (superadmin only)
adminRouter.get('/all', adminAuth, getAllAdmins);
adminRouter.patch('/toggle-status/:adminId', adminAuth, toggleAdminStatus);

export default adminRouter;