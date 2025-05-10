import express from 'express';
import {
    recordInteraction,
    getRecommendations,
    getTrendingProducts,
    getSimilarProducts,
    getCustomersAlsoBought
} from '../controllers/recommendationController.js';
import { userAuth } from '../middleware/userAuth.js';

const recommendationRouter = express.Router();

// Protected routes (require authentication)
recommendationRouter.post('/interactions', userAuth, recordInteraction);
recommendationRouter.get('/recommendations', userAuth, getRecommendations);

// Public routes
recommendationRouter.get('/trending', getTrendingProducts);
recommendationRouter.get('/similar/:productId', getSimilarProducts);
recommendationRouter.get('/also-bought/:productId', getCustomersAlsoBought);

export default recommendationRouter;