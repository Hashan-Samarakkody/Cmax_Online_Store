import express from 'express';
import {
    loginUser,
    registerUser,
    sendResetCode,
    verifyResetCode,
    resetPassword,
    getUserProfile,
    updateUserProfile,
    changePassword,
    deleteUserAccount,
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    verifyPassword,
    sendChangePasswordCode,
    verifyChangePasswordCode
} from '../controllers/userController.js';
import { userAuth } from '../middleware/userAuth.js';
import uploadMiddleware from '../middleware/upload.js';

const userRouter = express.Router();

// Public routes
userRouter.post('/register', uploadMiddleware.single('profileImage'), registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/send-reset-code', sendResetCode);
userRouter.post('/verify-reset-code', verifyResetCode);
userRouter.post('/reset-password', resetPassword);

// Protected routes (require authentication)
userRouter.get('/profile', userAuth, getUserProfile);
userRouter.put('/update-profile', userAuth, uploadMiddleware.single('profileImage'), updateUserProfile);
userRouter.put('/change-password', userAuth, changePassword);
userRouter.delete('/delete-account', userAuth, deleteUserAccount);
userRouter.get('/addresses', userAuth, getUserAddresses);
userRouter.post('/addresses', userAuth, addUserAddress);
userRouter.put('/addresses/:addressId', userAuth, updateUserAddress);
userRouter.delete('/addresses/:addressId', userAuth, deleteUserAddress);
userRouter.put('/addresses/:addressId/default', userAuth, setDefaultAddress);
userRouter.post('/verify-password', userAuth, verifyPassword);
userRouter.post('/send-change-password-code', userAuth, sendChangePasswordCode);
userRouter.post('/verify-change-password-code', userAuth, verifyChangePasswordCode);

export default userRouter;