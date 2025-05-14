import express from 'express';
import { generateSalesReport } from '../utils/generatePDF.js';
import adminAuth from '../middleware/adminAuth.js';
import { getFinancialSalesReport } from '../controllers/financialReportController.js';

const reportRouter = express.Router();

// Apply adminAuth middleware to secure the endpoint
reportRouter.get('/sales', adminAuth, generateSalesReport);
reportRouter.get('/financial-sales', adminAuth, getFinancialSalesReport);


export default reportRouter;