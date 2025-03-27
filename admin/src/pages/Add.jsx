import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

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

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find((cat) => cat._id === selectedCategory);
      setSubcategories(category ? category.subcategories : []);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory, categories]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Enhanced Validation
    // Check for zero or negative price
    const numericPrice = Number(price);
    if (!price || isNaN(numericPrice) || numericPrice <= 0) {
      toast.error('Please enter a valid price greater than zero.');
      return;
    }

    // Comprehensive image validation
    const images = [image1, image2, image3, image4].filter(Boolean);
    if (images.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }

    // Previous validation checks
    if (!productId || !name || !description || !selectedCategory || !selectedSubCategory) {
      toast.error('Please fill out all required fields.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('name', name);
      formData.append('description', description);
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

      // Add images only if selected
      images.forEach((image, index) => {
        formData.append(`image${index + 1}`, image);
      });

      const response = await axios.post(`${backendUrl}/api/product/add`, formData, { headers: { token } });

      if (response.data.success) {
        toast.success('Product added successfully!');

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
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
      {/* Product ID Input */}
      <div className="w-full">
        <p className="font-semibold mb-2">Product ID</p>
        <input
          onChange={(e) => setProductId(e.target.value)}
          value={productId}
          className="w-full max-w-[500px] px-3 py-2"
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
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className="w-full max-w-[500px] px-3 py-2"
          placeholder="Write description here"
          required
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
        <p className="font-semibold mb-2">Upload Images</p>
        <div className="flex gap-2">
          {[image1, image2, image3, image4].map((image, index) => (
            <label key={index} htmlFor={`image${index + 1}`} className="cursor-pointer">
              <img
                className="w-40 h-40 object-cover rounded-sm border border-gray-300"
                src={!image ? assets.upload_area : URL.createObjectURL(image)}
                alt={`Preview ${index + 1}`}
              />
              <input
                onChange={(e) => {
                  const setImage = [setImage1, setImage2, setImage3, setImage4][index];
                  setImage(e.target.files[0]);
                }}
                type="file"
                id={`image${index + 1}`}
                hidden
              />
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button type="submit" className="w-28 py-3 mt-4 bg-black text-white rounded-sm">
        ADD
      </button>
    </form>
  );
};

export default Add;