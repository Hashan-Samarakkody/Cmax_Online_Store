import express from 'express';
import {
    getDashboardStats,
    getSalesTrends,
    getProductPerformance,
    getUserActivity,
    getCartAnalytics,
    getCategoryDistribution,
    generateReport,
    getRevenuePrediction,
    getUserActivityReport,
} from '../controllers/dashboardController.js';
import { getLoyalCustomers } from '../controllers/userController.js';
import adminAuth from '../middleware/adminAuth.js';

const dashboardRouter = express.Router();

// All routes are protected with adminAuth middleware
dashboardRouter.get('/stats', adminAuth, getDashboardStats);
dashboardRouter.get('/sales-trends', adminAuth, getSalesTrends);
dashboardRouter.get('/product-performance', adminAuth, getProductPerformance);
dashboardRouter.get('/user-activity', adminAuth, getUserActivity);
dashboardRouter.get('/cart-analytics', adminAuth, getCartAnalytics);
dashboardRouter.get('/category-distribution', adminAuth, getCategoryDistribution);
dashboardRouter.post('/generate-report', adminAuth, generateReport);
dashboardRouter.get('/revenue-prediction', adminAuth, getRevenuePrediction);
dashboardRouter.get('/user-activity-report', adminAuth, getUserActivityReport);
dashboardRouter.get('/loyal-customers', adminAuth, getLoyalCustomers);

export default dashboardRouter;