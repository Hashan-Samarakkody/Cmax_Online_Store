import { GoogleGenerativeAI } from '@google/generative-ai';
import { formatDistanceToNow } from 'date-fns';
import orderModel from '../models/orderModel.js';
import adminModel from '../models/adminModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Process and respond to chatbot messages
const processMessage = async (req, res) => {
    try {
        const { message, pageContext, userId } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        try {
            // Try to get response from Gemini API with context
            const response = await getGeminiResponse(message, pageContext, userId);

            res.json({
                success: true,
                reply: response
            });
        } catch (error) {
            // If Gemini API fails, use fallback
            console.error('Error with Gemini API:', error);
            const fallbackResponse = handleFallbackResponse(message, pageContext);

            res.json({
                success: true,
                reply: fallbackResponse,
                fromFallback: true
            });
        }
    } catch (error) {
        console.error('Error processing chatbot message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing your message'
        });
    }
};

// Function to get responses from Gemini API
const getGeminiResponse = async (message, pageContext, userId) => {
    // Add contextual system prompt based on page and user
    let systemPrompt = `You are a helpful shopping assistant for Cmax Online Store.
Be friendly, concise, and helpful. Keep responses under 80 words.
The user is currently on the "${pageContext}" page of our website.`;

    // Add page-specific context
    switch (pageContext) {
        case 'home':
            systemPrompt += `
On this page, users can see featured products, promotions, and navigate to other sections of the site.
Common questions are about new arrivals, promotions, deals, and finding specific products.`;
            break;

        case 'collection':
            systemPrompt += `
On this page, users can browse products by category, filter, and sort them.
Common questions are about product availability, filtering, sorting, and categories.`;
            break;

        case 'orders':
            systemPrompt += `
On this page, users can view their order history, track orders, and see order details.
Common questions are about order status, tracking, cancellation, and returns.`;
            break;

        case 'placeorder':
            systemPrompt += `
On this page, users are finalizing their purchase.
Common questions are about payment methods, delivery options, address changes, and discounts.
We accept Cash on Delivery and Credit/Debit cards via Stripe.`;
            break;

        case 'about':
            systemPrompt += `
On this page, users learn about Cmax Online Store's history and mission.
Common questions are about the company history, values, team, and business practices.`;
            break;

        case 'contact':
            systemPrompt += `
On this page, users can find ways to get in touch with Cmax support.
Our email is cmaxinfohelp@gmail.com and phone is 075-96352164.
Common questions are about support hours, response times, and contact methods.`;
            break;

        case 'cart':
            systemPrompt += `
On this page, users can view items in their shopping cart, update quantities, and proceed to checkout.
Common questions are about adding/removing items, price calculations, discounts, and checkout process.`;
            break;

        case 'returns':
            systemPrompt += `
On this page, users can initiate and track product returns.
Common questions are about return policy, how to return items, refund timeframes, and return status tracking.
Items can be returned within 7 days of delivery.`;
            break;

        case 'profile':
            systemPrompt += `
On this page, users can view and update their account information, addresses, and preferences.
Common questions are about changing personal information, adding addresses, and account security.`;
            break;
    }

    // Add user-specific context if available
    if (userId) {
        systemPrompt += `\nThe user is logged in to their account.`;

        // Optional: Add user's order history context
        try {
            const recentOrder = await orderModel.findOne({ userId }).sort({ date: -1 });
            if (recentOrder) {
                const timeAgo = formatDistanceToNow(new Date(recentOrder.date), { addSuffix: true });
                systemPrompt += `
Their most recent order was placed ${timeAgo} and is currently "${recentOrder.status}".`;
            }
        } catch (err) {
            console.error("Error fetching user order data:", err);
        }
    } else {
        systemPrompt += `\nThe user is not logged in.`;
    }

    // Add store info context
    systemPrompt += `
Store information:
- Email: cmaxhelp@info.com
- Phone: 075-96352164
- Standard delivery: 3-5 business days
- Free shipping on orders over Rs. 5000
- Returns accepted within 7 days of delivery`;

    try {
        // Try using gemini-1.5-flash first (less likely to hit rate limits)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Send message to Gemini with direct content generation
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: `${systemPrompt}\n\nUser message: ${message}` }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
            }
        });

        const response = result.response.text();
        return response;
    } catch (error) {
        // If first attempt fails with 429, throw the error to trigger fallback
        if (error.status === 429) {
            throw error;
        }

        // If it's some other error, try one more time with fewer parameters
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

            // Simplified request with fewer tokens
            const result = await model.generateContent({
                contents: [{ text: `You are a shopping assistant. User asks: ${message}` }],
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 100,
                }
            });

            const response = result.response.text();
            return response;
        } catch (retryError) {
            // If retry also fails, throw to trigger fallback
            throw retryError;
        }
    }
};

