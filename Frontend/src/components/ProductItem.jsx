import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../../../admin/src/App';

const ProductItem = ({ id, image, name, price }) => {
    const { currency, products } = useContext(ShopContext);
    const [rating, setRating] = useState(0);
    const [productImage, setProductImage] = useState(
        image && image.length > 0 ? image[0] : assets.default_img
    );

    // Update the image if it changes in props
    useEffect(() => {
        if (image && image.length > 0 && image[0] !== productImage) {
            setProductImage(image[0]);
        }
    }, [image]);

    // Also check product from context to ensure we have latest images
    useEffect(() => {
        const currentProduct = products.find(p => p._id === id);
        if (currentProduct && currentProduct.images && currentProduct.images.length > 0) {
            if (currentProduct.images[0] !== productImage) {
                setProductImage(currentProduct.images[0]);
            }
        }
    }, [products, id]);

    useEffect(() => {
        // Fetch product reviews to get average rating
        const fetchRating = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/reviews/product/${id}`);
                if (response.data.success) {
                    setRating(response.data.averageRating);
                }
            } catch (error) {
                console.error('Error fetching product rating:', error);
            }
        };

        fetchRating();
    }, [id]);

    // Generate star display based on rating
    const renderStars = (rating) => {
        const roundedRating = Math.round(rating * 2) / 2;
        const stars = [];

        // Create 5 stars
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <img
                    key={i}
                    src={i <= roundedRating ? assets.star_icon : assets.star_dull_icon}
                    alt={`${i <= roundedRating ? "filled" : "empty"} star`}
                    className="w-5 h-5" // Made stars slightly bigger
                />
            );
        }

        return (
            <div className="flex items-center">
                {stars}
                <span className="text-sm ml-1">({roundedRating.toFixed(1)})</span>
            </div>
        );
    };

    return (
        <Link className='text-gray-800 rounded-xl shadow-xs shadow-black hover:shadow-md transition-shadow duration-300' to={`/product/${id}`}>
            <div className='overflow-hidden rounded-lg'>
                <img className='h-fit hover:scale-115 transition ease-in-out' src={productImage} alt={name} />
            </div>
            <p className='pt-2 pb-1 text-lg text-wrap px-2 font-semibold'>{name}</p>
            <div className='flex justify-between items-center px-2 pb-2'>
                <p className='text-md'>{currency}{price}</p>
                {renderStars(rating)}
            </div>
        </Link>
    );
};

export default ProductItem;