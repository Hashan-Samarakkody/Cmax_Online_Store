import express from 'express';
import {userAuth} from '../middleware/userAuth.js';
import {
    getProductReviews,
    addReview,
    updateReview,
    deleteReview,
    addReply,
    deleteReply
} from '../controllers/reviewsController.js';

const reviewRouter = express.Router();

// Public routes
reviewRouter.get('/product/:productId', getProductReviews);

// Protected routes
reviewRouter.post('/', userAuth, addReview);
reviewRouter.put('/', userAuth, updateReview);
reviewRouter.delete('/:reviewId', userAuth, deleteReview);

// Reply routes
reviewRouter.post('/reply', userAuth, addReply);
reviewRouter.delete('/reply/:reviewId/:replyId', userAuth, deleteReply);

export default reviewRouter;