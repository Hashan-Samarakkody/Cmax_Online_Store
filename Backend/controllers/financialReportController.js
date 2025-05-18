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

        // Prefetch all categories and subcategories for latest data
        const allCategories = await categoryModel.find({});
        const allSubcategories = await subcategoryModel.find({});

        // Add maps for quick lookup
        const categoryMap = new Map(allCategories.map(cat => [cat._id.toString(), cat.name]));
        const subcategoryMap = new Map(allSubcategories.map(subcat => [subcat._id.toString(), subcat.name]));

        const salesData = await processFinancialData(orders, categoryMap, subcategoryMap);

        // Properly format the response with success flag
        res.json({ success: true, salesData });
    } catch (error) {
        console.error('Error generating financial sales report:', error);
        res.status(500).json({ success: false, message: 'Error generating financial sales report', error: error.message });
    }
};

// Updated helper functions to get latest category and subcategory names
async function getCategoryName(categoryId, categoryMap) {
    try {
        if (!categoryId) return 'Uncategorized';

        // Convert ObjectId to string if needed
        const catId = categoryId.toString ? categoryId.toString() : categoryId;

        // Check the map first for the latest name
        if (categoryMap && categoryMap.has(catId)) {
            return categoryMap.get(catId);
        }

        // If not found in the map and it's a valid ObjectId, query directly
        if (mongoose.Types.ObjectId.isValid(categoryId)) {
            const category = await categoryModel.findById(categoryId);
            if (category && category.name) {
                return category.name;
            }
        }

        return categoryId || 'Uncategorized';
    } catch (error) {
        console.error('Error getting category name:', error);
        return 'Uncategorized';
    }
}

async function getSubcategoryName(subcategoryId, subcategoryMap) {
    try {
        if (!subcategoryId) return 'Uncategorized';

        // Convert ObjectId to string if needed
        const subId = subcategoryId.toString ? subcategoryId.toString() : subcategoryId;

        // Check the map first for the latest name
        if (subcategoryMap && subcategoryMap.has(subId)) {
            return subcategoryMap.get(subId);
        }

        // If not found in the map and it's a valid ObjectId, query directly
        if (mongoose.Types.ObjectId.isValid(subcategoryId)) {
            const subcategory = await subcategoryModel.findById(subcategoryId);
            if (subcategory && subcategory.name) {
                return subcategory.name;
            }
        }

        return subcategoryId || 'Uncategorized';
    } catch (error) {
        console.error('Error getting subcategory name:', error);
        return 'Uncategorized';
    }
}

async function processFinancialData(orders, categoryMap, subcategoryMap) {
    const result = {};

    for (const order of orders) {
        if (!order.items || !Array.isArray(order.items)) {
            continue;
        }

        for (const item of order.items) {
            try {
                // Extract product ID
                const productId = item.productId?.toString() || item._id?.toString() || 'unknown';

                // Get category and subcategory IDs
                let categoryId = item.category || 'Uncategorized';
                let subcategoryId = item.subcategory || 'Uncategorized';

                // Convert ObjectId to string if needed
                if (categoryId?._id) categoryId = categoryId._id;
                if (subcategoryId?._id) subcategoryId = subcategoryId._id;

                // Get the latest category and subcategory names
                const categoryName = await getCategoryName(categoryId, categoryMap) || "Uncategorized";
                const subcategoryName = await getSubcategoryName(subcategoryId, subcategoryMap) || "Uncategorized";

                // Ensure names are strings
                const catNameStr = String(categoryName);
                const subcatNameStr = String(subcategoryName);

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
                        // Use the color from size if  don't already have one
                        if (color === '-' && parts[1] !== 'undefined') {
                            color = parts[1];
                        }
                    }
                }

                const quantity = Number(item.quantity) || 1;
                const unitPrice = Number(item.price) || 0;

                // Initialize nested structure if needed
                if (!result[catNameStr]) result[catNameStr] = {};
                if (!result[catNameStr][subcatNameStr]) result[catNameStr][subcatNameStr] = {};
                if (!result[catNameStr][subcatNameStr][productId]) {
                    result[catNameStr][subcatNameStr][productId] = {
                        productName,
                        variations: []
                    };
                }

                // Find if this color/size combination already exists
                const existingVariation = result[catNameStr][subcatNameStr][productId].variations.find(
                    v => v.color === color && v.size === size
                );

                if (existingVariation) {
                    existingVariation.quantity += quantity;
                } else {
                    result[catNameStr][subcatNameStr][productId].variations.push({
                        color,
                        size,
                        quantity,
                        unitPrice
                    });
                }
            } catch (error) {
                console.error('Error processing item:', error, item);
                // Continue with next item instead of failing the entire report
            }
        }
    }

    return result;
}

export { getFinancialSalesReport };