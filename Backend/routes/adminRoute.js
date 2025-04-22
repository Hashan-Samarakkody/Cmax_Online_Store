import express from 'express';
import {
    adminLogin,
    registerAdmin,
    getAllAdmins,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    updateAdminStatus
} from '../controllers/adminController.js';
import uploadMiddleware from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// Public routes
adminRouter.post('/login', adminLogin);
adminRouter.post('/register', uploadMiddleware.single('profileImage'), registerAdmin);

// Protected routes (require authentication)
adminRouter.get('/list', adminAuth, getAllAdmins);
adminRouter.get('/profile', adminAuth, getAdminProfile);
adminRouter.put('/profile', adminAuth, uploadMiddleware.single('profileImage'), updateAdminProfile);
adminRouter.put('/change-password', adminAuth, changePassword);
adminRouter.put('/status', adminAuth, updateAdminStatus);

export default adminRouter;