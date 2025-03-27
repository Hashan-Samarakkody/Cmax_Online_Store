import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import Subcategory from '../models/subcategoryModel.js';

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
            bestseller: bestseller === 'true' ? true : false,
            sizes: hasSizes && sizes ? JSON.parse(sizes) : [],
            colors: hasColors && colors ? JSON.parse(colors) : [],
            images: imagesUrl,
            hasSizes: hasSizes === 'true',
            hasColors: hasColors === 'true',
        };

        const product = new productModel(productData);
        await product.save();

        res.json({ success: true, message: 'Product added successfully!' });
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
        await productModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: 'Product deleted successfully!' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single product details function
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    addProduct,
    listProduct,
    removeProduct,
    singleProduct,
    getAllProducts
};
