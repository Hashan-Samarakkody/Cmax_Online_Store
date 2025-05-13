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

        // Broadcast new product
        broadcast({ type: 'newProduct', product: product });
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


        // Process existing images - IMPROVED HANDLING
        let existingImages = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('existingImages[')) {
                const index = key.match(/\[(\d+)\]/)[1];
                existingImages[parseInt(index)] = req.body[key];
            }
        });

        // Filter out any undefined elements
        existingImages = existingImages.filter(img => img !== undefined);

        // If no existing images were found in the form data but the product has images,
        // use the existing product's images to prevent data loss
        if (existingImages.length === 0 && existingProduct.images && existingProduct.images.length > 0) {
            existingImages = [...existingProduct.images];
        }

        // Process new images
        const newImageFiles = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (file.fieldname.startsWith('newImages[')) {
                    newImageFiles.push(file);
                }
            });
        }

        // Upload new images to cloudinary if any
        let newImagesUrls = [];
        if (newImageFiles.length > 0) {
            newImagesUrls = await Promise.all(
                newImageFiles.map(async (file) => {
                    try {
                        const result = await cloudinary.uploader.upload(file.path, {
                            resource_type: 'image'
                        });
                        return result.secure_url;
                    } catch (error) {
                        console.error('Cloudinary upload error:', error);
                        throw new Error('Failed to upload image to cloud storage');
                    }
                })
            );
        }

        // Combine existing and new images
        const updatedImages = [...existingImages, ...newImagesUrls];

        // NEW VALIDATION: Ensure there's at least one image before updating
        if (updatedImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one product image is required. Please add an image before updating.'
            });
        }

        // Process images to delete if any
        let imagesToDelete = [];
        if (req.body.imagesToDelete) {
            try {
                imagesToDelete = JSON.parse(req.body.imagesToDelete);
                console.log('Images marked for deletion:', imagesToDelete.length);
            } catch (e) {
                console.error('Error parsing imagesToDelete:', e);
            }
        }

        // Prepare update data
        const updateData = {
            name,
            description,
            category,
            price: Number(price),
            subcategory,
            bestseller: bestseller === 'true' ? true : false,
            sizes: hasSizes === 'true' && sizes ? JSON.parse(sizes) : [],
            colors: hasColors === 'true' && colors ? JSON.parse(colors) : [],
            images: updatedImages,
            hasSizes: hasSizes === 'true',
            hasColors: hasColors === 'true',
        };

        // Update the product
        const updatedProductDoc = await productModel.findOneAndUpdate(
            { productId },
            updateData,
            { new: true }
        );

        // Get the updated product data with populated fields for WebSocket broadcast
        const updatedProduct = await productModel.findOne({ productId })
            .populate('category', 'name')
            .populate('subcategory', 'name');

        // Send response to client
        res.json({
            success: true,
            message: 'Product updated successfully!',
            images: updatedProductDoc.images // Send back the updated images array for confirmation
        });

        // Broadcast fully populated product update (after response is sent)
        broadcast({
            type: 'updateProduct',
            product: updatedProduct
        });

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
