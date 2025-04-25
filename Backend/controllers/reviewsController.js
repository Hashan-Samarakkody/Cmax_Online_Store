import reviewModel from '../models/reviewModel.js';
import { broadcast } from '../server.js';

// Get all reviews for a product
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await reviewModel.find({ productId })
            .populate('userId', 'name username profileImage')
            .populate('replies.userId', 'name username profileImage')
            .sort({ createdAt: -1 });

        const reviewCount = await reviewModel.countDocuments({ productId });

        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        res.json({
            success: true,
            reviews,
            count: reviewCount,
            averageRating
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add a new review
const addReview = async (req, res) => {
    try {
        const { productId, rating, content } = req.body;
        const userId = req.user.id;

        // Check if user has already reviewed this product
        const existingReview = await reviewModel.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        const newReview = new reviewModel({
            userId,
            productId,
            rating,
            content
        });

        await newReview.save();

        // Populate user data before sending response
        const populatedReview = await reviewModel.findById(newReview._id)
            .populate('userId', 'name username profileImage');

        // Broadcast new review
        broadcast({
            type: 'newReview',
            review: populatedReview,
            productId
        });

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            review: populatedReview
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a review
const updateReview = async (req, res) => {
    try {
        const { reviewId, rating, content } = req.body;
        const userId = req.user.id;

        // Find the review
        const review = await reviewModel.findById(reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Check if user owns the review - convert both to strings for comparison
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own reviews'
            });
        }

        // Update review
        review.rating = rating || review.rating;
        review.content = content || review.content;
        review.updatedAt = Date.now();

        await review.save();

        // Get updated review with populated fields
        const updatedReview = await reviewModel.findById(reviewId)
            .populate('userId', 'name username profileImage')
            .populate('replies.userId', 'name username profileImage');

        // Broadcast review update
        broadcast({
            type: 'updateReview',
            review: updatedReview,
            productId: review.productId
        });

        res.json({
            success: true,
            message: 'Review updated successfully',
            review: updatedReview
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        // Find the review
        const review = await reviewModel.findById(reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Check if user owns the review - convert both to strings for comparison
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        const productId = review.productId;

        // Delete the review
        await reviewModel.findByIdAndDelete(reviewId);

        // Broadcast review deletion
        broadcast({
            type: 'deleteReview',
            reviewId,
            productId
        });

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add a reply to a review
const addReply = async (req, res) => {
    try {
        const { reviewId, content } = req.body;
        const userId = req.user.id;

        // Find the review
        const review = await reviewModel.findById(reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Add the reply
        const newReply = {
            userId,
            content,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        review.replies.push(newReply);
        await review.save();

        // Get updated review with populated fields
        const updatedReview = await reviewModel.findById(reviewId)
            .populate('userId', 'name username profileImage')
            .populate('replies.userId', 'name username profileImage');

        // Broadcast new reply
        broadcast({
            type: 'newReply',
            review: updatedReview,
            productId: review.productId
        });

        res.json({
            success: true,
            message: 'Reply added successfully',
            review: updatedReview
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a reply
const deleteReply = async (req, res) => {
    try {
        const { reviewId, replyId } = req.params;
        const userId = req.user.id;

        // Find the review
        const review = await reviewModel.findById(reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Find the reply
        const reply = review.replies.id(replyId);

        if (!reply) {
            return res.status(404).json({ success: false, message: 'Reply not found' });
        }

        // Check if user owns the reply
        if (reply.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own replies'
            });
        }

        // Remove the reply
        review.replies.pull(replyId);
        await review.save();

        // Get updated review with populated fields
        const updatedReview = await reviewModel.findById(reviewId)
            .populate('userId', 'name username profileImage')
            .populate('replies.userId', 'name username profileImage');

        // Broadcast reply deletion
        broadcast({
            type: 'deleteReply',
            review: updatedReview,
            productId: review.productId
        });

        res.json({
            success: true,
            message: 'Reply deleted successfully',
            review: updatedReview
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    getProductReviews,
    addReview,
    updateReview,
    deleteReview,
    addReply,
    deleteReply
};