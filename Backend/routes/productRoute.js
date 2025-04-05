import express from 'express';
import { addProduct, listProduct, removeProduct, displaySingleProduct, getAllProducts, updateProduct, getSingleProductDetails } from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }]), addProduct);
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.post('/single', displaySingleProduct);
productRouter.get('/single/get/:productId', getSingleProductDetails);
productRouter.get('/list', listProduct);
productRouter.get('/', getAllProducts);
productRouter.put('/update', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }]), updateProduct);


export default productRouter;