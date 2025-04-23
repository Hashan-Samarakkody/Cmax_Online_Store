import express from 'express';
import {
    adminLogin,
    registerAdmin,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    deleteAdminAccount,
    sendVerificationCode,
    verifyCode
} from '../controllers/adminController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// Public routes
adminRouter.post('/login', adminLogin);
adminRouter.post('/register', upload.single('profileImage'), registerAdmin);

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

export default adminRouter;