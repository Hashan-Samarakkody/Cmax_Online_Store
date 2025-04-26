import returnModel from '../models/returnModel.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import { broadcast } from '../server.js';
import nodemailer from 'nodemailer';
import generateOrderId from '../utils/generateOrderId.js';

// Create return request
const createReturnRequest = async (req, res) => {
    try {
        const { orderId, items, reason } = req.body;
        const userId = req.user.id;

        // Find original order
        const originalOrder = await orderModel.findOne({ orderId: orderId });
        if (!originalOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify order belongs to user
        if (originalOrder.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized to return this order' });
        }

        // Verify order is eligible for return (e.g. within 7 days)
        const orderDate = new Date(originalOrder.date);
        const currentDate = new Date();
        const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

        if (daysDifference > 7) {
            return res.status(400).json({
                success: false,
                message: 'Order is not eligible for return. Returns must be initiated within 7 days of delivery.'
            });
        }

        // Calculate refund amount based on returned items
        let refundAmount = 0;
        const returnItems = [];

        for (const item of items) {
            // Find item in original order
            const originalItem = originalOrder.items.find(oi =>
                oi.productId === item.productId &&
                oi.size === item.size &&
                oi.color === item.color
            );

            if (!originalItem) {
                return res.status(400).json({
                    success: false,
                    message: `Item not found in original order: ${item.name}`
                });
            }

            // Ensure return quantity doesn't exceed original quantity
            if (item.quantity > originalItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Return quantity exceeds purchased quantity for ${item.name}`
                });
            }

            // Calculate refund for this item
            const itemRefund = originalItem.price * item.quantity;
            refundAmount += itemRefund;

            // Add to return items
            returnItems.push({
                ...item,
                price: originalItem.price
            });
        }

        // Generate return ID
        const returnId = await generateOrderId({ items: returnItems, prefix: 'RET' });

        // Create return record
        const returnData = {
            returnId: returnId,
            originalOrderId: orderId,
            userId,
            items: returnItems,
            status: 'Requested',
            refundAmount,
            refundMethod: originalOrder.paymentMethod === 'Stripe' ? 'Original Payment Method' : 'Store Credit',
            requestedDate: Date.now()
        };

        const newReturn = new returnModel(returnData);
        await newReturn.save();

        // Send email notification
        await sendReturnRequestEmail(userId, newReturn, originalOrder);

        // Broadcast to admin
        broadcast({
            type: 'newReturnRequest',
            return: newReturn
        });

        res.status(201).json({
            success: true,
            message: 'Return request submitted successfully',
            return: newReturn
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user returns
const getUserReturns = async (req, res) => {
    try {
        const userId = req.user.id;
        const returns = await returnModel.find({ userId }).sort({ requestedDate: -1 });

        res.json({ success: true, returns });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to send return request email
const sendReturnRequestEmail = async (userId, returnData, originalOrder) => {
    try {
        const user = await userModel.findById(userId);
        if (!user || !user.email) return;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Format return items
        let itemsHtml = '';
        returnData.items.forEach(item => {
            const itemDetails = [];
            if (item.size) {
                const [size, color] = item.size.split('_');
                itemDetails.push(`Size: ${size}`);
                if (color) itemDetails.push(`Color: ${color}`);
            }

            itemsHtml += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        ${item.name}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        ${itemDetails.join(', ') || 'N/A'}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                        ${item.quantity}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        ${item.reason}
                    </td>
                </tr>
            `;
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Return Request #${returnData.returnId} - Cmax Online Store`,
            html: `
            <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3366cc;">Cmax Online Store</h1>
                    <h2 style="margin-top: 10px;">Return Request Confirmation</h2>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p>Dear ${user.name},</p>
                    <p>We have received your return request and it is being processed.</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="margin-top: 0;">Return Details</h3>
                    <p><b>Return ID:</b> ${returnData.returnId}</p>
                    <p><b>Original Order ID:</b> ${originalOrder.orderId}</p>
                    <p><b>Date Requested:</b> ${new Date(returnData.requestedDate).toLocaleDateString()}</p>
                    <p><b>Status:</b> ${returnData.status}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>Items to Return</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left;">Product</th>
                            <th style="padding: 10px; text-align: left;">Details</th>
                            <th style="padding: 10px; text-align: center;">Quantity</th>
                            <th style="padding: 10px; text-align: left;">Reason</th>
                        </tr>
                        ${itemsHtml}
                    </table>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="margin-top: 0;">Next Steps</h3>
                    <p>1. Your return request will be reviewed within 24-48 hours.</p>
                    <p>2. If approved, you will receive return instructions and a shipping label by email.</p>
                    <p>3. Pack the item(s) in their original packaging if possible.</p>
                    <p>4. Attach the provided shipping label and drop off the package at the designated carrier.</p>
                    <p>5. Once we receive and inspect your return, your refund will be processed.</p>
                </div>
                
                <div style="margin-top: 20px;">
                    <p>If you have any questions, please contact our customer support at support@cmaxstore.com.</p>
                    <p>Thank you for shopping with us!</p>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending return confirmation email:', error);
    }
};

// Get all returns for admin
const getAdminReturns = async (req, res) => {
    try {
        // Find all returns and sort by requestedDate
        const returns = await returnModel.find().sort({ requestedDate: -1 });

        // Get user details for each return
        const returnsWithUserDetails = await Promise.all(
            returns.map(async (returnItem) => {
                const user = await userModel.findById(returnItem.userId);
                const returnObj = returnItem.toObject();

                // Add user details to the return object
                returnObj.userName = user ? user.name : 'Unknown User';

                return returnObj;
            })
        );

        res.json({ success: true, returns: returnsWithUserDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update return status by admin
const updateReturnStatus = async (req, res) => {
    try {
        const { returnId, status, trackingId } = req.body;

        if (!returnId || !status) {
            return res.status(400).json({ success: false, message: 'Return ID and status are required' });
        }

        const returnRequest = await returnModel.findOne({ _id: returnId });

        if (!returnRequest) {
            return res.status(404).json({ success: false, message: 'Return request not found' });
        }

        // Update return status
        returnRequest.status = status;

        // Update tracking ID if provided
        if (trackingId) {
            returnRequest.returnTrackingId = trackingId;
        }

        // If status is 'Completed', set completed date
        if (status === 'Completed') {
            returnRequest.completedDate = Date.now();

            // Process the refund based on refundMethod
            if (returnRequest.refundMethod === 'Original Payment Method') {
                console.log(`Processing refund of ${returnRequest.refundAmount} to original payment method`);
                
                // Example Stripe integration would be:
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                await stripe.refunds.create({
                  payment_intent: originalOrder.paymentIntentId,
                  amount: Math.round(returnRequest.refundAmount * 100)
                });
            } else if (returnRequest.refundMethod === 'Store Credit') {
                // Add store credit to user account
                const user = await userModel.findById(returnRequest.userId);
                if (user) {
                    // Add store credit
                    user.storeCredit = (user.storeCredit || 0) + returnRequest.refundAmount;
                    await user.save();
                    console.log(`Added ${returnRequest.refundAmount} store credit to user ${user.name}`);
                }
            }
            
            // Record refund date
            returnRequest.refundProcessedDate = Date.now();
        }

        await returnRequest.save();

        // Notify user about status change
        await sendReturnStatusUpdateEmail(returnRequest);

        // Broadcast status change
        broadcast({
            type: 'returnStatusUpdate',
            return: returnRequest
        });

        res.json({
            success: true,
            message: 'Return status updated successfully',
            return: returnRequest
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to send status update email
const sendReturnStatusUpdateEmail = async (returnData) => {
    try {
        const user = await userModel.findById(returnData.userId);
        if (!user || !user.email) return;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Status specific instructions
        let statusInstructions = '';

        switch (returnData.status) {
            case 'Approved':
                statusInstructions = `
                    <p>Your return has been approved. Please return the item(s) within 7 days.</p>
                    ${returnData.returnTrackingId ? `<p><strong>Return Tracking ID:</strong> ${returnData.returnTrackingId}</p>` : ''}
                    <p>Pack the items securely and drop them off at your nearest post office.</p>
                `;
                break;
            case 'Completed':
                statusInstructions = `
                    <p>Your return has been completed and your refund has been processed.</p>
                    <p><strong>Refund Method:</strong> ${returnData.refundMethod}</p>
                    <p><strong>Refund Amount:</strong> Rs. ${returnData.refundAmount}</p>
                `;
                break;
            case 'Rejected':
                statusInstructions = `
                    <p>Unfortunately, your return request has been rejected.</p>
                    <p>For more information, please contact our customer support.</p>
                `;
                break;
            default:
                statusInstructions = `<p>Your return is now: ${returnData.status}</p>`;
                break;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Return #${returnData.returnId} - Status Update - Cmax Online Store`,
            html: `
            <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3366cc;">Cmax Online Store</h1>
                    <h2 style="margin-top: 10px;">Return Status Update</h2>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p>Dear ${user.name},</p>
                    <p>Your return request has been updated.</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="margin-top: 0;">Return Details</h3>
                    <p><b>Return ID:</b> ${returnData.returnId}</p>
                    <p><b>Original Order ID:</b> ${returnData.originalOrderId}</p>
                    <p><b>Status:</b> <span style="color: ${returnData.status === 'Completed' ? 'green' : (returnData.status === 'Rejected' ? 'red' : 'blue')};">${returnData.status}</span></p>
                    <p><b>Date Requested:</b> ${new Date(returnData.requestedDate).toLocaleDateString()}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    ${statusInstructions}
                </div>
                
                <div style="margin-top: 20px;">
                    <p>If you have any questions, please contact our customer support at support@cmaxstore.com.</p>
                    <p>Thank you for shopping with us!</p>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending return status update email:', error);
    }
};

export { createReturnRequest, getUserReturns, getAdminReturns, updateReturnStatus };