import express from 'express';
import {
    adminLogin,
    registerAdmin,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    updateAdminStatus,
    deleteAdminAccount
} from '../controllers/adminController.js';
import uploadMiddleware from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// Public routes
adminRouter.post('/login', adminLogin);
adminRouter.post('/register', uploadMiddleware.single('profileImage'), registerAdmin);

// Protected routes (require authentication)
adminRouter.get('/profile', adminAuth, getAdminProfile);
adminRouter.put('/profile', adminAuth, uploadMiddleware.single('profileImage'), updateAdminProfile);
adminRouter.put('/change-password', adminAuth, changePassword);
adminRouter.put('/status', adminAuth, updateAdminStatus);
adminRouter.delete('/delete', adminAuth, deleteAdminAccount);
adminRouter.get('/admin', adminAuth, getAdminProfile);
adminRouter.put('/admin', adminAuth, uploadMiddleware.single('profileImage'), updateAdminProfile);
adminRouter.put('/admin/change-password', adminAuth, changePassword);
adminRouter.put('/admin/status', adminAuth, updateAdminStatus);
export default adminRouter;