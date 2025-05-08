import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';
import { assets } from '../assets/assets';


const ProductList = ({ token }) => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriteria, setSearchCriteria] = useState({
    productId: true,
    name: false,
    category: false,
    subcategory: false,
    price: false
  });

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list');
      if (response.data.success) {
        setList(response.data.products);
        setFilteredList(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message, { autoClose: 1000 });
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const editProduct = (productId) => {
    navigate(`/edit/${productId}`);
  };

  // Handle search criteria checkboxes - modified to allow only one selection
  const handleCriteriaChange = (criterion) => {
    // If the criterion is already selected, keep it selected (prevent deselecting all)
    if (searchCriteria[criterion]) {
      return;
    }

    // Create a new criteria object with all values set to false
    const newCriteria = {
      productId: false,
      name: false,
      category: false,
      subcategory: false,
      price: false
    };

    // Set only the selected criterion to true
    newCriteria[criterion] = true;

    // Update the state
    setSearchCriteria(newCriteria);
  };

  // Filter products based on search term and selected criteria
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredList(list);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = list.filter(product => {
      // Check each selected criterion
      if (searchCriteria.productId &&
        product.productId?.toLowerCase().includes(term)) {
        return true;
      }
      if (searchCriteria.name &&
        product.name?.toLowerCase().includes(term)) {
        return true;
      }
      if (searchCriteria.category &&
        product.category?.name?.toLowerCase().includes(term)) {
        return true;
      }
      if (searchCriteria.subcategory &&
        product.subcategory?.name?.toLowerCase().includes(term)) {
        return true;
      }
      if (searchCriteria.price &&
        product.price?.toString().includes(term)) {
        return true;
      }
      return false;
    });

    setFilteredList(filtered);
  }, [searchTerm, searchCriteria, list]);

  useEffect(() => {
    fetchList();

    // Define the handler for new products
    const handleNewProduct = (newProduct) => {
      setList((prevList) => [...prevList, newProduct.product]);
      setFilteredList((prevList) => [...prevList, newProduct.product]);
    };

    // Define handler for deleted products
    const handleDeleteProduct = (data) => {
      setList((prevList) => prevList.filter(item => item._id !== data.productId));
      setFilteredList((prevList) => prevList.filter(item => item._id !== data.productId));
    };

    // Define handler for updated products
    const handleUpdateProduct = (data) => {
      setList((prevList) => prevList.map(item =>
        item.productId === data.product.productId ? data.product : item
      ));
      setFilteredList((prevList) => prevList.map(item =>
        item.productId === data.product.productId ? data.product : item
      ));
    };

    // Connect to WebSocket and listen for product events
    WebSocketService.connect(() => {
      WebSocketService.on('newProduct', handleNewProduct);
      WebSocketService.on('deleteProduct', handleDeleteProduct);
      WebSocketService.on('updateProduct', handleUpdateProduct);
    });

    // Cleanup function to disconnect WebSocket and remove the listeners
    return () => {
      WebSocketService.disconnect();
      WebSocketService.off('newProduct', handleNewProduct);
      WebSocketService.off('deleteProduct', handleDeleteProduct);
      WebSocketService.off('updateProduct', handleUpdateProduct);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-8">
      <div className="py-8">
        {/* Search Section */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={searchCriteria.productId}
                onChange={() => handleCriteriaChange('productId')}
                className="mr-2 h-4 w-4"
                name="searchCriteria"
              />
              <span>Product ID</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={searchCriteria.name}
                onChange={() => handleCriteriaChange('name')}
                className="mr-2 h-4 w-4"
                name="searchCriteria"
              />
              <span>Name</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={searchCriteria.category}
                onChange={() => handleCriteriaChange('category')}
                className="mr-2 h-4 w-4"
                name="searchCriteria"
              />
              <span>Category</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={searchCriteria.subcategory}
                onChange={() => handleCriteriaChange('subcategory')}
                className="mr-2 h-4 w-4"
                name="searchCriteria"
              />
              <span>Subcategory</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={searchCriteria.price}
                onChange={() => handleCriteriaChange('price')}
                className="mr-2 h-4 w-4"
                name="searchCriteria"
              />
              <span>Price</span>
            </label>
          </div>
        </div>

        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
          <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white">
                <img
                  src={assets.product_icon}
                  alt="Empty parcel"
                  className="w-32 h-32 opacity-50 mb-4"
                />
                <p className="text-xl text-gray-600 font-medium">
                  {searchTerm ? "No products match your search" : "No products to display"}
                </p>
              </div>
            ) : (
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold border-b-2 border-gray-200">
                    <th className="px-5 py-3 text-left">Image</th>
                    <th className="px-5 py-3 text-left">Product ID</th>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-left">Subcategory</th>
                    <th className="px-5 py-3 text-left">Price</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition duration-200">
                      <td className="px-5 py-5 bg-white text-sm">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-16 h-16">
                            <img
                              className="w-full h-full rounded-lg object-cover"
                              src={item.images[0]}
                              alt={item.name}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">{item.productId}</p>
                      </td>
                      <td className="px-5 py-5 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">{item.name}</p>
                      </td>
                      <td className="px-5 py-5 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">
                          {item.category?.name || "Unavailable"}
                        </p>
                      </td>
                      <td className="px-5 py-5 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">
                          {item.subcategory?.name || "Unavailable"}
                        </p>
                      </td>
                      <td className="px-5 py-5 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">{currency}{item.price}</p>
                      </td>
                      <td className="px-5 py-5 bg-white text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => editProduct(item.productId)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeProduct(item._id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;