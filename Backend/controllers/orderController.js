import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js'
import Stripe from 'stripe'
import { broadcast } from '../server.js'
import generateOrderId from '../utils/generateOrderId.js'
import nodemailer from 'nodemailer'

// Global variables
const currency = "LKR"
const deliveryCharge = 30

// Initialize the payment gateway
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Helper function to send order confirmation email
const sendOrderConfirmationEmail = async (userId, order) => {
    try {
        // Get user details
        const user = await userModel.findById(userId);
        if (!user || !user.email) return;

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Format the item details
        let itemsHtml = '';
        let totalAmount = 0;

        order.items.forEach(item => {
            const itemDetails = [];

            // Format size and color info
            let sizeColorInfo = '';
            if (item.size && item.color && item.size !== 'undefined_undefined' && item.color !== 'undefined_undefined') {
                sizeColorInfo = `Size: <b>${item.size}</b> | Color: <b>${item.color}</b>`;
            } else if (item.size && item.size !== 'undefined_undefined' && item.size !== 'undefined') {
                if (item.size.includes('_')) {
                    const [sizePart, colorPart] = item.size.split('_');
                    if (sizePart !== 'undefined' && colorPart !== 'undefined') {
                        sizeColorInfo = `Size: <b>${sizePart}</b> | Color: <b>${colorPart}</b>`;
                    } else if (sizePart !== 'undefined') {
                        sizeColorInfo = `Size: <b>${sizePart}</b>`;
                    } else if (colorPart !== 'undefined') {
                        sizeColorInfo = `Color: <b>${colorPart}</b>`;
                    }
                } else {
                    sizeColorInfo = `Size: <b>${item.size}</b>`;
                }
            } else if (item.color && item.color !== 'undefined_undefined' && item.color !== 'undefined') {
                sizeColorInfo = `Color: <b>${item.color}</b>`;
            }

            const subtotal = item.price * item.quantity;
            totalAmount += subtotal;

            itemsHtml += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <img src="${item.images[0]}" alt="${item.name}" style="width: 60px; height: auto; border-radius: 5px;">
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <b>${item.name}</b><br>
                        ${sizeColorInfo ? sizeColorInfo + '<br>' : ''}
                        Quantity: <b>${item.quantity}</b>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                        ${currency} ${item.price.toFixed(2)} x ${item.quantity} = <b>${currency} ${subtotal.toFixed(2)}</b>
                    </td>
                </tr>
            `;
        });

        // Add delivery charge
        totalAmount += deliveryCharge;

        // Format the date
        const orderDate = new Date(order.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Setup email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Order Confirmation - #${order.orderId} - Cmax Online Store`,
            html: `
            <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3366cc;">Cmax Online Store</h1>
                    <h2 style="margin-top: 10px;">Order Confirmation</h2>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p>Dear ${user.name},</p>
                    <p>Thank you for shopping with Cmax Online Store! We have received your order and it is being processed.</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="margin-top: 0;">Order Details</h3>
                    <p><b>Order ID:</b> ${order.orderId}</p>
                    <p><b>Date:</b> ${orderDate}</p>
                    <p><b>Payment Method:</b> ${order.paymentMethod}</p>
                    <p><b>Payment Status:</b> ${order.payment ? '<span style="color: green;">Paid</span>' : '<span style="color: red;">Pending</span>'}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>Items Ordered</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left;">Image</th>
                            <th style="padding: 10px; text-align: left;">Product</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                        </tr>
                        ${itemsHtml}
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; border-top: 2px solid #ddd;"><b>Delivery Charge:</b></td>
                            <td style="padding: 10px; text-align: right; border-top: 2px solid #ddd;">${currency} ${deliveryCharge.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right;"><b>Total Amount:</b></td>
                            <td style="padding: 10px; text-align: right;"><b>${currency} ${totalAmount.toFixed(2)}</b></td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="margin-top: 0;">Delivery Information</h3>
                    <p><b>Name:</b> ${order.address.firstName} ${order.address.lastName}</p>
                    <p><b>Address:</b> ${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.postalCode}</p>
                    <p><b>Contact:</b> ${order.address.phoneNumber}</p>
                </div>
                
                ${!order.payment && order.paymentMethod === 'Cash On Delivery' ? `
                <div style="background-color: #fff3cd; padding: 15px; margin-bottom: 20px; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <h3 style="margin-top: 0; color: #856404;">Payment Information</h3>
                    <p>Please have <b>${currency} ${totalAmount.toFixed(2)}</b> ready for the delivery person when your order arrives.</p>
                </div>
                ` : ''}
                
                <div style="margin-top: 20px;">
                    <p>If you have any questions or concerns regarding your order, please contact our customer support at <a href="mailto:support@cmaxstore.com">support@cmaxstore.com</a> or call us at +94-11-123-4567.</p>
                    <p>Thank you for shopping with us!</p>
                    <p>Best regards,<br>The Cmax Online Store Team</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10pt; color: #777; text-align: center;">
                    <p>© ${new Date().getFullYear()} Cmax Online Store. All rights reserved.</p>
                </div>
            </div>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        // Don't stop the order process if email fails
    }
};

// Place orders using cash on delivery method
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body

        // Ensure we have complete address information
        if (!address || !address.firstName || !address.street || !address.city || !address.state) {
            return res.json({ success: false, message: 'Complete address information is required' });
        }

        // Generate custom order ID
        const orderId = await generateOrderId({ items });

        const orderData = {
            userId,
            orderId,
            items,
            amount,
            address,
            paymentMethod: 'Cash On Delivery',
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        // Send order confirmation email
        await sendOrderConfirmationEmail(userId, orderData);

        res.json({ success: true, message: 'Order Placed Successfully' })

        // Broadcast new order
        broadcast({ type: 'newOrder', order: newOrder });  // Send the new order via WebSocket

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


// Place orders using Stripe method
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body
        const { origin } = req.headers

        // Generate custom order ID
        const orderId = await generateOrderId({ items });

        const orderData = {
            userId,
            orderId,
            items,
            amount,
            address,
            paymentMethod: 'Stripe',
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Charge"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


// Verify Stripe
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { payment: true }, { new: true });
            await userModel.findByIdAndUpdate(userId, { cartData: {} });

            // Send order confirmation email after successful payment
            await sendOrderConfirmationEmail(userId, updatedOrder);

            res.json({ success: true })
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//  All orders data for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// User order data for frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await orderModel.find({ userId })
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Helper function to send order status update email
const sendOrderStatusUpdateEmail = async (userId, order, trackingId = null) => {
    try {
        // Get user details
        const user = await userModel.findById(userId);
        if (!user || !user.email) return;

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Customize subject and message based on status
        let subject = `Order #${order.orderId} Status Update - ${order.status}`;
        let statusMessage = '';
        let trackingInfo = '';

        switch (order.status) {
            case 'Order Placed':
                statusMessage = 'Your order has been received and is being processed.';
                break;
            case 'Picking':
                statusMessage = 'Good news! We are now picking items for your order.';
                break;
            case 'Out for Delivery':
                statusMessage = 'Your order is now out for delivery and will arrive soon.';
                break;
            case 'Delivered':
                statusMessage = 'Your order has been delivered successfully!';
                if (trackingId) {
                    trackingInfo = `
          <div style="background-color: #f0f7ff; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #3366cc;">
            <h3 style="margin-top: 0; color: #3366cc;">Tracking Information</h3>
            <p>You can track your delivery using the following tracking ID: <b>${trackingId}</b></p>
            <p>Visit <a href="https://koombiyodelivery.lk/Track/track_id" style="color: #3366cc; font-weight: bold;">KoombiyoDelivery Tracking</a> to track your package.</p>
          </div>`;
                }
                break;
            default:
                statusMessage = `Your order status has been updated to: ${order.status}`;
        }

        // Setup email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: subject,
            html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background: linear-gradient(to right, #f5f7fa, #eef2f7);">
          <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #3366cc;">Cmax Online Store</h1>
              <h2 style="margin-top: 10px;">Order Status Update</h2>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <p>Dear ${user.name},</p>
              <p>${statusMessage}</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px;">
                  <h3 style="margin-top: 0;">Order Information</h3>
                  <p><b>Order ID:</b> ${order.orderId}</p>
                  <p><b>Status:</b> <span style="color: #3366cc; font-weight: bold;">${order.status}</span></p>
                  <p><b>Date:</b> ${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              
              ${trackingInfo}
              
              <p>Thank you for shopping with us!</p>
              <p>Best regards,<br>The Cmax Online Store Team</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #777777; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Cmax Online Store. All rights reserved.</p>
          </div>
      </div>
      `
        };

        // Send the email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending status update email:', error);
    }
};

// Update order status from admin panel (updated function)
const updateStatus = async (req, res) => {
    try {
        const { orderId, status, trackingId } = req.body;
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

        // Send email notification about status update
        await sendOrderStatusUpdateEmail(updatedOrder.userId, updatedOrder, status === 'Delivered' ? trackingId : null);

        // If tracking ID is provided and status is Delivered, save it to the order
        if (status === 'Delivered' && trackingId) {
            updatedOrder.trackingId = trackingId;
            await updatedOrder.save();
        }

        // Broadcast status update via WebSocket
        broadcast({
            type: 'orderStatusUpdate',
            orderId: updatedOrder._id,
            userId: updatedOrder.userId,
            status: status,
            trackingId: trackingId || null
        });

        res.json({ success: true, message: 'Status Updated!' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get order details by orderId
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Find the order by orderId (not MongoDB _id)
        const order = await orderModel.findOne({ orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve order details'
        });
    }
};


export { placeOrder, placeOrderStripe, allOrders, userOrders, updateStatus, verifyStripe, getOrderDetails }