// Fallback responses if Gemini API fails
const handleFallbackResponse = (message, pageContext) => {
    const message_lower = message.toLowerCase();

    // Common questions across all pages
    if (message_lower.includes('help') || message_lower.includes('support')) {
        return "I'm here to help! What information do you need about our products, orders, or services?";
    }

    if (message_lower.includes('contact') || message_lower.includes('reach you')) {
        return "You can reach our support team at cmaxinfohelp@gmail.com or call us at 075-96352164.";
    }

    if (message_lower.includes('hello') || message_lower.includes('hi ') || message_lower === 'hi') {
        return "Hello there! How can I assist you with your shopping today?";
    }

    if (message_lower.includes('ship') || message_lower.includes('delivery')) {
        return "We offer standard delivery in 3-5 business days. Orders over Rs. 5000 qualify for free shipping!";
    }

    if (message_lower.includes('return') || message_lower.includes('refund')) {
        return "You can return items within 7 days of delivery. Visit our Returns page to start the process.";
    }

    if (message_lower.includes('payment') || message_lower.includes('pay')) {
        return "We accept Cash on Delivery and Credit/Debit cards via Stripe.";
    }

    if (message_lower.includes('track') || message_lower.includes('order status')) {
        return "You can track your orders in the Orders section of your account. Need help finding your order?";
    }

    // Page-specific fallback responses
    switch (pageContext) {
        case 'home':
            return "Welcome to Cmax Online Store! You can browse our featured products here or use the navigation to explore specific categories.";

        case 'collection':
            return "You can browse our collection and use filters to find what you're looking for. Need help finding something specific?";

        case 'orders':
            return "You can track your orders and view order history here. Need help with a specific order?";

        case 'placeorder':
            return "We accept Cash on Delivery and card payments via Stripe. Is there anything specific about placing your order that you need help with?";

        case 'about':
            return "Cmax Online Store is dedicated to providing high-quality products with excellent customer service. What would you like to know about us?";

        case 'contact':
            return "You can reach us at cmaxinfohelp@gmail.com or call 075-96352164. How would you like to contact us?";

        case 'cart':
            return "This is your shopping cart. You can update quantities, remove items, or proceed to checkout when you're ready.";

        case 'returns':
            return "Our return policy allows returns within 7 days of delivery. You can initiate a return request from this page.";

        case 'profile':
            return "Here you can manage your account information, addresses, and preferences. What would you like to update?";

        default:
            return "How can I help you with your shopping experience today?";
    }
};

// Process admin chatbot messages
const processAdminChatbotMessage = async (req, res) => {
    try {
        const { message, pageContext } = req.body;
        const adminId = req.admin?.id;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        try {
            // Try to get response from Gemini API with admin context
            const response = await getAdminGeminiResponse(message, pageContext, adminId);

            res.json({
                success: true,
                reply: response
            });
        } catch (error) {
            // If Gemini API fails, use fallback
            console.error('Error with Gemini API for admin chat:', error);
            const fallbackResponse = handleAdminFallbackResponse(message, pageContext);

            res.json({
                success: true,
                reply: fallbackResponse,
                fromFallback: true
            });
        }
    } catch (error) {
        console.error('Error processing admin chatbot message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing your message',
            reply: "Sorry, I'm having trouble responding right now. Please try again later."
        });
    }
};

