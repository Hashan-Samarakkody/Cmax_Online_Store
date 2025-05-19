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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedList, setPaginatedList] = useState([]);

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setPaginatedList(filteredList.slice(indexOfFirstItem, indexOfLastItem));
  }, [filteredList, currentPage, itemsPerPage]);

  // Reset to first page when search results change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredList]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };


  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list');
      if (response.data.success) {
        // Process products to determine effective visibility
        const products = response.data.products.map(product => ({
          ...product,
          effectivelyVisible:
            product.isVisible &&
            product.category?.isVisible !== false &&
            product.subcategory?.isVisible !== false
        }));

        setList(products);
        setFilteredList(products);
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

  const toggleVisibility = async (id, isCurrentlyVisible) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/product/toggle-visibility`,
        {
          productId: id,
          isVisible: !isCurrentlyVisible
        },
        {
          headers: { token }
        }
      );

      if (response.data.success) {
        toast.success(`Product ${!isCurrentlyVisible ? 'visible' : 'hidden'} successfully`, { autoClose: 1000 });

        // Update the local state to reflect the change
        setList(prevList =>
          prevList.map(product =>
            product._id === id
              ? { ...product, isVisible: !isCurrentlyVisible }
              : product
          )
        );

        setFilteredList(prevList =>
          prevList.map(product =>
            product._id === id
              ? { ...product, isVisible: !isCurrentlyVisible }
              : product
          )
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
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

    // Add a new criteria object with all values set to false
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
      if (!newProduct || !newProduct.product || !newProduct.product._id) return;

      setList((prevList) => {
        // Check if product with this ID already exists
        if (prevList.some(item => item._id === newProduct.product._id)) {
          return prevList;
        }
        return [...prevList, newProduct.product];
      });

      setFilteredList((prevList) => {
        if (prevList.some(item => item._id === newProduct.product._id)) {
          return prevList;
        }
        return [...prevList, newProduct.product];
      });
    };

    // Define handler for deleted products
    const handleDeleteProduct = (data) => {
      setList((prevList) => prevList.filter(item => item._id !== data.productId));
      setFilteredList((prevList) => prevList.filter(item => item._id !== data.productId));
    };

    // Define handler for updated products
    const handleUpdateProduct = (data) => {
      if (!data || !data.product || !data.product._id) return;

      setList((prevList) => prevList.map(item =>
        item._id === data.product._id ? data.product : item
      ));

      setFilteredList((prevList) => prevList.map(item =>
        item._id === data.product._id ? data.product : item
      ));
    };

    // Define handler for product visibility changes
    const handleProductVisibilityChanged = (data) => {
      if (!data || !data.productId) {
        setList(prevList =>
          prevList.map(product =>
            product._id === data.productId
              ? { ...product, isVisible: data.isVisible }
              : product
          )
        );

        setFilteredList(prevList =>
          prevList.map(product =>
            product._id === data.productId
              ? { ...product, isVisible: data.isVisible }
              : product
          )
        );
      }
    };

    // Connect to WebSocket and listen for product events
    WebSocketService.connect(() => {
      WebSocketService.on('newProduct', handleNewProduct);
      WebSocketService.on('deleteProduct', handleDeleteProduct);
      WebSocketService.on('updateProduct', handleUpdateProduct);
      WebSocketService.on('productVisibilityChanged', handleProductVisibilityChanged);
    });

    // Cleanup function to disconnect WebSocket and remove the listeners
    return () => {
      WebSocketService.disconnect();
      WebSocketService.off('newProduct', handleNewProduct);
      WebSocketService.off('deleteProduct', handleDeleteProduct);
      WebSocketService.off('updateProduct', handleUpdateProduct);
      WebSocketService.off('productVisibilityChanged', handleProductVisibilityChanged);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-8">

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Item List</h1>
      </div>

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

        {/* Pagination controls - top */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <label htmlFor="itemsPerPage" className="mr-2 text-sm font-medium text-gray-700">
              Show:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={300}>300</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredList.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} products
          </div>
        </div>

        {filteredList.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-500 hover:bg-blue-50'}`}
            >
              Previous
            </button>

            <div className="flex items-center">
              {/* Display page numbers */}
              {Array.from({ length: Math.min(5, Math.ceil(filteredList.length / itemsPerPage)) }, (_, i) => {
                // Ensure  show the correct page numbers around the current page
                let pageNum;
                const totalPages = Math.ceil(filteredList.length / itemsPerPage);

                if (totalPages <= 5) {
                  // If total pages are 5 or less, show all pages
                  pageNum = i + 1;
                } else {

                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`mx-1 px-4 py-2 border rounded ${currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-blue-500 hover:bg-blue-50'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Show ellipsis and last page if there are many pages */}
              {Math.ceil(filteredList.length / itemsPerPage) > 5 && (
                <>
                  <span className="mx-1">...</span>
                  <button
                    onClick={() => paginate(Math.ceil(filteredList.length / itemsPerPage))}
                    className={`mx-1 px-4 py-2 border rounded ${currentPage === Math.ceil(filteredList.length / itemsPerPage)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-blue-500 hover:bg-blue-50'
                      }`}
                  >
                    {Math.ceil(filteredList.length / itemsPerPage)}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredList.length / itemsPerPage)}
              className={`px-4 py-2 border rounded ${currentPage === Math.ceil(filteredList.length / itemsPerPage)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-500 hover:bg-blue-50'
                }`}
            >
              Next
            </button>
          </div>
        )}

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
                    <th className="px-5 py-3 text-center">Status</th>
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
                        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full 
                          ${item.isVisible !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'}`}
                        >
                          {item.isVisible !== false ? 'Visible' : 'Hidden'}
                        </span>
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
                            onClick={() => toggleVisibility(item._id, item.isVisible !== false)}
                            className={`px-4 py-2 rounded-md transition duration-300 ease-in-out transform hover:scale-105 
                              ${item.isVisible !== false
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-green-500 text-white hover:bg-green-600'}`}
                          >
                            {item.isVisible !== false ? 'Hide' : 'Show'}
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