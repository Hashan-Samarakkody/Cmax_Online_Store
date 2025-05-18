import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import axios from 'axios';
import { backendUrl } from '../../../admin/src/App';
import WebSocketService from '../services/WebSocketService';

const Collection = () => {
  const { search, showSearch } = useContext(ShopContext);
  const [allProducts, setAllProducts] = useState([]);
  const [filterProducts, setFilterProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relavant');
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [relevantSubCategories, setRelevantSubCategories] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true); // Start loading
      try {
        const productsResponse = await axios.get(`${backendUrl}/api/product`);
        setAllProducts(productsResponse.data.products);
        setOriginalProducts(productsResponse.data.products);
        setFilterProducts(productsResponse.data.products);

        const categoriesResponse = await axios.get(`${backendUrl}/api/categories`);
        setCategories(categoriesResponse.data);

        const subcategoriesResponse = await axios.get(`${backendUrl}/api/categories/subcategories/all`);
        setSubCategories(subcategoriesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false); // End loading regardless of outcome
      }
    };

    fetchAllData();

    // Define the handler for new products
    const handleNewProduct = (newProduct) => {
      setAllProducts((prevProducts) => [...prevProducts, newProduct.product]);
      setOriginalProducts((prevProducts) => [...prevProducts, newProduct.product]);
      setFilterProducts((prevProducts) => [...prevProducts, newProduct.product]);
    };

    // Define the handler for deleted products
    const handleDeleteProduct = (data) => {
      const productId = data.productId;
      const filterById = (product) => product._id !== productId;
      setAllProducts(prev => prev.filter(filterById));
      setOriginalProducts(prev => prev.filter(filterById));
      setFilterProducts(prev => prev.filter(filterById));
    };

    // Define the handler for updated products
    const handleUpdateProduct = (data) => {
      if (!data || !data.product) return;

      const updatedProduct = data.product;

      setAllProducts(prev => prev.map(product =>
        product._id === updatedProduct._id ? updatedProduct : product
      ));

      setOriginalProducts(prev => prev.map(product =>
        product._id === updatedProduct._id ? updatedProduct : product
      ));

      setFilterProducts(prev => prev.map(product =>
        product._id === updatedProduct._id ?
          {
            ...updatedProduct,
            // Ensure category and subcategory objects are preserved if they exist
            category: product.category && typeof product.category === 'object' ?
              product.category : updatedProduct.category,
            subcategory: product.subcategory && typeof product.subcategory === 'object' ?
              product.subcategory : updatedProduct.subcategory
          } : product
      ));
    };

    const handleCategoryVisibilityChanged = (data) => {
      if (!data.categoryId || data.isVisible === undefined) return;

      // If the category is now hidden, remove its products from display
      if (data.isVisible === false) {
        setAllProducts(prev => prev.filter(product =>
          product.category._id !== data.categoryId
        ));
        setOriginalProducts(prev => prev.filter(product =>
          product.category._id !== data.categoryId
        ));
        setFilterProducts(prev => prev.filter(product =>
          product.category._id !== data.categoryId
        ));

        // Also update the categories list for filters
        setCategories(prev => prev.filter(cat =>
          cat._id !== data.categoryId
        ));

        // Clear the category selection if it was selected
        setCategory(prev => prev.filter(catId =>
          catId !== data.categoryId
        ));
      } else {
        // If a category became visible,  should refresh the data
        fetchAllData();
      }
    };

    const handleSubcategoryVisibilityChanged = (data) => {
      if (!data.subcategoryId || data.isVisible === undefined) return;

      // If the subcategory is now hidden, remove its products from display
      if (data.isVisible === false) {
        setAllProducts(prev => prev.filter(product =>
          product.subcategory._id !== data.subcategoryId
        ));
        setOriginalProducts(prev => prev.filter(product =>
          product.subcategory._id !== data.subcategoryId
        ));
        setFilterProducts(prev => prev.filter(product =>
          product.subcategory._id !== data.subcategoryId
        ));

        // Also update subcategories for filters
        setSubCategories(prev => prev.filter(sub =>
          sub._id !== data.subcategoryId
        ));

        // Clear subcategory selection if it was selected
        setSubCategory(prev => prev.filter(subId =>
          subId !== data.subcategoryId
        ));
      } else {
        // If a subcategory became visible,  should refresh the data
        fetchAllData();
      }
    };

    // Connect to WebSocket and listen for new products
    WebSocketService.connect(() => {
      WebSocketService.on('newProduct', handleNewProduct);
      WebSocketService.on('updateProduct', handleUpdateProduct);
      WebSocketService.on('deleteProduct', handleDeleteProduct);
      WebSocketService.on('categoryVisibilityChanged', handleCategoryVisibilityChanged);
      WebSocketService.on('subcategoryVisibilityChanged', handleSubcategoryVisibilityChanged);
    });

    // Cleanup function to disconnect WebSocket and remove the listener
    return () => {
      WebSocketService.off('newProduct', handleNewProduct);
      WebSocketService.off('updateProduct', handleUpdateProduct);
      WebSocketService.off('deleteProduct', handleDeleteProduct);
      WebSocketService.off('categoryVisibilityChanged', handleCategoryVisibilityChanged);
      WebSocketService.off('subcategoryVisibilityChanged', handleSubcategoryVisibilityChanged);
      WebSocketService.disconnect();
    };
  }, []);

  // Update relevant subcategories when category selection changes
  useEffect(() => {
    if (category.length > 0) {
      // Filter products that match selected categories
      const productsInSelectedCategories = originalProducts.filter(
        product => category.includes(String(product.category._id))
      );

      // Get unique subcategory IDs from these products
      const relevantSubCategoryIds = [...new Set(
        productsInSelectedCategories
          .map(product => product.subcategory?._id)
          .filter(Boolean)
      )];

      // Filter subcategories to only show the relevant ones
      const relevant = subCategories.filter(sub =>
        relevantSubCategoryIds.includes(sub._id)
      );

      setRelevantSubCategories(relevant);

      // Clear subcategory selections that are no longer relevant
      setSubCategory(prev => prev.filter(subCatId =>
        relevantSubCategoryIds.includes(subCatId)
      ));
    } else {
      // If no category is selected, don't show any subcategories
      setRelevantSubCategories([]);
      // Clear all subcategory selections
      setSubCategory([]);
    }
  }, [category, originalProducts, subCategories]);

  const applyFilters = () => {
    let filtered = originalProducts;

    if (showSearch && search.length > 0) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category.length > 0) {
      filtered = filtered.filter(item => category.includes(String(item.category._id)));
    }

    if (subCategory.length > 0) {
      filtered = filtered.filter(item => subCategory.includes(String(item.subcategory._id)));
    }

    setFilterProducts(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [category, subCategory, search, showSearch, originalProducts]);

  const sortProducts = () => {
    let sortedProducts = [...filterProducts];

    switch (sortType) {
      case 'low-high':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'high-low':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'relavant':
      default:
        sortedProducts = [...originalProducts];
        break;
    }

    setFilterProducts(sortedProducts);
  };

  useEffect(() => {
    sortProducts();
  }, [sortType]);

  const toggleCategory = (e) => {
    const selectedCategory = String(e.target.value);
    setCategory(prevCategory =>
      prevCategory.includes(selectedCategory)
        ? prevCategory.filter(item => item !== selectedCategory)
        : [...prevCategory, selectedCategory]
    );
  };

  const toggleSubCategory = (e) => {
    const selectedSubCategory = String(e.target.value);
    setSubCategory(prevSubCategory =>
      prevSubCategory.includes(selectedSubCategory)
        ? prevSubCategory.filter(item => item !== selectedSubCategory)
        : [...prevSubCategory, selectedSubCategory]
    );
  };

  return (
    <>
      {isLoading ? (
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
          <p className="mt-4 text-gray-600 font-medium">Loading collection...</p>
        </div>
      ) : (
        <div className='relative'>
          {/* Filter Toggle Button */}
          <div className='border-t py-2'>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className='flex items-center gap-2 text-base sm:text-xl font-medium px-4'
            >
              FILTERS
              <img
                className={`h-3 transition-transform ${showFilter ? 'rotate-90' : ''}`}
                src={assets.dropdown_icon}
                alt=""
              />
            </button>
          </div>

          <div className='flex flex-col md:flex-row'>
            {/* Filter Section - Mobile overlay on small screens, sidebar on larger screens */}
            {showFilter && (
              <div className={`
              md:w-60 px-4 transition-all duration-300 ease-in-out
              fixed md:static top-0 left-0 h-full md:h-auto w-full
              bg-white md:bg-transparent pt-16 md:pt-0
              md:border-0 overflow-y-auto
            `}>
                {/* Close button for mobile only */}
                <button
                  className="absolute top-2 right-4 text-2xl md:hidden"
                  onClick={() => setShowFilter(false)}
                >
                  ✕
                </button>

                <div className='border rounded-xl border-gray-300 pl-5 my-2 py-3'>
                  <p className='text-gray-700 cursor-pointer mb-3 text-sm font-semibold'>CATEGORIES</p>
                  <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
                    {categories.map((cat) => (
                      <p key={cat._id} className='flex gap-2'>
                        <input
                          className='w-3'
                          type='checkbox'
                          value={cat._id}
                          checked={category.includes(cat._id)}
                          onChange={toggleCategory}
                        /> {cat.name}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Only show subcategories section if there are relevant subcategories */}
                {relevantSubCategories.length > 0 && (
                  <div className='border rounded-xl border-gray-300 pl-5 py-3 mt-6'>
                    <p className='text-gray-700 cursor-pointer mb-3 text-sm font-semibold'>SUBCATEGORIES</p>
                    <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
                      {relevantSubCategories.map((sub) => (
                        <p key={sub._id} className='flex gap-2'>
                          <input
                            className='w-3'
                            type='checkbox'
                            value={sub._id}
                            checked={subCategory.includes(sub._id)}
                            onChange={toggleSubCategory}
                          /> {sub.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply button for mobile only */}
                <button
                  className="w-full bg-gray-800 text-white py-2 rounded-lg mt-4 md:hidden"
                  onClick={() => setShowFilter(false)}
                >
                  Apply Filters
                </button>
              </div>
            )}

            {/* Products Section - Takes full width when filter is collapsed */}
            <div className='flex-1'>
              <div className='flex mt-2 justify-between items-center text-base sm:text-xl mb-4 px-4 flex-wrap gap-2'>
                <Title text1={'ALL'} text2={'COLLECTIONS'} />
                <select onChange={(e) => setSortType(e.target.value)} className='rounded-sm border border-gray-400 text-xs sm:text-sm px-2 py-1'>
                  <option value="relavant">Sort by: Relevant</option>
                  <option value="low-high">Sort by: Low to High</option>
                  <option value="high-low">Sort by: High to Low</option>
                </select>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 gap-y-4 sm:gap-y-6 px-2 sm:px-4'>
                {filterProducts.length > 0 ? (
                  filterProducts.map((item) => (
                    <ProductItem key={item._id} id={item._id} image={item.images} name={item.name} price={item.price} />
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center min-h-[60vh]">
                    <img
                      src={assets.product_icon}
                      alt="No products"
                      className="w-24 h-24 object-contain mb-4 animate-bounce"
                    />
                    <p className="text-gray-600 font-medium text-lg">No products to display</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overlay backdrop when filter is open on mobile */}
          {showFilter && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowFilter(false)}
            ></div>
          )}
        </div>
      )}
    </>
  );
};

export default Collection;