// Function to get admin-specific responses from Gemini API
const getAdminGeminiResponse = async (message, pageContext, adminId) => {
    // Add system prompt for admin context
    let adminSystemPrompt = `You are an AI assistant for Cmax Online Store's admin panel.
Be professional, concise, and helpful. Keep responses under 100 words.
The admin is currently on the "${pageContext}" page of the admin panel.`;

    // Add page-specific admin context
    switch (pageContext) {
        case 'admin_dashboard':
            adminSystemPrompt += `
On this page, admins can view sales overview, recent orders, and performance metrics.
Common questions are about sales trends, daily metrics, and store performance.`;
            break;

        case 'admin_orders':
            adminSystemPrompt += `
On this page, admins can manage customer orders, update order status, and generate labels.
Common questions are about order processing, status updates, and shipping labels.`;
            break;

        case 'admin_products':
            adminSystemPrompt += `
On this page, admins can view, search and manage the product inventory.
Common questions are about product management, editing listings, and inventory.`;
            break;

        case 'admin_add_product':
            adminSystemPrompt += `
On this page, admins can add new products to the store.
Common questions are about product details, categories, images, and pricing.`;
            break;

        case 'admin_edit_product':
            adminSystemPrompt += `
On this page, admins can modify existing product listings.
Common questions are about updating product information, images, and availability.`;
            break;

        case 'admin_categories':
            adminSystemPrompt += `
On this page, admins can manage product categories and subcategories.
Common questions are about creating categories, organizing products, and category relationships.`;
            break;

        case 'admin_management':
            adminSystemPrompt += `
On this page, admins can manage other admin accounts and permissions.
Common questions are about user roles, permissions, and account management.`;
            break;

        case 'admin_profile':
            adminSystemPrompt += `
On this page, admins can view and update their own account information.
Common questions are about profile settings, security, and account preferences.`;
            break;

        case 'admin_sales_report':
            adminSystemPrompt += `
On this page, admins can generate and view detailed sales reports.
Common questions are about report generation, date ranges, and data export.`;
            break;

        case 'admin_returns':
            adminSystemPrompt += `
On this page, admins can manage customer return requests.
Common questions are about handling returns, refunds, and return status updates.`;
            break;

        case 'admin_return_analysis':
            adminSystemPrompt += `
On this page, admins can view analytics about product returns.
Common questions are about return rates, reasons for returns, and product quality issues.`;
            break;

        case 'admin_user_activity':
            adminSystemPrompt += `
On this page, admins can view reports on user activity and engagement.
Common questions are about user behavior, engagement metrics, and traffic patterns.`;
            break;

        default:
            adminSystemPrompt += `
You can help with general admin tasks including product management, order processing, category management, and reporting.`;
    }

    // Add admin-specific info
    if (adminId) {
        try {
            const admin = await adminModel.findById(adminId);
            if (admin) {
                adminSystemPrompt += `\nYou're speaking with ${admin.name}, who is an administrator.`;
            }
        } catch (err) {
            console.error("Error fetching admin data:", err);
        }
    }

    // Add admin-specific information about store operations
    adminSystemPrompt += `
Admin panel functionality:
- Dashboard: View sales metrics and store performance
- Products: Add, edit, and manage product listings
- Orders: Process customer orders and update order status
- Categories: Organize products into categories and subcategories
- Returns: Handle customer return requests
- Reports: Generate sales and activity reports
- Admin Management: Manage admin accounts and permissions`;

    try {
        // Try using gemini-1.5-flash first to avoid rate limits
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Send message to Gemini with direct content generation
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: `${adminSystemPrompt}\n\nAdmin message: ${message}` }]
                }
            ],
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 200,
            }
        });

        const response = result.response.text();
        return response;
    } catch (error) {
        // If first attempt fails with 429, throw the error to trigger fallback
        if (error.status === 429) {
            throw error;
        }

        // If it's some other error, try one more time with fewer parameters
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

            // Simplified request with fewer tokens
            const result = await model.generateContent({
                contents: [{ text: `You are an admin assistant. Admin asks: ${message}` }],
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 100,
                }
            });

            const response = result.response.text();
            return response;
        } catch (retryError) {
            // If retry also fails, throw to trigger fallback
            throw retryError;
        }
    }
};

