import { GoogleGenerativeAI } from '@google/generative-ai';
import { formatDistanceToNow } from 'date-fns';
import orderModel from '../models/orderModel.js';
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

        // Get response from Gemini API with context
        const response = await getGeminiResponse(message, pageContext, userId);

        res.json({
            success: true,
            reply: response
        });
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
    try {
        // Create contextual system prompt based on page and user
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

        // Initialize the Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Create chat session
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Hi there" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hello! Welcome to Cmax Online Store. How can I help you with your shopping today?" }],
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 200,
            },
        });

        // Send message to Gemini with context
        const result = await chat.sendMessage(
            `${systemPrompt}\n\nUser message: ${message}`
        );

        const response = result.response.text();
        return response;
    } catch (error) {
        console.error('Error with Gemini API:', error);
        // Fallback response if Gemini fails
        return handleFallbackResponse(message, pageContext);
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

export { processMessage };