import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import DOMPurify from 'dompurify';
import { useParams, useNavigate } from 'react-router-dom';
import { processImage } from '../utils/imageProcessor';

const Edit = ({ token }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [images, setImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [bestseller, setBestseller] = useState(false);
    const [hasSizes, setHasSizes] = useState(false);
    const [hasColors, setHasColors] = useState(false);
    const [sizes, setSizes] = useState([]);
    const [colors, setColors] = useState([]);
    const [currentColor, setCurrentColor] = useState('');
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [processingImage, setProcessingImage] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quantity, setQuantity] = useState('');

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/categories`);
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Failed to fetch categories.');
            }
        };
        fetchCategories();
    }, []);

    // Fetch product details
    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/product/single/get/${id}`, {
                    headers: { token }
                });

                if (response.data.success) {
                    const product = response.data.product;

                    if (!product || Object.keys(product).length === 0) {
                        throw new Error("Product data is empty or undefined.");
                    }

                    setName(product.name || '');
                    setDescription(product.description || '');
                    setPrice(product.price ? product.price.toString() : '');
                    setSelectedCategory(product.category?._id || product.category || '');
                    setSelectedSubCategory(product.subcategory?._id || product.subcategory || '');
                    setBestseller(product.bestseller || false);
                    setHasSizes(product.hasSizes || false);
                    setHasColors(product.hasColors || false);
                    setSizes(product.sizes || []);
                    setColors(product.colors || []);
                    setQuantity(product.quantity || '');

                    // Fetch images
                    const imageUrls = product.images || [];
                    setImages(imageUrls);
                } else {
                    toast.error('Failed to fetch product details.');
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching product details:", error);
                toast.error('Failed to fetch product details.');
                setLoading(false);
            }
        };

        if (categories.length > 0) {
            fetchProductDetails();
        }
    }, [id, token, categories]);

    // Load subcategories when categories are loaded and product data is fetched
    useEffect(() => {
        if (categories.length > 0 && selectedCategory && initialLoad) {
            // Find the category that matches our selectedCategory
            const category = categories.find(cat => cat._id === selectedCategory);
            if (category && category.subcategories) {
                setFilteredSubcategories(category.subcategories);
                setInitialLoad(false);
            }
        }
    }, [categories, selectedCategory, initialLoad]);

    // Handle category change by user (not initial load)
    const handleCategoryChange = (e) => {
        const newCategoryId = e.target.value;
        setSelectedCategory(newCategoryId);

        // Update subcategories based on selected category
        if (newCategoryId) {
            const category = categories.find(cat => cat._id === newCategoryId);
            setFilteredSubcategories(category ? category.subcategories : []);
            // Reset subcategory selection when category changes
            setSelectedSubCategory('');
        } else {
            setFilteredSubcategories([]);
        }
    };

    // Handle image upload with processing
    const handleImageUpload = async (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setProcessingImage(true);

            // Process the image
            const processedImage = await processImage(file);

            // Update images array with the processed image
            const newImages = [...images];

            // If this is replacing an existing image URL, add it to imagesToDelete
            if (index < newImages.length && typeof newImages[index] === 'string' && !imagesToDelete.includes(newImages[index])) {
                setImagesToDelete(prev => [...prev, newImages[index]]);
            }

            // Add the new image at the specified index
            newImages[index] = processedImage;

            // Filter out null values
            const cleanImages = newImages.filter(img => img !== null);

            // Ensure no more than 4 images
            const limitedImages = cleanImages.length > 4 ? cleanImages.slice(0, 4) : cleanImages;

            // Pad with nulls to maintain array structure (for UI display)
            const finalImages = [...limitedImages];
            while (finalImages.length < 4) {
                finalImages.push(null);
            }

            setImages(finalImages);
            toast.success('Image processed successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to process image');
            console.error('Image processing error:', error);
        } finally {
            setProcessingImage(false);
        }
    };

    // Handle image removal
    const removeImage = (index) => {
        const newImages = [...images];

        // If removing a URL image (not a File object), add to imagesToDelete
        if (typeof newImages[index] === 'string') {
            setImagesToDelete(prev => [...prev, newImages[index]]);
        }

        // Remove the image from the array - setting to null preserves the index positions
        newImages[index] = null;
        setImages(newImages);

        toast.info('Image removed');
    };

    const addColor = () => {
        const trimmedColor = currentColor.trim().toLowerCase();

        // Validate that color contains only letters
        if (!trimmedColor) {
            return; // Empty input, do nothing
        }

        // Check if color contains only alphabetical characters
        const letterOnlyRegex = /^[a-zA-Z]+$/;
        if (!letterOnlyRegex.test(trimmedColor)) {
            toast.error('Color name can only contain letters.');
            return;
        }

        if (!colors.includes(trimmedColor)) {
            setColors([...colors, trimmedColor]);
            setCurrentColor('');
        } else {
            toast.warning('This color is already added.');
        }
      };

    const removeColor = (colorToRemove) => {
        setColors(colors.filter(color => color !== colorToRemove));
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        // Sanitize inputs
        const sanitizedName = DOMPurify.sanitize(name.trim());
        const sanitizedDescription = DOMPurify.sanitize(description.trim());
        const sanitizedPrice = DOMPurify.sanitize(price.trim());
        const sanitizedQuantity = DOMPurify.sanitize(quantity);

        // Validate Quantity
        const numericQuantity = Number(sanitizedQuantity);
        if (sanitizedQuantity === '' || isNaN(numericQuantity) || numericQuantity < 0) {
            toast.error('Please enter a valid quantity (0 or positive number).');
            return;
        }

        // Validate Product Name
        if (!sanitizedName || sanitizedName.length < 3 || sanitizedName.length > 100) {
            toast.error('Product name must be between 3 and 100 characters.');
            return;
        }

        // Validate Product Name characters
        const validNameRegex = /^[a-zA-Z0-9\[\],#.\-\s:\/\\|"'+-]+$/;
        if (!validNameRegex.test(sanitizedName)) {
            toast.error('Product name contains invalid characters.');
            return;
        }

        // Validate Description
        if (!sanitizedDescription || sanitizedDescription.length < 10 || sanitizedDescription.length > 10000) {
            toast.error('Description must be between 10 and 10000 characters.');
            return;
        }

        // Validate Price
        const numericPrice = Number(sanitizedPrice);
        if (!sanitizedPrice || isNaN(numericPrice) || numericPrice <= 0) {
            toast.error('Please enter a valid price greater than zero.');
            return;
        }

        // Validate Category and Subcategory
        if (!selectedCategory) {
            toast.error('Please select a category.');
            return;
        }
        if (!selectedSubCategory) {
            toast.error('Please select a subcategory.');
            return;
        }

        // Validate Colors (if enabled)
        if (hasColors && colors.length === 0) {
            toast.error('Please add at least one color.');
            return;
        }

        // Validate Sizes (if enabled)
        if (hasSizes && sizes.length === 0) {
            toast.error('Please select at least one size.');
            return;
      }

        // Make sure at least one image remains
        const remainingImages = images.filter(img => img !== null);
        if (remainingImages.length === 0) {
            toast.error('Please include at least one product image.');
            return;
        }

        setIsSubmitting(true);

        // Prepare form data
        const formData = new FormData();
        formData.append('productId', id);
        formData.append('name', sanitizedName);
        formData.append('description', sanitizedDescription);
        formData.append('category', selectedCategory);
        formData.append('subcategory', selectedSubCategory);
        formData.append('price', numericPrice);
        formData.append('bestseller', bestseller);
        formData.append('quantity', numericQuantity);

        // Optional sizes and colors
        formData.append('hasSizes', hasSizes);
        formData.append('hasColors', hasColors);

        if (hasSizes) {
            formData.append('sizes', JSON.stringify(sizes));
        }

        if (hasColors) {
            formData.append('colors', JSON.stringify(colors));
        }

        // Add existing images (URLs) to keep
        const existingUrlImages = images.filter(img => typeof img === 'string');
        existingUrlImages.forEach((imageUrl, idx) => {
            formData.append(`existingImages[${idx}]`, imageUrl);
        });

        // Add new image files
        const newImageFiles = images.filter(img => img instanceof File);
        newImageFiles.forEach((imageFile, idx) => {
            formData.append(`newImages[${idx}]`, imageFile);
        });

        // Add list of images to delete from cloud storage
        if (imagesToDelete.length > 0) {
            formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
        }

        try {
            const response = await axios.put(`${backendUrl}/api/product/update`, formData, {
                headers: {
                    token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('Product updated successfully!', { autoClose: 1000 });
                navigate('/list');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Error occurred while updating the product:", error.response || error.message);
            if (error.response) {
                toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative w-24 h-24">
                    {/* Pulsing circle animation */}
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-t-4 border-green-400 rounded-full animate-spin"></div>

                    {/* Shop icon or logo in center */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <img
                            src={assets.logo}
                            alt="Loading"
                            className="w-12 h-12 object-contain animate-pulse"
                        />
                    </div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading Product...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Edit Items</h1>
                <div className='px-110'>
                    <button
                        onClick={() => navigate('/list')}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Products
                    </button>
                </div>
            </div>

            <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">

                {/* Product Name */}
                <div className="w-full">
                    <p className="font-semibold mb-2">Product Name</p>
                    <input
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        className="w-full max-w-[500px] px-3 py-2"
                        type="text"
                        placeholder="Type here"
                        required
                    />
                </div>

                {/* Product Description */}
                <div className="w-full">
                    <p className="font-semibold mb-2">Product Description</p>
                    <textarea
                        onChange={(e) => {
                            setDescription(e.target.value);
                            e.target.style.height = "auto"; // Reset height to auto to calculate new height
                            e.target.style.height = `${e.target.scrollHeight}px`; // Adjust height based on scrollHeight
                            // Adjust width if there are more than 10 lines
                            const lineCount = e.target.value.split("\0").length;
                            if (lineCount > 10) {
                                e.target.style.width = "150%"; // Increase width to 1.5 times
                            } else {
                                e.target.style.width = "100%"; // Reset width to default
                            }
                        }}
                        value={description}
                        className="w-full max-w-[590px] px-3 py-2 overflow-hidden"
                        placeholder="Write description here"
                        required
                        style={{ resize: "none" }} // Prevent manual resizing
                    />
                    <div className="mt-1 text-sm flex justify-end max-w-[590px]">
                        <span className={`${description.length >= 9000 ? 'text-orange-500' : ''} ${description.length >= 10000 ? 'text-red-500 font-semibold' : ''}`}>
                            {description.length}/10000 characters
                        </span>
                    </div>
                </div>

                {/* Category and Subcategory */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
                    <div>
                        <p className="font-semibold mb-2">Product Category</p>
                        <select
                            onChange={handleCategoryChange}
                            value={selectedCategory}
                            className="w-full px-3 py-2"
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="font-semibold mb-2">Product Subcategory</p>
                        <select
                            onChange={(e) => setSelectedSubCategory(e.target.value)}
                            value={selectedSubCategory}
                            className="w-full px-3 py-2"
                            required
                        >
                            <option value="">Select a subcategory</option>
                            {filteredSubcategories.map((sub) => (
                                <option key={sub._id} value={sub._id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="font-semibold mb-2">Product Price</p>
                        <input
                            onChange={(e) => setPrice(e.target.value)}
                            value={price}
                            type='number'
                            min={0}
                            placeholder='10'
                            className="w-full px-3 py-2 sm:w-[120px]"
                            required
                        />
                    </div>
                </div>

                <div>
                    <p className="font-semibold mb-2">Product Quantity</p>
                    <input
                        onChange={(e) => setQuantity(e.target.value)}
                        value={quantity}
                        type='number'
                        min={0}
                        placeholder='0'
                        className="w-full px-3 py-2 sm:w-[120px]"
                        required
                    />
                </div>

                {/* Sizes Toggle */}
                <div className="flex gap-2 mt-2">
                    <input
                        onChange={() => setHasSizes(prev => !prev)}
                        checked={hasSizes}
                        type="checkbox"
                        id="hasSizes"
                    />
                    <label className="font-semibold cursor-pointer" htmlFor="hasSizes">
                        Enable Sizes
                    </label>
                </div>

                {/* Sizes Selection (only if hasSizes is true) */}
                {hasSizes && (
                    <div>
                        <p className="mb-2">Product Sizes</p>
                        <div className="flex gap-3">
                            {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                                <div
                                    key={size}
                                    onClick={() =>
                                        setSizes((prev) =>
                                            prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]
                                        )
                                    }
                                >
                                    <p
                                        className={`${sizes.includes(size) ? 'bg-green-300' : 'bg-slate-200'
                                            } px-3 py-1 cursor-pointer rounded-sm text-black`}
                                    >
                                        {size}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Colors Toggle */}
                <div className="flex gap-2 mt-2">
                    <input
                        onChange={() => setHasColors(prev => !prev)}
                        checked={hasColors}
                        type="checkbox"
                        id="hasColors"
                    />
                    <label className="font-semibold cursor-pointer" htmlFor="hasColors">
                        Enable Colors
                    </label>
                </div>

                {/* Color Input (only if hasColors is true) */}
                {hasColors && (
                    <div className="w-full max-w-[500px]">
                        <p className="mb-2">Product Colors</p>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={currentColor}
                                onChange={(e) => setCurrentColor(e.target.value)}
                                placeholder="Enter color name (e.g., red, blue)"
                                className="flex-grow px-3 py-2 border"
                            />
                            <button
                                type="button"
                                onClick={addColor}
                                className="bg-green-500 text-white px-4 py-2 rounded"
                            >
                                Add Color
                            </button>
                        </div>

                        {/* Display selected colors */}
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                                <div
                                    key={color}
                                    className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded"
                                >
                                    <span>{color}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeColor(color)}
                                        className="text-red-500 ml-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bestseller Toggle */}
                <div className="flex gap-2 mt-2">
                    <input
                        onChange={() => setBestseller((prev) => !prev)}
                        checked={bestseller}
                        type="checkbox"
                        id="bestseller"
                    />
                    <label className="font-semibold cursor-pointer" htmlFor="bestseller">
                        Add to bestseller
                    </label>
                </div>

                {/* Image Upload */}
                <div>
                    <p className="font-semibold mb-2">Product Images</p>
                    <p className='text-sm text-red-500 mb-2'>
                        <i>✸ Only PNG, JPEG, and JPG files are allowed</i>
                    </p>
                    <p className='text-sm text-red-500 mb-2'>
                        <i>✸ Images will be automatically resized to 700 × 700 pixels</i>
                    </p>
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map((index) => (
                            <div key={index} className="relative">
                                <label
                                    htmlFor={`image${index + 1}`}
                                    className={`cursor-pointer block ${processingImage ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <img
                                        className="w-40 h-40 object-cover rounded-sm border border-gray-300"
                                        src={
                                            images[index] instanceof File
                                                ? URL.createObjectURL(images[index])
                                                : (images[index] || assets.upload_area)
                                        }
                                        alt={`Preview ${index + 1}`}
                                    />
                                    <input
                                        onChange={(e) => handleImageUpload(e, index)}
                                        type="file"
                                        id={`image${index + 1}`}
                                        hidden
                                        disabled={processingImage}
                                        accept="image/png, image/jpeg, image/jpg"
                                    />
                                </label>
                                {images[index] && (
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                                        title="Remove image"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {processingImage && (
                        <p className="text-blue-500 mt-2">Processing image, please wait...</p>
                    )}
                </div>
                
                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-35 py-3 mt-4 bg-black text-white rounded-sm flex items-center justify-center"
                    disabled={processingImage || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            UPDATING...
                        </>
                    ) : (
                        'UPDATE'
                    )}
                </button>
            </form>
        </div>
    );
};

export default Edit;