// Admin-specific fallback responses if Gemini API fails
const handleAdminFallbackResponse = (message, pageContext) => {
    const message_lower = message.toLowerCase();

    // Common admin questions across all pages
    if (message_lower.includes('help') || message_lower.includes('support')) {
        return "I'm here to help with the admin panel. What specific area do you need assistance with?";
    }

    if (message_lower.includes('hello') || message_lower.includes('hi ') || message_lower === 'hi') {
        return "Hello! I'm your admin assistant. How can I help you manage the store today?";
    }

    // Topic-specific fallback responses
    if (message_lower.includes('sales')) {
        return "You can view detailed sales reports in the Sales Report section. Would you like me to help you navigate there?";
    }
    else if (message_lower.includes('order') || message_lower.includes('orders')) {
        return "You can manage all orders from the Orders section. Need help with anything specific about orders?";
    }
    else if (message_lower.includes('product') && message_lower.includes('add')) {
        return "To add a new product, go to Add Product and fill in the details. Remember to include high-quality images for better conversion.";
    }
    else if (message_lower.includes('return') || message_lower.includes('returns')) {
        return "Return requests can be managed in the Returns section. For analytics on returns, check the Return Analysis page.";
    }
    else if (message_lower.includes('category') || message_lower.includes('categories')) {
        return "Categories and subcategories can be managed in the Category Manager. Would you like me to explain how to add new categories?";
    }

    // Page-specific fallback responses
    switch (pageContext) {
        case 'admin_dashboard':
            return "This dashboard provides an overview of your store's performance, sales trends, and recent orders. What specific metrics would you like to explore?";

        case 'admin_orders':
            return "You can manage customer orders here. You can update status, add tracking information, or view order details. How can I help with orders?";

        case 'admin_products':
            return "This page shows all products in your inventory. You can search, filter, edit or delete products. What would you like to do with your products?";

        case 'admin_add_product':
            return "Here you can add new products to your store. Make sure to include all required details, images, and pricing information. Need help with any specific field?";

        case 'admin_edit_product':
            return "You're currently editing a product. You can modify all details including name, description, price, inventory, and images. What would you like to update?";

        case 'admin_categories':
            return "Here you can create and manage product categories and subcategories to organize your inventory. What would you like to do with categories?";

        case 'admin_management':
            return "This section lets you manage other admin accounts, set permissions, and handle admin access to the store. What specific admin management task do you need help with?";

        case 'admin_profile':
            return "You can update your admin profile information, change your password, and manage your account settings here. What would you like to update?";

        case 'admin_sales_report':
            return "This tool allows you to generate detailed sales reports by date range, product, or category. What type of sales report would you like to create?";

        case 'admin_returns':
            return "Here you can process customer return requests, approve refunds, and track return status. How can I help with return management?";

        case 'admin_return_analysis':
            return "This analytics view shows patterns in product returns, common reasons for returns, and products with high return rates. What specific insights are you looking for?";

        case 'admin_user_activity':
            return "This report shows user engagement patterns, browsing behavior, and interaction with your store. What user activity metrics are you interested in?";

        default:
            return "I can help you navigate the admin panel and provide information about its features. What would you like to know?";
    }
};

export { processMessage, processAdminChatbotMessage };