import userProductInteractionModel from '../models/recommendationModel.js';
import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';

// Record user interactions with products
const recordInteraction = async (req, res) => {
    try {
        const { interactionType, productId } = req.body;
        const userId = req.user.id;

        // Weight based on interaction type
        const weights = {
            view: 1,
            wishlist: 3,
            cart: 5,
            purchase: 10
        };

        // Create or update the interaction
        const interaction = await userProductInteractionModel.findOneAndUpdate(
            { userId, productId, interactionType },
            {
                userId,
                productId,
                interactionType,
                weight: weights[interactionType],
                createdAt: Date.now()
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'Interaction recorded successfully',
            interaction
        });

    } catch (error) {
        console.error('Error recording interaction:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get personalized recommendations for a user
const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;

        // 1. Find products that the user has interacted with
        const userInteractions = await userProductInteractionModel.find({ userId })
            .sort({ weight: -1, createdAt: -1 });

        // If no interactions, return trending products
        if (!userInteractions || userInteractions.length === 0) {
            return getTrendingProducts(req, res);
        }

        // Extract product IDs the user has interacted with
        const userProductIds = userInteractions.map(interaction => interaction.productId);

        // 2. Get product details for the interacted products to find categories and features
        const interactedProducts = await productModel.find({ _id: { $in: userProductIds } })
            .populate('category', 'name')
            .populate('subcategory', 'name');

        // 3. Identify the most frequent categories and subcategories
        const categoryCounter = {};
        const subcategoryCounter = {};

        interactedProducts.forEach(product => {
            if (product.category) {
                const categoryId = product.category._id.toString();
                categoryCounter[categoryId] = (categoryCounter[categoryId] || 0) + 1;
            }

            if (product.subcategory) {
                const subcategoryId = product.subcategory._id.toString();
                subcategoryCounter[subcategoryId] = (subcategoryCounter[subcategoryId] || 0) + 1;
            }
        });

        // Convert to arrays and sort by frequency
        const sortedCategories = Object.entries(categoryCounter)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        const sortedSubcategories = Object.entries(subcategoryCounter)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        // 4. Find similar products based on categories and subcategories
        // but not including products the user has already interacted with
        const similarProducts = await productModel.find({
            _id: { $nin: userProductIds },
            $or: [
                { category: { $in: sortedCategories.slice(0, 3) } },
                { subcategory: { $in: sortedSubcategories.slice(0, 5) } }
            ]
        })
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .limit(parseInt(limit));

        // 5. If we don't have enough recommendations, add some bestsellers
        let recommendations = similarProducts;

        if (recommendations.length < limit) {
            const remainingCount = limit - recommendations.length;
            const bestsellers = await productModel.find({
                _id: { $nin: [...userProductIds, ...recommendations.map(p => p._id)] },
                bestseller: true
            })
                .limit(remainingCount);

            recommendations = [...recommendations, ...bestsellers];
        }

        // 6. Return the recommendations
        res.json({
            success: true,
            recommendations: recommendations
        });

    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get trending products (fallback for new users)
const getTrendingProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get products with highest interaction counts
        const productInteractions = await userProductInteractionModel.aggregate([
            {
                $group: {
                    _id: '$productId',
                    interactionCount: { $sum: '$weight' }
                }
            },
            { $sort: { interactionCount: -1 } },
            { $limit: parseInt(limit) }
        ]);

        // If no interactions in the database yet, return bestsellers
        if (!productInteractions || productInteractions.length === 0) {
            const bestsellers = await productModel.find({ bestseller: true })
                .populate('category', 'name')
                .populate('subcategory', 'name')
                .limit(parseInt(limit));

            return res.json({
                success: true,
                recommendations: bestsellers,
                source: 'bestsellers'
            });
        }

        // Get the actual product documents
        const productIds = productInteractions.map(item => item._id);
        const trendingProducts = await productModel.find({ _id: { $in: productIds } })
            .populate('category', 'name')
            .populate('subcategory', 'name');

        // Sort them in the same order as the aggregation result
        const orderedProducts = productIds.map(id =>
            trendingProducts.find(product => product._id.toString() === id.toString())
        ).filter(Boolean);

        res.json({
            success: true,
            recommendations: orderedProducts,
            source: 'trending'
        });

    } catch (error) {
        console.error('Error getting trending products:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get similar products to a specific product
const getSimilarProducts = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 10 } = req.query;

        // Get the product details
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find products in the same category and subcategory
        const similarProducts = await productModel.find({
            _id: { $ne: productId },
            $or: [
                { category: product.category },
                { subcategory: product.subcategory }
            ]
        })
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .limit(parseInt(limit));

        // If not enough products, add some bestsellers
        let recommendations = similarProducts;

        if (recommendations.length < limit) {
            const remainingCount = limit - recommendations.length;
            const bestsellers = await productModel.find({
                _id: { $ne: productId, $nin: recommendations.map(p => p._id) },
                bestseller: true
            })
                .limit(remainingCount);

            recommendations = [...recommendations, ...bestsellers];
        }

        res.json({
            success: true,
            recommendations: recommendations
        });

    } catch (error) {
        console.error('Error getting similar products:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get "Customers who bought this also bought" recommendations
const getCustomersAlsoBought = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 6 } = req.query;

        // Find users who purchased this product
        const purchasers = await userProductInteractionModel.find({
            productId,
            interactionType: 'purchase'
        }).distinct('userId');

        // No purchasers yet, return similar products instead
        if (!purchasers || purchasers.length === 0) {
            return getSimilarProducts(req, res);
        }

        // Find other products these users purchased
        const otherPurchases = await userProductInteractionModel.find({
            userId: { $in: purchasers },
            productId: { $ne: productId },
            interactionType: 'purchase'
        }).distinct('productId');

        // Get the product details
        const relatedProducts = await productModel.find({
            _id: { $in: otherPurchases }
        })
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .limit(parseInt(limit));

        res.json({
            success: true,
            recommendations: relatedProducts
        });

    } catch (error) {
        console.error('Error getting "customers also bought" recommendations:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export {
    recordInteraction,
    getRecommendations,
    getTrendingProducts,
    getSimilarProducts,
    getCustomersAlsoBought
};