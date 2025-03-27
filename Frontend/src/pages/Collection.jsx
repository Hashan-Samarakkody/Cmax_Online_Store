import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import axios from 'axios';
import { backendUrl } from '../../../admin/src/App';

const Collection = () => {
  const { search, showSearch } = useContext(ShopContext);
  const [allProducts, setAllProducts] = useState([]);
  const [filterProducts, setFilterProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]); // Store original products here
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relavant');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const productsResponse = await axios.get(`${backendUrl}/api/product`);
        setAllProducts(productsResponse.data.products);
        setOriginalProducts(productsResponse.data.products); // Set original products
        setFilterProducts(productsResponse.data.products);

        const categoriesResponse = await axios.get(`${backendUrl}/api/categories`);
        setCategories(categoriesResponse.data);

        const subcategoriesResponse = await axios.get(`${backendUrl}/api/categories/subcategories/all`);
        setSubCategories(subcategoriesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAllData();
  }, []);

  const applyFilters = () => {
    let filtered = originalProducts; // Use original products for filtering

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
  }, [category, subCategory, search, showSearch, originalProducts]); // Use originalProducts

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
        sortedProducts = [...originalProducts]; // Set the list back to the original products when sorting by relevant
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
            <p>No products found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;
