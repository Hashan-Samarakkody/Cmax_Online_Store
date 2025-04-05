import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import Subcategory from '../models/subcategoryModel.js';
import { broadcast } from '../server.js';

// Add product function
const addProduct = async (req, res) => {
    try {
        const {
            productId,
            name,
            description,
            price,
            category,
            subcategory,
            sizes,
            colors,
            bestseller,
            hasSizes,
            hasColors
        } = req.body;

        // Check if Product ID already exists
        const existingProduct = await productModel.findOne({ productId });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product ID already exists. Please use a unique Product ID.'
            });
        }

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        );

        const subcategoryExists = await Subcategory.findById(subcategory);
        if (!subcategoryExists) {
            return res.status(400).json({ success: false, message: 'Invalid subcategory ID' });
        }

        const productData = {
            productId,
            name,
            description,
            category,
            price: Number(price),
            subcategory,
            bestseller: bestseller === 'true'
                ? true : false,
            sizes: hasSizes && sizes ?
                JSON.parse(sizes) : [],
            colors: hasColors && colors ?
                JSON.parse(colors) : [],
            images: imagesUrl,
            hasSizes: hasSizes === 'true',
            hasColors: hasColors === 'true',
        };
        const product = new productModel(productData);
        await product.save();

        res.json({ success: true, message: 'Product added successfully!' });

        // Broadcast new product
        broadcast({ type: 'newProduct', product: product });  // Send the new product via WebSocket

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all products function
const getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find({})
            .populate('category', 'name')
            .populate('subcategory', 'name');

        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Total product list function
const listProduct = async (req, res) => {
    try {
        const products = await productModel.find({})
            .populate('category', 'name')
            .populate('subcategory', 'name');

        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove product function
const removeProduct = async (req, res) => {
    try {
        const deletedProduct = await productModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: 'Product deleted successfully!' });

        // Broadcast product deletion
        broadcast({ type: 'deleteProduct', productId: req.body.id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get single product details function
const displaySingleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        res.json({ success: true, product });

        // Broadcast the latest product data to all connected clients
        broadcast({ type: 'updateProduct', product: product });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const getSingleProductDetails = async (req, res) => {
    try {
        const { productId } = req.params; // if using URL params
        const product = await productModel.findOne({ productId }).populate('category', 'name').populate('subcategory', 'name');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const updateProduct = async (req, res) => {
    try {
        const {
            productId,
            name,
            description,
            price,
            category,
            subcategory,
            sizes,
            colors,
            bestseller,
            hasSizes,
            hasColors
        } = req.body;

        // Find the existing product
        const existingProduct = await productModel.findOne({ productId });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        // Validate subcategory
        const subcategoryExists = await Subcategory.findById(subcategory);
        if (!subcategoryExists) {
            return res.status(400).json({ success: false, message: 'Invalid subcategory ID' });
        }

        // Handle image uploads
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const newUploadedImages = [image1, image2, image3, image4].filter((item) => item !== undefined);

        // Upload new images to cloudinary if any
        let newImagesUrl = [];
        if (newUploadedImages.length > 0) {
            newImagesUrl = await Promise.all(
                newUploadedImages.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url;
                })
            );
        }

        // Merge existing and new images, keeping existing if no new images uploaded
        const updatedImages = newImagesUrl.length > 0
            ? newImagesUrl
            : existingProduct.images;

        // Prepare update data
        const updateData = {
            name,
            description,
            category,
            price: Number(price),
            subcategory,
            bestseller: bestseller === 'true' ? true : false,
            sizes: hasSizes && sizes ? JSON.parse(sizes) : [],
            colors: hasColors && colors ? JSON.parse(colors) : [],
            images: updatedImages,
            hasSizes: hasSizes === 'true',
            hasColors: hasColors === 'true',
        };

        // Update the product
        await productModel.findOneAndUpdate(
            { productId },
            updateData,
            { new: true }
        );

        res.json({ success: true, message: 'Product updated successfully!' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    addProduct,
    listProduct,
    removeProduct,
    displaySingleProduct,
    getAllProducts,
    updateProduct,
    getSingleProductDetails
};
