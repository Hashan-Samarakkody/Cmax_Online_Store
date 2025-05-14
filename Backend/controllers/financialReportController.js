import orderModel from '../models/orderModel.js';
import mongoose from 'mongoose';
import categoryModel from '../models/categoryModel.js';
import subcategoryModel from '../models/subcategoryModel.js';

const getFinancialSalesReport = async (req, res) => {
    try {
        const { startDate } = req.query;
        const endDate = req.query.endDate || new Date().toISOString();

        // Convert string dates to Date objects for createdAt comparisons
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);

        // Also convert to timestamps for the date field comparisons
        const startTimestamp = startDateTime.getTime();
        const endTimestamp = endDateTime.getTime();

        // Modified query to properly handle both cases
        const orders = await orderModel.find({
            $or: [
                { createdAt: { $gte: startDateTime, $lte: endDateTime } },
                { date: { $gte: startTimestamp, $lte: endTimestamp } }
            ],
            status: 'Delivered'
        }).populate('items.product');

        // If no orders found, try a more lenient query without date filtering
        if (orders.length === 0) {
            const allOrders = await orderModel.find({
                status: 'Delivered'
            }).limit(10);

            if (allOrders.length > 0) {
                const salesData = await processFinancialData(allOrders);
                return res.json({ success: true, salesData });
            }
        }

        const salesData = await processFinancialData(orders);

        // Properly format the response with success flag
        res.json({ success: true, salesData });
    } catch (error) {
        console.error('Error generating financial sales report:', error);
        res.status(500).json({ success: false, message: 'Error generating financial sales report', error: error.message });
    }
};

// Cache for category and subcategory names to reduce DB queries
const categoryCache = new Map();
const subcategoryCache = new Map();

// Helper functions to get category and subcategory names
async function getCategoryName(categoryId) {
    try {
        // Return from cache if available
        if (categoryCache.has(categoryId)) {
            return categoryCache.get(categoryId);
        }

        // If it's a valid ObjectId, query the database
        if (mongoose.Types.ObjectId.isValid(categoryId)) {
            const category = await categoryModel.findById(categoryId);
            if (category && category.name) {
                categoryCache.set(categoryId, category.name);
                return category.name;
            }
        }

        // If categoryId is already a name or lookup failed, return as is
        return categoryId || 'Uncategorized';
    } catch (error) {
        console.error('Error getting category name:', error);
        return 'Uncategorized';
    }
}

async function getSubcategoryName(subcategoryId) {
    try {
        // Return from cache if available
        if (subcategoryCache.has(subcategoryId)) {
            return subcategoryCache.get(subcategoryId);
        }

        // If it's a valid ObjectId, query the database
        if (mongoose.Types.ObjectId.isValid(subcategoryId)) {
            const subcategory = await subcategoryModel.findById(subcategoryId);
            if (subcategory && subcategory.name) {
                subcategoryCache.set(subcategoryId, subcategory.name);
                return subcategory.name;
            }
        }

        // If subcategoryId is already a name or lookup failed, return as is
        return subcategoryId || 'Uncategorized';
    } catch (error) {
        console.error('Error getting subcategory name:', error);
        return 'Uncategorized';
    }
}

async function processFinancialData(orders) {
    const result = {};

    for (const order of orders) {
        if (!order.items || !Array.isArray(order.items)) {
            continue;
        }

        for (const item of order.items) {
            // Extract product ID
            const productId = item.productId || item._id || 'unknown';

            // Get category and subcategory names from IDs or objects
            let categoryName = 'Uncategorized';
            let subcategoryName = 'Uncategorized';

            // Handle category - could be ID, object, or string name
            if (item.category) {
                if (typeof item.category === 'object' && item.category.name) {
                    categoryName = item.category.name;
                } else if (typeof item.category === 'string' || typeof item.category === 'object') {
                    // Use helper function to resolve category name
                    categoryName = await getCategoryName(item.category);
                }
            }

            // Handle subcategory - could be ID, object, or string name
            if (item.subcategory) {
                if (typeof item.subcategory === 'object' && item.subcategory.name) {
                    subcategoryName = item.subcategory.name;
                } else if (typeof item.subcategory === 'string' || typeof item.subcategory === 'object') {
                    // Use helper function to resolve subcategory name
                    subcategoryName = await getSubcategoryName(item.subcategory);
                }
            }

            const productName = item.name || 'Unknown Product';

            // Extract color from size field if needed (format: "size_color")
            let color = item.color || '-';
            let size = item.size || '-';

            // If size contains color information, extract it
            if (size && size.includes('_')) {
                const parts = size.split('_');
                if (parts.length >= 2) {
                    // First part is size, second part is color
                    size = parts[0] === 'undefined' ? '-' : parts[0];
                    // Use the color from size if we don't already have one
                    if (color === '-' && parts[1] !== 'undefined') {
                        color = parts[1];
                    }
                }
            }

            const quantity = item.quantity || 1;
            const unitPrice = item.price || 0;

            // Initialize nested structure if needed
            if (!result[categoryName]) result[categoryName] = {};
            if (!result[categoryName][subcategoryName]) result[categoryName][subcategoryName] = {};
            if (!result[categoryName][subcategoryName][productId]) {
                result[categoryName][subcategoryName][productId] = {
                    productName,
                    variations: []
                };
            }

            // Find if this color/size combination already exists
            const existingVariation = result[categoryName][subcategoryName][productId].variations.find(
                v => v.color === color && v.size === size
            );

            if (existingVariation) {
                existingVariation.quantity += quantity;
            } else {
                result[categoryName][subcategoryName][productId].variations.push({
                    color,
                    size,
                    quantity,
                    unitPrice
                });
            }
        }
    }

    return result;
}

export { getFinancialSalesReport };