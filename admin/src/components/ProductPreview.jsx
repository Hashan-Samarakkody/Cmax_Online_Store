import React, { useState } from 'react';
import { assets } from '../assets/assets';
import ProductDetailsModal from './ProductDetailsModal';

const ProductPreview = ({
    name,
    price,
    images,
    description,
    hasSizes,
    hasColors,
    sizes,
    colors,
    bestseller,
    quantity,
    category,
    subcategory
}) => {
    const [showModal, setShowModal] = useState(false);

    // Get the main image (first image or default)
    const mainImage = images && images.length > 0
        ? (images[0] instanceof File ? URL.createObjectURL(images[0]) : images[0])
        : assets.upload_area;

    // Mock rating for preview (same as ProductItem default)
    const mockRating = 4.5;

    // Check if we have enough data to show preview
    const hasEnoughData = name && price && (images && images.length > 0);

    const handlePreviewClick = () => {
        if (hasEnoughData) {
            setShowModal(true);
        }
    };

    if (!hasEnoughData) {
        return (
            <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <img src={assets.upload_area} alt="No preview" className="w-16 h-16 opacity-50 mb-4" />
                    <p className="text-sm text-center">
                        Fill in product details to see preview
                    </p>
                </div>
            </div>
        );
    }

    // Generate star display based on rating (exactly like ProductItem)
    const renderStars = (rating) => {
        const roundedRating = Math.round(rating * 2) / 2;
        const stars = [];

        for (let i = 1; i <= 5; i++) {
            stars.push(
                <img
                    key={i}
                    src={i <= roundedRating ? assets.star_icon : assets.star_dull_icon}
                    alt={`${i <= roundedRating ? "filled" : "empty"} star`}
                    className="w-2.5 h-2.5 sm:w-4 sm:h-3 md:w-3 md:h-3"
                />
            );
        }

        return (
            <div className="flex items-center flex-wrap">
                <div className="flex">
                    {stars}
                </div>
                <span className="text-xs sm:text-sm ml-1">({roundedRating.toFixed(1)})</span>
            </div>
        );
    };

    return (
        <>
            <div className="w-full max-w-sm mx-auto">
                {/* Product card with exact styling from ProductItem */}
                <div
                    className='text-gray-800 rounded-xl shadow-xs shadow-black hover:shadow-md transition-shadow duration-300 cursor-pointer'
                    onClick={handlePreviewClick}
                >
                    <div className='overflow-hidden rounded-lg relative'>
                        <img
                            className='h-fit hover:scale-115 transition ease-in-out w-full object-cover'
                            src={mainImage}
                            alt={name || 'Product preview'}
                        />

                        {/* Bestseller badge */}
                        {bestseller && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                Bestseller
                            </div>
                        )}

                        {/* Out of stock badge */}
                        {quantity <= 0 && (
                            <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                Out of Stock
                            </div>
                        )}
                    </div>

                    <p className='pt-2 pb-1 text-base sm:text-lg text-wrap px-2 font-semibold'>{name}</p>

                    <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center px-2 pb-2 gap-1'>
                        <p className='text-sm sm:text-md font-medium'>Rs.{price}</p>
                        {renderStars(mockRating)}
                    </div>

                    {/* Additional preview info (only shown in preview, not in actual ProductItem) */}
                    <div className="px-2 pb-2">
                        <div className="flex flex-wrap gap-1 mb-2">
                            {hasSizes && sizes && sizes.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {sizes.length} size{sizes.length > 1 ? 's' : ''}
                                </span>
                            )}
                            {hasColors && colors && colors.length > 0 && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {colors.length} color{colors.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Stock Status */}
                        {quantity > 0 ? (
                            <p className="text-xs text-green-600">
                                In stock: {quantity} {quantity === 1 ? 'item' : 'items'}
                            </p>
                        ) : (
                            <p className="text-xs text-red-600 font-medium">Out of stock</p>
                        )}
                    </div>
                </div>

                {/* Preview Label */}
                <div className="text-center mt-3">
                    <p className="text-sm text-gray-400 font-medium">
                        <i>Click to see full details</i>
                    </p>
                </div>
            </div>

            {/* Product Details Modal */}
            <ProductDetailsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                name={name}
                price={price}
                images={images}
                description={description}
                hasSizes={hasSizes}
                hasColors={hasColors}
                sizes={sizes}
                colors={colors}
                bestseller={bestseller}
                quantity={quantity}
                category={category}
                subcategory={subcategory}
            />
        </>
    );
};

export default ProductPreview;