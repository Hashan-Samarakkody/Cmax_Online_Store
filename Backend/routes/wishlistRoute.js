import express from 'express';
import { addToWishlist, removeFromWishlist, getWishlist } from '../controllers/wishlistController.js';
import { wishlistAuth } from '../middleware/userAuth.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/add', wishlistAuth, addToWishlist);
wishlistRouter.post('/remove', wishlistAuth, removeFromWishlist);
wishlistRouter.post('/get', wishlistAuth, getWishlist);

export default wishlistRouter;