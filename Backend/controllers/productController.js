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

// Toggle product visibility function
const toggleProductVisibility = async (req, res) => {
    try {
        const { productId, isVisible } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        product.isVisible = isVisible;
        await product.save();

        // Get updated product data with populated fields for WebSocket broadcast
        const updatedProduct = await productModel.findById(productId)
            .populate('category', 'name')
            .populate('subcategory', 'name');

        res.json({
            success: true,
            message: `Product ${isVisible ? 'visible' : 'hidden'} successfully`,
            product: updatedProduct
        });

        // Broadcast product visibility change
        broadcast({
            type: 'productVisibilityChanged',
            productId,
            isVisible,
            product: updatedProduct
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all products function
const getAllProducts = async (req, res) => {
    try {
        // Join with categories and subcategories to get visibility information
        const products = await productModel.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryData"
                }
            },
            {
                $unwind: "$categoryData"
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subcategory",
                    foreignField: "_id",
                    as: "subcategoryData"
                }
            },
            {
                $unwind: "$subcategoryData"
            },
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                {
                                    "isVisible": true,
                                    "categoryData.isVisible": true,
                                    "subcategoryData.isVisible": true
                                }
                            ]
                        }
                    ]
                }
            },
            {
                $project: {
                    "_id": 1,
                    "productId": 1,
                    "name": 1,
                    "description": 1,
                    "price": 1,
                    "bestseller": 1,
                    "sizes": 1,
                    "colors": 1,
                    "images": 1,
                    "hasSizes": 1,
                    "hasColors": 1,
                    "isVisible": 1,
                    "category": {
                        "_id": "$categoryData._id",
                        "name": "$categoryData.name",
                        "isVisible": "$categoryData.isVisible"
                    },
                    "subcategory": {
                        "_id": "$subcategoryData._id",
                        "name": "$subcategoryData.name",
                        "isVisible": "$subcategoryData.isVisible"
                    },
                    "effectiveVisibility": {
                        $and: [
                            "$isVisible",
                            "$categoryData.isVisible",
                            "$subcategoryData.isVisible"
                        ]
                    }
                }
            }
        ]);

        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Total product list function
const listProduct = async (req, res) => {
    try {
        const products = await productModel.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryData"
                }
            },
            {
                $unwind: "$categoryData"
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subcategory",
                    foreignField: "_id",
                    as: "subcategoryData"
                }
            },
            {
                $unwind: "$subcategoryData"
            },
            {
                $project: {
                    "_id": 1,
                    "productId": 1,
                    "name": 1,
                    "description": 1,
                    "price": 1,
                    "bestseller": 1,
                    "sizes": 1,
                    "colors": 1,
                    "images": 1,
                    "hasSizes": 1,
                    "hasColors": 1,
                    "isVisible": 1,
                    "category": {
                        "_id": "$categoryData._id",
                        "name": "$categoryData.name",
                        "isVisible": "$categoryData.isVisible"
                    },
                    "subcategory": {
                        "_id": "$subcategoryData._id",
                        "name": "$subcategoryData.name",
                        "isVisible": "$subcategoryData.isVisible"
                    }
                }
            }
        ]);

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

        // Validate subcategory if provided
        if (subcategory) {
            const subcategoryExists = await Subcategory.findById(subcategory);
            if (!subcategoryExists) {
                return res.status(400).json({ success: false, message: 'Invalid subcategory ID' });
            }
        }

        // Process existing images with improved handling
        let existingImages = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('existingImages[')) {
                const index = key.match(/\[(\d+)\]/)[1];
                existingImages[parseInt(index)] = req.body[key];
            }
        });

        // Filter out any undefined elements
        existingImages = existingImages.filter(img => img !== undefined);

        // Process images to delete if any
        if (req.body.imagesToDelete) {
            try {
                const imagesToDelete = JSON.parse(req.body.imagesToDelete);

                // Delete each image from Cloudinary
                for (const imageUrl of imagesToDelete) {
                    // Extract the public_id from the Cloudinary URL
                    const publicIdMatch = imageUrl.match(/\/v\d+\/([^/]+)\.\w+$/);
                    const publicId = publicIdMatch ? publicIdMatch[1] : null;

                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log(`Deleted image: ${publicId}`);
                    }
                }

                // Also remove these images from existingImages array if they're still there
                existingImages = existingImages.filter(img => !imagesToDelete.includes(img));
            } catch (e) {
                console.error('Error deleting images from storage:', e);
            }
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

        // Only validate images if they're being modified
        if (req.body.imagesToDelete || newImageFiles.length > 0) {
            // Ensure there's at least one image before updating
            if (updatedImages.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one product image is required. Please add an image before updating.'
                });
            }
        }

        // Prepare update data - only include fields that were provided
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (price !== undefined) updateData.price = Number(price);
        if (subcategory !== undefined) updateData.subcategory = subcategory;
        if (bestseller !== undefined) updateData.bestseller = bestseller === 'true' ? true : false;

        // Only update sizes if hasSizes was provided
        if (hasSizes !== undefined) {
            updateData.hasSizes = hasSizes === 'true';
            if (updateData.hasSizes && sizes) {
                updateData.sizes = JSON.parse(sizes);
            } else if (!updateData.hasSizes) {
                updateData.sizes = [];
            }
        }

        // Only update colors if hasColors was provided
        if (hasColors !== undefined) {
            updateData.hasColors = hasColors === 'true';
            if (updateData.hasColors && colors) {
                updateData.colors = JSON.parse(colors);
            } else if (!updateData.hasColors) {
                updateData.colors = [];
            }
        }

        // Only update images if they were modified
        if (updatedImages.length > 0 || req.body.imagesToDelete) {
            updateData.images = updatedImages;
        }

        // Update the product with only the changed fields
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
            product: updatedProductDoc
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
    getSingleProductDetails,
    toggleProductVisibility
};
