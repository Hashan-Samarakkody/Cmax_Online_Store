import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import productModel from '../models/productModel.js';
import returnModel from '../models/returnModel.js';
import reviewModel from '../models/reviewModel.js';
import predictionService from '../services/predictionService.js';

// Get dashboard overview statistics
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();

        // Adjust time frames to get more data
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        // Look back 7 days for weekly data instead of just current week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        // Look back 30 days for monthly data instead of just current month
        const startOfMonth = new Date(today);
        startOfMonth.setDate(today.getDate() - 30);
        startOfMonth.setHours(0, 0, 0, 0);

        // Set up yearly date frame - first day of current year
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);

        // Get all orders if time-filtered queries return nothing
        let dailyOrders = await orderModel.find({
            date: { $gte: startOfDay.getTime() }
        });

        // If no daily orders, get at least some recent orders for display
        if (dailyOrders.length === 0) {
            dailyOrders = await orderModel.find().sort({ date: -1 }).limit(5);
        }

        const dailyRevenue = dailyOrders.reduce((sum, order) => sum + order.amount, 0);
        const dailyOrderCount = dailyOrders.length;

        // Weekly and monthly stats with similar fallbacks
        let weeklyOrders = await orderModel.find({
            date: { $gte: startOfWeek.getTime() }
        });

        if (weeklyOrders.length === 0) {
            weeklyOrders = dailyOrders;
        }

        const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + order.amount, 0);
        const weeklyOrderCount = weeklyOrders.length;

        // Monthly stats
        let monthlyOrders = await orderModel.find({
            date: { $gte: startOfMonth.getTime() }
        });

        if (monthlyOrders.length === 0) {
            monthlyOrders = weeklyOrders;
        }

        const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.amount, 0);
        const monthlyOrderCount = monthlyOrders.length;

        // Get returns data for different time periods using returnModel
        const dailyReturns = await returnModel.countDocuments({
            requestedDate: { $gte: startOfDay.getTime() }
        });

        const weeklyReturns = await returnModel.countDocuments({
            requestedDate: { $gte: startOfWeek.getTime() }
        });

        const monthlyReturns = await returnModel.countDocuments({
            requestedDate: { $gte: startOfMonth.getTime() }
        });

        const yearlyReturns = await returnModel.countDocuments({
            requestedDate: { $gte: startOfYear.getTime() }
        });

        const cashOrders = await orderModel.countDocuments({ paymentMethod: 'Cash On Delivery' });
        const stripeOrders = await orderModel.countDocuments({ paymentMethod: 'Stripe' });
        const totalUsers = await userModel.countDocuments({});

        const stats = {
            revenue: {
                daily: dailyRevenue,
                weekly: weeklyRevenue,
                monthly: monthlyRevenue
            },
            orders: {
                daily: dailyOrderCount,
                weekly: weeklyOrderCount,
                monthly: monthlyOrderCount
            },
            returns: {
                daily: dailyReturns,
                weekly: weeklyReturns,
                monthly: monthlyReturns,
                yearly: yearlyReturns
            },
            payments: {
                cash: cashOrders,
                stripe: stripeOrders
            },
            users: {
                total: totalUsers
            }
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get sales trend data for charts
const getSalesTrends = async (req, res) => {
    try {
        const { period } = req.query; // daily, weekly, monthly
        const today = new Date();
        let startDate, groupBy;

        // Set time frame based on period
        if (period === 'daily') {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30); // Last 30 days
            groupBy = {
                $dateToString: {
                    format: "%Y-%m-%d",
                    date: {
                        $toDate: { $multiply: ["$date", 1] }
                    }
                }
            };
        } else if (period === 'weekly') {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 90); // Last 90 days
            groupBy = {
                $week: {
                    $toDate: { $multiply: ["$date", 1] }
                }
            };
        } else { // monthly
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1); // Last 12 months
            groupBy = {
                $dateToString: {
                    format: "%Y-%m",
                    date: {
                        $toDate: { $multiply: ["$date", 1] }
                    }
                }
            };
        }

        // Aggregate sales data
        const salesData = await orderModel.aggregate([
            { $match: { date: { $gte: startDate.getTime() } } },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: "$amount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, salesData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product performance data
const getProductPerformance = async (req, res) => {
    try {
        // Get all orders
        const orders = await orderModel.find({});

        // Extract items from all orders
        let allItems = [];
        orders.forEach(order => {
            if (Array.isArray(order.items)) {
                allItems = [...allItems, ...order.items];
            }
        });


        // Group by product and calculate sales
        const productSales = {};
        allItems.forEach(item => {
            const itemId = item.productId || item.id;

            // Skip invalid items
            if (!itemId || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
                return;
            }

            if (!productSales[itemId]) {
                productSales[itemId] = {
                    id: itemId,
                    name: item.name,
                    quantitySold: 0,
                    revenue: 0
                };
            }

            productSales[itemId].quantitySold += item.quantity;
            productSales[itemId].revenue += item.price * item.quantity;
        });

        // Convert to array and sort by quantity sold
        let productPerformance = Object.values(productSales).sort((a, b) => b.quantitySold - a.quantitySold);

        // If no product performance data exists, get real products from database
        if (productPerformance.length === 0) {


            const products = await productModel.find({})
                .select('productId name price bestseller')
                .sort({ bestseller: -1, price: -1 })
                .limit(10);

            productPerformance = products.map(product => ({
                id: product.productId,
                name: product.name,
                quantitySold: 0,
                revenue: 0,
                isBestseller: product.bestseller
            }));
        }

        res.json({ success: true, productPerformance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user activity data
const getUserActivity = async (req, res) => {
    try {
        const { period } = req.query; // daily, weekly, monthly
        const today = new Date();
        let startDate = new Date(today);
        let groupBy;

        // Set time frame based on period
        if (period === 'daily') {
            startDate.setDate(today.getDate() - 30); // Last 30 days
            groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        } else if (period === 'weekly') {
            startDate.setDate(today.getDate() - 90); // Last 90 days
            groupBy = { $week: "$createdAt" };
        } else { // monthly
            startDate.setFullYear(today.getFullYear() - 1); // Last 12 months
            groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        }

        // Placeholder user activity data
        const userActivity = [
            { date: '2024-01', registrations: 12 },
            { date: '2024-02', registrations: 18 },
            { date: '2024-03', registrations: 25 },
            { date: '2024-04', registrations: 22 }
        ];

        res.json({ success: true, userActivity });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get cart analytics
const getCartAnalytics = async (req, res) => {
    try {

        const usersWithCarts = await userModel.find({
            cartData: { $ne: {} }
        });

        const cartStats = {
            activeCartCount: usersWithCarts.length,
            averageItemsPerCart: 0,
            totalItemsInCarts: 0
        };

        // Calculate cart statistics
        let totalItems = 0;
        usersWithCarts.forEach(user => {
            const cart = user.cartData;
            Object.keys(cart).forEach(productId => {
                const sizeObj = cart[productId];
                Object.values(sizeObj).forEach(quantity => {
                    totalItems += quantity;
                });
            });
        });

        cartStats.totalItemsInCarts = totalItems;
        cartStats.averageItemsPerCart = usersWithCarts.length > 0
            ? totalItems / usersWithCarts.length
            : 0;

        res.json({ success: true, cartStats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get category distribution
const getCategoryDistribution = async (req, res) => {
    try {
        const products = await productModel.find()
            .populate('category', 'name')
            .select('category');

        // Group by category
        const categoryCounts = {};
        products.forEach(product => {
            if (product.category && product.category.name) {
                const categoryName = product.category.name;
                if (categoryCounts[categoryName]) {
                    categoryCounts[categoryName]++;
                } else {
                    categoryCounts[categoryName] = 1;
                }
            }
        });

        // Convert to array for easier chart consumption
        const categoryDistribution = Object.keys(categoryCounts).map(category => ({
            category,
            count: categoryCounts[category]
        }));

        res.json({ success: true, categoryDistribution });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Generate and download reports
const generateReport = async (req, res) => {
    try {
        const { type, format, startDate, endDate } = req.body;

        let reportData = [];
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        if (type === 'sales') {
            const orders = await orderModel.find({
                date: { $gte: start, $lte: end }
            }).sort({ date: 1 });

            reportData = orders.map(order => ({
                orderId: order._id,
                date: new Date(order.date).toISOString().split('T')[0],
                amount: order.amount,
                paymentMethod: order.paymentMethod,
                status: order.status,
                userId: order.userId
            }));
        } else if (type === 'products') {

            const products = await productModel.find({})
                .populate('category', 'name')
                .populate('subcategory', 'name');

            reportData = products.map(product => ({
                productId: product.productId,
                name: product.name,
                category: product.category?.name || 'Uncategorized',
                subcategory: product.subcategory?.name || 'None',
                price: product.price,
                bestseller: product.bestseller
            }));
        }

        res.json({
            success: true,
            reportData,
            message: `${type} report generated successfully.`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Get revenue prediction data
const getRevenuePrediction = async (req, res) => {
    try {
        // Initialize prediction service if not already done
        if (!predictionService.modelComponents) {
            predictionService.initialize();
        }

        // Look back further for better historical data - 36 months instead of 24
        const pastMonths = 36;
        const today = new Date();
        let startDate = new Date(today);
        startDate.setMonth(today.getMonth() - pastMonths);

        // Aggregate monthly sales data
        const salesData = await orderModel.aggregate([
            { $match: { date: { $gte: startDate.getTime() } } },
            {
                $group: {
                    _id: {
                        month: { $month: { $toDate: "$date" } },
                        year: { $year: { $toDate: "$date" } }
                    },
                    revenue: { $sum: "$amount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format historical data for frontend
        const historicalData = salesData.map(d => ({
            _id: `${d._id.year}-${d._id.month.toString().padStart(2, '0')}`,
            revenue: d.revenue,
            orders: d.orderCount
        }));

        // If  have no historical data, return empty predictions
        if (historicalData.length === 0) {
            return res.json({
                success: true,
                historicalData: [],
                predictions: [
                    {
                        month: getMonthName(today.getMonth() + 1),
                        year: today.getFullYear(),
                        revenue: 0,
                        confidence: 0
                    },
                    {
                        month: getMonthName(today.getMonth() + 2),
                        year: today.getFullYear(),
                        revenue: 0,
                        confidence: 0
                    },
                    {
                        month: getMonthName(today.getMonth() + 3),
                        year: today.getFullYear(),
                        revenue: 0,
                        confidence: 0
                    }
                ],
                growthRate: 0
            });
        }

        // Get predictions from the service
        const { predictions, growthRate } = await predictionService.getRevenuePredictions(historicalData);

        res.json({
            success: true,
            historicalData,
            predictions,
            growthRate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to get month name remains the same
function getMonthName(monthNum) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return months[(monthNum - 1) % 12];
}

// Helper function to calculate volatility (coefficient of variation)
function calculateVolatility(data) {
    if (!data || data.length < 2) return 0;

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;

    return mean > 0 ? Math.sqrt(variance) / mean : 0;
}

// Get detailed user activity data for reporting
const getUserActivityReport = async (req, res) => {
    try {
        const { period = 'monthly', startDate, endDate } = req.query;

        let dateFilter = {};

        // Apply date range filter if provided 
        if (startDate && endDate) {
            // Make sure to properly format the date range to include the entire day
            const endDateWithTime = new Date(endDate);
            endDateWithTime.setHours(23, 59, 59, 999);

            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: endDateWithTime
                }
            };
        }

        // For debugging, count total documents that match the filter
        const totalMatchingDocs = await userModel.countDocuments(dateFilter);

        // Rest of your aggregation logic...
        let groupBy;
        if (period === 'daily') {
            groupBy = {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            };
        } else if (period === 'weekly') {
            groupBy = {
                year: { $year: "$createdAt" },
                week: { $week: "$createdAt" }
            };
        } else { // monthly
            groupBy = {
                $dateToString: { format: "%Y-%m", date: "$createdAt" }
            };
        }

        const registrationData = await userModel.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Format data for response
        const formattedData = registrationData.map(item => {
            if (period === 'weekly') {
                return {
                    period: `${item._id.year}-W${item._id.week.toString().padStart(2, '0')}`,
                    registrations: item.count
                };
            }
            return {
                period: item._id,
                registrations: item.count
            };
        });

        res.json({
            success: true,
            userActivity: formattedData
        });
    } catch (error) {
        console.error('Error in getUserActivityReport:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserActivityLog = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Define date filters if provided
        const dateFilter = {};
        if (startDate && endDate) {
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999); // Include the entire end date
        }

        // Get all users first for reference
        const users = await userModel.find()
            .select('_id firstName lastName username email profileImage lastLogin createdAt');

        // Add a map of userId -> user details for faster lookups
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = {
                userId: user._id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
                email: user.email || '',
                profileImage: user.profileImage || '',
                lastLogin: user.lastLogin || user.createdAt
            };
        });

        // Get orders (for "Placed an order" activity)
        let orderQuery = {};
        if (startDate && endDate) {
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);

            orderQuery.date = {
                $gte: startDateTime.getTime(),
                $lte: endDateTime.getTime()
            };
        }

        const orders = await orderModel.find(orderQuery)
            .select('userId orderId date items amount')
            .sort({ date: -1 });

        // Get reviews (for "Added a review" activity)
        let reviewQuery = {};
        if (startDate && endDate) {
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);

            reviewQuery.createdAt = {
                $gte: startDateTime,
                $lte: endDateTime
            };
        }

        const reviews = await reviewModel.find(reviewQuery)
            .select('userId productId rating content createdAt _id')
            .sort({ createdAt: -1 });

        // Get returns (for "Placed a return request" activity)
        let returnQuery = {};
        if (startDate && endDate) {
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);

            returnQuery.requestedDate = {
                $gte: startDateTime.getTime(),
                $lte: endDateTime.getTime()
            };
        }

        const returns = await returnModel.find(returnQuery)
            .select('userId returnId requestedDate refundAmount')
            .sort({ requestedDate: -1 });

        // 1. Gather loyalty data for calculation
        // First, get order data per user
        const orderData = await orderModel.aggregate([
            {
                $group: {
                    _id: '$userId',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$amount' }
                }
            }
        ]);

        // Add order data map for faster lookups
        const orderDataMap = {};
        orderData.forEach(data => {
            if (data._id) {
                orderDataMap[data._id.toString()] = {
                    orderCount: data.orderCount || 0,
                    totalSpent: data.totalSpent || 0
                };
            }
        });

        // Get review data per user
        const reviewData = await reviewModel.aggregate([
            {
                $group: {
                    _id: '$userId',
                    reviewCount: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        // Add review data map for faster lookups
        const reviewDataMap = {};
        reviewData.forEach(data => {
            if (data._id) {
                reviewDataMap[data._id.toString()] = {
                    reviewCount: data.reviewCount || 0,
                    averageRating: data.averageRating || 0
                };
            }
        });

        // 2. Calculate loyalty scores using the same formula from userController
        const calculateLoyaltyScore = (userId) => {
            if (!userId) return 0;

            const userIdStr = userId.toString();
            const orderInfo = orderDataMap[userIdStr] || { orderCount: 0, totalSpent: 0 };
            const reviewInfo = reviewDataMap[userIdStr] || { reviewCount: 0, averageRating: 0 };

            // Use the exact same formula as in userController
            const score = (
                (0.5 * orderInfo.orderCount) +
                (0.3 * (orderInfo.totalSpent / 1000)) +
                (0.2 * (reviewInfo.reviewCount * (reviewInfo.averageRating || 0) / 5))
            ).toFixed(2);

            return parseFloat(score);
        };

        // 3. Initialize combined activity array and add activities
        let activities = [];

        // Process orders
        for (const order of orders) {
            const userId = order.userId ? order.userId.toString() : null;
            if (!userId) continue;

            const user = userMap[userId];

            if (user) {
                activities.push({
                    userId: userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                    lastLogin: user.lastLogin,
                    actionType: 'Placed an order',
                    orderId: order.orderId,
                    date: new Date(order.date),
                    loyaltyScore: calculateLoyaltyScore(userId)
                });
            }
        }

        // Process reviews
        for (const review of reviews) {
            const userId = review.userId ? review.userId.toString() : null;
            if (!userId) continue;

            const user = userMap[userId];

            if (user) {
                activities.push({
                    userId: userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                    lastLogin: user.lastLogin,
                    actionType: 'Added a review',
                    reviewId: review._id,
                    date: review.createdAt,
                    loyaltyScore: calculateLoyaltyScore(userId)
                });
            }
        }

        // Process returns
        for (const returnItem of returns) {
            const userId = returnItem.userId ? returnItem.userId.toString() : null;
            if (!userId) continue;

            const user = userMap[userId];

            if (user) {
                activities.push({
                    userId: userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                    lastLogin: user.lastLogin,
                    actionType: 'Placed a return request',
                    returnId: returnItem.returnId,
                    date: new Date(returnItem.requestedDate),
                    loyaltyScore: calculateLoyaltyScore(userId)
                });
            }
        }

        // Process login activity
        for (const userId in userMap) {
            const user = userMap[userId];
            if (user.lastLogin) {
                // Only add login activity if it falls within the date range
                const loginDate = new Date(user.lastLogin);

                let includeLogin = true;
                if (startDate && endDate) {
                    const startDateTime = new Date(startDate);
                    const endDateTime = new Date(endDate);
                    endDateTime.setHours(23, 59, 59, 999);

                    includeLogin = loginDate >= startDateTime && loginDate <= endDateTime;
                }

                if (includeLogin) {
                    activities.push({
                        userId: userId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.username,
                        email: user.email,
                        profileImage: user.profileImage,
                        lastLogin: user.lastLogin,
                        actionType: 'Logged in',
                        date: loginDate,
                        loyaltyScore: calculateLoyaltyScore(userId)
                    });
                }
            }
        }

        // Sort activities by date (newest first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Limit to a reasonable number to avoid overwhelming the frontend
        activities = activities.slice(0, 500);

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Error fetching user activity log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user activity log',
            error: error.message
        });
    }
};

const exportHistoricalDataToCsv = async (req, res) => {
    try {
        // Look back up to 36 months
        const pastMonths = 36;
        const today = new Date();
        let startDate = new Date(today);
        startDate.setMonth(today.getMonth() - pastMonths);

        // Aggregate monthly sales data
        const historicalData = await orderModel.aggregate([
            { $match: { date: { $gte: startDate.getTime() } } },
            {
                $group: {
                    _id: {
                        year: { $year: { $toDate: "$date" } },
                        month: { $month: { $toDate: "$date" } }
                    },
                    revenue: { $sum: "$amount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format for CSV
        const csvHeader = "year,month,revenue,orders\n";
        const csvRows = historicalData.map(item => {
            return `${item._id.year},${item._id.month},${item.revenue},${item.orders}`;
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        // Save to file system
        const filePath = path.join(__dirname, '../models/ml/historical_data.csv');
        fs.writeFileSync(filePath, csvContent);

        // Return both the file path and the data
        res.json({
            success: true,
            message: 'Historical data exported to CSV successfully',
            filePath: filePath,
            data: historicalData
        });
    } catch (error) {
        console.error('Error exporting historical data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export {
    getDashboardStats,
    getSalesTrends,
    getProductPerformance,
    getUserActivity,
    getCartAnalytics,
    getCategoryDistribution,
    generateReport,
    getRevenuePrediction,
    exportHistoricalDataToCsv,
    getUserActivityReport,
    getUserActivityLog
};