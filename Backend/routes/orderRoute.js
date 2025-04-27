import express from 'express';
import { placeOrder, placeOrderStripe, allOrders, userOrders, updateStatus, verifyStripe, getOrderDetails } from '../controllers/orderController.js';
import { orderAndCartAuth } from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';
import { generateOrderPDF, generateOrderLabel } from '../utils/generatePDF.js';

const orderRouter = express.Router();

// Admin Features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus);
orderRouter.get('/generatePDF', adminAuth, generateOrderPDF)
orderRouter.get('/generateLabel/:orderId', adminAuth, generateOrderLabel);
orderRouter.get('/details/:orderId', adminAuth, getOrderDetails); // New endpoint

// Payment Features
orderRouter.post('/place', orderAndCartAuth, placeOrder)
orderRouter.post('/stripe', orderAndCartAuth, placeOrderStripe)

// User Features
orderRouter.post('/userorders', orderAndCartAuth, userOrders)

// Verify Payment
orderRouter.post('/verifyStripe', orderAndCartAuth, verifyStripe)

export default orderRouter;