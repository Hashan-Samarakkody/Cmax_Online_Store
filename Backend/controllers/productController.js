import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';

// Add product function
const addProduct = async (req, res) => {

    try {

        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let resullt = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return resullt.secure_url;
            }
            ))

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === 'true' ? true : false,
            sizes: JSON.parse(sizes),
            images: imagesUrl,
            date: Date.now()
        }

        console.log(productData)

        const product = new productModel(productData);
        await product.save();

        res.json({success: true, message: 'Product added successfully!'});

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Total product list function
const listProduct = async (req, res) => {
}

// Remove product function
const removeProduct = async (req, res) => {
}

// Get single product details function
const singleProduct = async (req, res) => {
}

export { addProduct, listProduct, removeProduct, singleProduct };