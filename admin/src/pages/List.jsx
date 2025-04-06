import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../WebSocketService';
import { assets } from '../assets/assets';


const ProductList = ({ token }) => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list');
      if (response.data.success) {
        setList(response.data.products);
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

  useEffect(() => {
    fetchList();

    // Define the handler for new products
    const handleNewProduct = (newProduct) => {
      setList((prevList) => [...prevList, newProduct.product]);
    };

    // Connect to WebSocket and listen for new products
    WebSocketService.connect(() => {
      WebSocketService.on('newProduct', handleNewProduct);
    });

    // Cleanup function to disconnect WebSocket and remove the listener
    return () => {
      WebSocketService.disconnect();
      WebSocketService.off('newProduct', handleNewProduct);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-8">
      <div className="py-8">
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
          <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
            {list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white">
                <img
                  src={assets.product_icon}
                  alt="Empty parcel"
                  className="w-32 h-32 opacity-50 mb-4"
                />
                <p className="text-xl text-gray-600 font-medium">No products to display</p>
              </div>
            ) : (
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold border-b-2 border-gray-200">
                    <th className="px-5 py-3 text-left">Image</th>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-left">Price</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, index) => (
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
                        <p className="text-gray-900 whitespace-no-wrap">{item.name}</p>
                      </td>
                      <td className="px-5 py-5 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">{item.category?.name ||
                          "Unavailable"}</p>
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