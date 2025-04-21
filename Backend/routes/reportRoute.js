import express from 'express';
import { generateSalesReport } from '../utils/generatePDF.js';
import adminAuth from '../middleware/adminAuth.js';

const reportRouter = express.Router();

// Apply adminAuth middleware to secure the endpoint
reportRouter.get('/sales', adminAuth, generateSalesReport);

export default reportRouter;