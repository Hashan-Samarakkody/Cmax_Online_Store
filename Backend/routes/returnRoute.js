import express from 'express';
import { createReturnRequest, getUserReturns, getAdminReturns, updateReturnStatus, getReturnOrderSummary } from '../controllers/returnController.js';
import { userAuth } from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';
import { returnMediaUpload } from '../middleware/multer.js';

const returnRouter = express.Router();

// User routes
returnRouter.post('/request', userAuth, returnMediaUpload, createReturnRequest);
returnRouter.get('/user', userAuth, getUserReturns);

// Admin routes
returnRouter.get('/admin', adminAuth, getAdminReturns);
returnRouter.post('/update-status', adminAuth, updateReturnStatus);
returnRouter.get('/return-summary', adminAuth, getReturnOrderSummary);


export default returnRouter;