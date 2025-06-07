import React, { useState } from 'react';
import { assets } from '../assets/assets';

const ProductDetailsModal = ({
    isOpen,
    onClose,
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
    const [selectedImage, setSelectedImage] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [activeTab, setActiveTab] = useState('description');

    // Set the first image as default when modal opens
    React.useEffect(() => {
        if (images && images.length > 0) {
            const firstImage = images[0] instanceof File
                ? URL.createObjectURL(images[0])
                : images[0];
            setSelectedImage(firstImage);
        }
    }, [images, isOpen]);

    if (!isOpen) return null;

    // Check if we have enough data to show the modal
    const hasEnoughData = name && price && images && images.length > 0;

    if (!hasEnoughData) {
        return (
            <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                    <div className="p-6 text-center">
                        <h3 className="text-lg font-semibold mb-4">Preview Not Available</h3>
                        <p className="text-gray-600 mb-4">
                            Please fill in the product name, price, and upload at least one image to see the preview.
                        </p>
                        <button
                            onClick={onClose}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Process images for display
    const processedImages = images.map(img =>
        img instanceof File ? URL.createObjectURL(img) : img
    );

    // Mock rating for preview
    const mockRating = 4.5;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-bold">Product Preview</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Product Details Content */}
                <div className="p-6">
                    <div className="pt-5 md:pt-10 transition-opacity ease-in duration-500 opacity-100">
                        {/* Product Data */}
                        <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                            {/* Product Images */}
                            <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
                                <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-auto max-h-[500px] pb-2 sm:pb-0 scrollbar-hide sm:scrollbar-default sm:w-[18.7%] w-full">
                                    {processedImages.map((item, index) => (
                                        <img
                                            key={index}
                                            onClick={() => setSelectedImage(item)}
                                            className={`w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer border rounded ${selectedImage === item ? 'border-blue-500' : 'border-transparent'}`}
                                            src={item}
                                            alt={`${name} - view ${index + 1}`}
                                        />
                                    ))}
                                </div>
                                <div className="w-full sm:w-[80%]">
                                    <img
                                        className="w-full h-auto rounded-lg"
                                        src={selectedImage || processedImages[0]}
                                        alt={name}
                                    />
                                </div>
                            </div>

                            {/* Product Details */}
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-medium">{name}</h1>

                                <p className="text-xl mt-3 sm:mt-5 font-medium">Rs.{price}</p>

                                {quantity > 0 ? (
                                    <p className="mt-1 text-green-600">
                                        In stock: {quantity} {quantity === 1 ? 'item' : 'items'}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-red-600 font-medium">Out of stock</p>
                                )}

                                <p className="mt-3 sm:mt-5 text-gray-600 text-sm sm:text-base text-justify">
                                    {description}
                                </p>

                                {/* Size selection */}
                                {hasSizes && sizes && sizes.length > 0 && (
                                    <div className="flex flex-col gap-3 my-6 sm:my-8">
                                        <p className="font-semibold">Select Size</p>
                                        <div className="flex flex-wrap gap-2">
                                            {sizes.map((size, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`border border-gray-400 py-2 px-4 rounded-lg ${size === selectedSize ? 'bg-gray-400 text-white' : ''
                                                        } text-sm sm:text-base`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Color selection */}
                                {hasColors && colors && colors.length > 0 && (
                                    <div className="flex flex-col gap-3 my-6 sm:my-8">
                                        <p className="font-semibold">Select Color</p>
                                        <div className="flex flex-wrap gap-4">
                                            {colors.map((colorItem, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setSelectedColor(colorItem)}
                                                    className="relative cursor-pointer"
                                                >
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${selectedColor === colorItem
                                                                ? 'ring-3 ring-blue-500 ring-offset-2'
                                                                : 'ring-1 ring-blue-300 ring-offset-2 hover:ring-2 hover:ring-blue-600 hover:ring-offset-2'
                                                            }`}
                                                    >
                                                        <div
                                                            className="w-6 h-6 rounded-full"
                                                            style={{ backgroundColor: colorItem }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
                                    <button
                                        disabled={quantity <= 0}
                                        className={`${quantity <= 0
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-black hover:bg-gray-800 active:bg-gray-700'
                                            } text-white px-6 sm:px-8 py-3 text-sm rounded-lg cursor-pointer transition-colors duration-200 ease-in-out w-full sm:w-auto`}
                                    >
                                        {quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </button>

                                    <button className="cursor-pointer border border-black px-6 sm:px-8 py-3 text-sm rounded-lg flex items-center justify-center gap-2 bg-white hover:bg-green-200 transition-colors duration-200 ease-in-out w-full sm:w-auto">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                        </svg>
                                        Add to Wishlist
                                    </button>
                                </div>

                                <hr className="mt-6 sm:mt-8 w-full sm:w-4/5" />
                                <div className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-5 flex flex-col gap-1">
                                    <p>100% Original Product.</p>
                                    <p>Cash on delivery is available on this product.</p>
                                    <p>Easy return and exchange policy within 7 days.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsModal;