import express from 'express';
import { loginUser, registerUser, sendResetCode, verifyResetCode, resetPassword } from '../controllers/userController.js';
import upload from '../middleware/multer.js';

const userRouter = express.Router();

userRouter.post('/register', upload.single('profileImage'), registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/reset-password/send-code', sendResetCode);
userRouter.post('/reset-password/verify-code', verifyResetCode);
userRouter.post('/reset-password/reset', resetPassword);

export default userRouter;