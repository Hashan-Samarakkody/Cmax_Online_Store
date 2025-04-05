import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import axios from 'axios';
import { backendUrl } from '../../../admin/src/App';
import WebSocketService from '../WebSocketService'; // Make sure the path is correct

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
  const [isLoading, setIsLoading] = useState(true); // Add loading state

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
      const updatedProduct = data.product;
      const updateFunc = (products) => products.map(product =>
        product._id === updatedProduct._id ? updatedProduct : product
      );
      setAllProducts(updateFunc);
      setOriginalProducts(updateFunc);
      setFilterProducts(updateFunc);
    };

    // Connect to WebSocket and listen for new products
    WebSocketService.connect(() => {
      WebSocketService.on('newProduct', handleNewProduct);
      WebSocketService.on('updateProduct', handleUpdateProduct);
      WebSocketService.on('deleteProduct', handleDeleteProduct);
    });

    // Cleanup function to disconnect WebSocket and remove the listener
    return () => {
      WebSocketService.off('newProduct', handleNewProduct);
      WebSocketService.off('updateProduct', handleUpdateProduct);
      WebSocketService.off('deleteProduct', handleDeleteProduct);
      WebSocketService.disconnect();
    };
  }, []);

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
        <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 border-t'>
          <div className='min-w-60'>
            <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>
              FILTERS
              <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
            </p>

            <div className={`border rounded-xl border-gray-300 pl-5 my-5 py-3 ${showFilter ? 'block' : 'hidden'} sm:block`}>
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

            <div className={`border rounded-xl border-gray-300 pl-5 py-3 mt-6 ${showFilter ? 'block' : 'hidden'} sm:block`}>
              <p className='text-gray-700 cursor-pointer mb-3 text-sm font-semibold'>SUBCATEGORIES</p>
              <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
                {subCategories.map((sub) => (
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
          </div>

          <div className='flex-1'>
            <div className='flex mt-2 justify-between text-base sm:text-xl mb-4'>
              <Title text1={'ALL'} text2={'COLLECTIONS'} />
              <select onChange={(e) => setSortType(e.target.value)} className='rounded-sm border border-gray-400 text-sm px-2'>
                <option value="relavant">Sort by: Relevant</option>
                <option value="low-high">Sort by: Low to High</option>
                <option value="high-low">Sort by: High to Low</option>
              </select>
            </div>

              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
                {filterProducts.length > 0 ? (
                  filterProducts.map((item) => (
                    <ProductItem key={item._id} id={item._id} image={item.images} name={item.name} price={item.price} />
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center min-h-[60vh]">
                    <img
                      src={assets.product_icon}
                      alt="No products"
                      className="w-24 h-24 object-contain mb-4"
                    />
                    <p className="text-gray-600 font-medium text-lg">No products to display</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Collection;