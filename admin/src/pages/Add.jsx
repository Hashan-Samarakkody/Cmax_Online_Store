import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import DOMPurify from 'dompurify';
import { processImage } from '../utils/imageProcessor';

const Add = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [bestseller, setBestseller] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);
  const [hasColors, setHasColors] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [currentColor, setCurrentColor] = useState('');
  const [processingImage, setProcessingImage] = useState(false);

  // Save form state to sessionStorage whenever the component unmounts
  useEffect(() => {
    const saveFormState = () => {
      const formData = {
        productId,
        name,
        description,
        price,
        bestseller,
        selectedCategory,
        selectedSubCategory,
        hasSizes,
        hasColors,
        sizes,
        colors
      };
      sessionStorage.setItem('addProductFormState', JSON.stringify(formData));
    };

    // Add event listener for when the component unmounts or page changes
    window.addEventListener('beforeunload', saveFormState);

    return () => {
      // Also save when component unmounts within the app
      saveFormState();
      window.removeEventListener('beforeunload', saveFormState);
    };
  }, [productId, name, description, price, bestseller, selectedCategory,
    selectedSubCategory, hasSizes, hasColors, sizes, colors]);

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

    // Load saved form state when component mounts
    const savedFormState = sessionStorage.getItem('addProductFormState');
    if (savedFormState) {
      try {
        const parsedData = JSON.parse(savedFormState);
        setProductId(parsedData.productId || '');
        setName(parsedData.name || '');
        setDescription(parsedData.description || '');
        setPrice(parsedData.price || '');
        setBestseller(parsedData.bestseller || false);
        setSelectedCategory(parsedData.selectedCategory || '');
        setSelectedSubCategory(parsedData.selectedSubCategory || '');
        setHasSizes(parsedData.hasSizes || false);
        setHasColors(parsedData.hasColors || false);
        setSizes(parsedData.sizes || []);
        setColors(parsedData.colors || []);
      } catch (error) {
        console.error('Error loading saved form state:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find((cat) => cat._id === selectedCategory);
      setSubcategories(category ? category.subcategories : []);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory, categories]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const formHasData = productId || name || description || price || image1 ||
        selectedCategory || selectedSubCategory ||
        colors.length > 0 || sizes.length > 0;

      if (formHasData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [productId, name, description, price, image1, selectedCategory,
    selectedSubCategory, colors, sizes]);

  /**
   * Handles image upload with processing
   * @param {Event} e - The change event from the file input
   * @param {Function} setImage - The state setter function for the image
   */
  const handleImageUpload = async (e, setImage) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setProcessingImage(true);

      // Process the image
      const processedImage = await processImage(file);

      // Set the processed image
      setImage(processedImage);

      toast.success('Image processed successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to process image');
      console.error('Image processing error:', error);
    } finally {
      setProcessingImage(false);
    }
  };

  // Function to remove an image
  const removeImage = (index) => {
    switch (index) {
      case 0:
        setImage1(false);
        break;
      case 1:
        setImage2(false);
        break;
      case 2:
        setImage3(false);
        break;
      case 3:
        setImage4(false);
        break;
      default:
        break;
    }

    toast.info('Image removed');
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Sanitize inputs to prevent XSS
    const sanitizedProductId = DOMPurify.sanitize(productId.trim());
    const sanitizedName = DOMPurify.sanitize(name.trim());
    const sanitizedDescription = DOMPurify.sanitize(description.trim());
    const sanitizedPrice = DOMPurify.sanitize(price.trim());

    // Validate Product ID
    if (!sanitizedProductId || sanitizedProductId.length < 1) {
      toast.error('Product ID must be a minimum of 1 character.');
      return;
    }

    // Validate Product Name
    if (!sanitizedName || sanitizedName.length < 3 || sanitizedName.length > 100) {
      toast.error('Product name must be between 3 and 100 characters.');
      return;
    }

    // Validate Description
    if (!sanitizedDescription || sanitizedDescription.length < 10 || sanitizedDescription.length > 1000) {
      toast.error('Description must be between 10 and 1000 characters.');
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

    // Validate Images
    const images = [image1, image2, image3, image4].filter(Boolean);
    if (images.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }

    // Validate Colors (if enabled)
    if (hasColors && colors.length === 0) {
      toast.error('Please add at least one color.');
      return;
    }

    // Proceed with form submission
    try {
      const formData = new FormData();
      formData.append('productId', sanitizedProductId);
      formData.append('name', sanitizedName);
      formData.append('description', sanitizedDescription);
      formData.append('category', selectedCategory);
      formData.append('subcategory', selectedSubCategory);
      formData.append('price', numericPrice);
      formData.append('bestseller', bestseller);

      // Optional sizes and colors
      formData.append('hasSizes', hasSizes);
      formData.append('hasColors', hasColors);

      if (hasSizes) {
        formData.append('sizes', JSON.stringify(sizes));
      }

      if (hasColors) {
        formData.append('colors', JSON.stringify(colors));
      }

      // Add images
      images.forEach((image, index) => {
        formData.append(`image${index + 1}`, image);
      });

      const response = await axios.post(`${backendUrl}/api/product/add`, formData, { headers: { token } });

      if (response.data.success) {
        toast.success('Product added successfully!', { autoClose: 8000 });
        // Reset form
        setProductId('');
        setName('');
        setDescription('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setPrice('');
        setSizes([]);
        setColors([]);
        setBestseller(false);
        setSelectedCategory('');
        setSelectedSubCategory('');
        setHasSizes(false);
        setHasColors(false);

        // Clear sessionStorage
        sessionStorage.removeItem('addProductFormState');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error occurred while adding the product:", error.response || error.message);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const addColor = () => {
    const trimmedColor = currentColor.trim().toLowerCase();
    if (trimmedColor && !colors.includes(trimmedColor)) {
      setColors([...colors, trimmedColor]);
      setCurrentColor('');
    } else if (colors.includes(trimmedColor)) {
      toast.warning('This color is already added.');
    }
  };

  const removeColor = (colorToRemove) => {
    setColors(colors.filter(color => color !== colorToRemove));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Items</h1>
      </div>

      <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
        
        {/* Product ID Input */}
        <div className="w-full">
          <p className="font-semibold mb-2">Product ID</p>
          <input
            onChange={(e) => setProductId(e.target.value)}
            value={productId}
            className="w-full max-w-[590px] px-3 py-2"
            type="text"
            placeholder="Enter unique Product ID"
            required
          />
        </div>

        {/* Product Name */}
        <div className="w-full">
          <p className="font-semibold mb-2">Product Name</p>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            className="w-full max-w-[590px] px-3 py-2"
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
        </div>

        {/* Category and Subcategory */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
          <div>
            <p className="font-semibold mb-2">Product Category</p>
            <select
              onChange={(e) => setSelectedCategory(e.target.value)}
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
              {subcategories.map((sub) => (
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
          <div className="w-full max-w-[590px]">
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
          <p className="font-semibold mb-2">Upload Images</p>
          <p className='text-sm text-red-500 mb-2'>
            <i>✸ First image will always be the main image (display image)</i>
          </p>
          <p className='text-sm text-red-500 mb-2'>
            <i>✸ Only PNG, JPEG, and JPG files are allowed</i>
          </p>
          <p className='text-sm text-red-500 mb-2'>
            <i>✸ Images will be automatically resized to 700 × 700 pixels</i>
          </p>
          <div className="flex gap-2">
            {[image1, image2, image3, image4].map((image, index) => (
              <div key={index} className="relative">
                <label
                  htmlFor={`image${index + 1}`}
                  className={`cursor-pointer block ${processingImage ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <img
                    className="w-40 h-40 object-cover rounded-sm border border-gray-300"
                    src={!image ? assets.upload_area : URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                  />
                  <input
                    onChange={(e) => handleImageUpload(e, [setImage1, setImage2, setImage3, setImage4][index])}
                    type="file"
                    id={`image${index + 1}`}
                    accept="image/png, image/jpeg, image/jpg"
                    hidden
                    disabled={processingImage}
                  />
                </label>
                {image && (
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
          className="w-28 py-3 mt-4 bg-black text-white rounded-sm"
          disabled={processingImage}
        >
          ADD
        </button>
      </form>
    </div>
  );
};

export default Add;