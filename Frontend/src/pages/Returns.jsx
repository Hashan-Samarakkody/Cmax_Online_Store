import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FaImage, FaVideo, FaFileUpload, FaTrash } from 'react-icons/fa';
import WebSocketService from '../services/WebSocketService';

const ReturnRestrictionInfo = () => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-xl text-blue-800 font-medium">Return Request Limits</p>
          <ul className="mt-1 text-lg text-blue-700 list-disc list-inside">
            <li>Maximum of 4 return requests per order per day</li>
            <li>6-hour waiting period between return requests for the same order</li>
            <li>Only delivered orders with tracking IDs within 7 days are eligible</li>
            <li>The delivery charge is non-refundable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Returns = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [itemsToReturn, setItemsToReturn] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (token) {
      // Fetch returns first, then orders
      const loadData = async () => {
        await fetchReturns();
        await fetchOrders();
      };

      loadData();

      // Setup WebSocket connection for real-time updates
      const handleReturnStatusUpdate = (data) => {
        // Check if this update is for one of this user's returns
        if (returns.some(ret => ret._id === data.return._id)) {
          toast.info(`Return #${data.return.returnId} status updated to ${data.return.status}`);
          fetchReturns(); // Refresh the return data
        }
      };

      WebSocketService.connect(() => {
        WebSocketService.on('returnStatusUpdate', handleReturnStatusUpdate);
      });

      return () => {
        WebSocketService.off('returnStatusUpdate', handleReturnStatusUpdate);
      };
    }
  }, [token, returns]);

  const fetchOrders = async () => {
    try {
      const response = await axios.post(`${backendUrl}/api/order/userorders`, {}, {
        headers: { token }
      });

      if (response.data.success) {
        // Get all delivered orders with tracking IDs
        const deliveredOrders = response.data.orders.filter(order =>
          order.status === 'Delivered' && order.trackingId
        );

        // Add eligibility information to each order
        const ordersWithEligibility = deliveredOrders.map(order => {
          const orderDate = new Date(order.date);
          const currentDate = new Date();
          const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

          // Check if this order has return requests
          const orderReturns = returns.filter(r => r.originalOrderId === order.orderId);

          // Check daily limit (max 4 per day)
          const today = new Date().setHours(0, 0, 0, 0);
          const todayRequests = orderReturns.filter(r => {
            const requestDate = new Date(r.requestedDate).setHours(0, 0, 0, 0);
            return requestDate === today;
          }).length;

          // Check 6-hour cooldown
          const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
          const hasRecentRequest = orderReturns.some(r => r.requestedDate > sixHoursAgo);

          // Get the most recent request time
          const mostRecentRequest = orderReturns.length > 0 ?
            Math.max(...orderReturns.map(r => r.requestedDate)) : null;

          // Calculate when the order will become eligible again
          const nextEligibleTime = mostRecentRequest ?
            new Date(mostRecentRequest + (6 * 60 * 60 * 1000)) : null;

          return {
            ...order,
            isEligible: daysDifference <= 7 && !hasRecentRequest && todayRequests < 4,
            ineligibilityReason: daysDifference > 7
              ? "Order is more than 7 days old"
              : hasRecentRequest
                ? `Cooldown period: Available after ${nextEligibleTime?.toLocaleTimeString()}`
                : todayRequests >= 4
                  ? "Daily limit reached (4 returns per day)"
                  : null,
            nextEligibleTime
          };
        });

        // Sort orders - eligible ones first
        ordersWithEligibility.sort((a, b) => {
          if (a.isEligible && !b.isEligible) return -1;
          if (!a.isEligible && b.isEligible) return 1;
          return new Date(b.date) - new Date(a.date); // Most recent first
        });

        setOrders(ordersWithEligibility);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    }
  };
  const fetchReturns = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/returns/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReturns(response.data.returns);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to load return history');
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setItemsToReturn([]);
    setMediaFiles([]);
  };

  const handleItemSelect = (item) => {
    const existingItemIndex = itemsToReturn.findIndex(
      i => i.productId === item.productId && i.size === item.size && i.color === item.color
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...itemsToReturn];
      updatedItems.splice(existingItemIndex, 1);
      setItemsToReturn(updatedItems);
    } else {
      setItemsToReturn([
        ...itemsToReturn,
        {
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          reason: '',
          condition: 'Unused'
        }
      ]);
    }
  };

  const updateItemReturn = (productId, size, color, field, value) => {
    setItemsToReturn(prev =>
      prev.map(item =>
        (item.productId === productId && item.size === size && item.color === color)
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Filter files by type
    const images = files.filter(file => file.type.startsWith('image/'));
    const videos = files.filter(file => file.type.startsWith('video/'));

    // Check current counts
    const currentImages = mediaFiles.filter(file => file.type.startsWith('image/'));
    const currentVideos = mediaFiles.filter(file => file.type.startsWith('video/'));

    // Validate image count
    if (currentImages.length + images.length > 4) {
      toast.error('Maximum 4 images are allowed');
      return;
    }

    // Validate video count
    if (currentVideos.length + videos.length > 2) {
      toast.error('Maximum 2 videos are allowed');
      return;
    }

    // Validate image sizes
    const oversizedImages = images.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedImages.length > 0) {
      toast.error('Each image must be less than 5MB');
      return;
    }

    // Validate video sizes
    const oversizedVideos = videos.filter(file => file.size > 20 * 1024 * 1024);
    if (oversizedVideos.length > 0) {
      toast.error('Each video must be less than 20MB');
      return;
    }

    // Add new files to existing files
    setMediaFiles([...mediaFiles, ...files]);
  };

  const removeFile = (index) => {
    const newFiles = [...mediaFiles];
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);
  };

  const submitReturn = async () => {
    try {
      // Validate all items have reasons
      const invalidItem = itemsToReturn.find(item => !item.reason);
      if (invalidItem) {
        toast.error(`Please provide a reason for returning ${invalidItem.name}`);
        return;
      }

      if (itemsToReturn.length === 0) {
        toast.error('Please select at least one item to return');
        return;
      }

      setIsUploading(true);

      // Create form data
      const formData = new FormData();

      // Add items as JSON
      formData.append('orderId', selectedOrder.orderId);
      formData.append('items', JSON.stringify(itemsToReturn));

      // Add media files
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await axios.post(
        `${backendUrl}/api/returns/request`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Return request submitted successfully');
        // Reset form and refresh data
        setSelectedOrder(null);
        setItemsToReturn([]);
        setMediaFiles([]);
        await fetchReturns();  // Fetch returns first
        await fetchOrders();   // Then refresh orders with updated eligibility
      }
    } catch (error) {
      console.error('Error submitting return:', error);
      toast.error(error.response?.data?.message || 'Failed to submit return request');
    } finally {
      setIsUploading(false);
    }
  };

  const isItemSelected = (item) => {
    return itemsToReturn.some(
      i => i.productId === item.productId && i.size === item.size && i.color === item.color
    );
  };

  const getReturnStatusClass = (status) => {
    switch (status) {
      case 'Requested': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'In Transit': return 'bg-purple-100 text-purple-800';
      case 'Received': return 'bg-indigo-100 text-indigo-800';
      case 'Inspected': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  const renderMediaPreview = () => {
    const imageCount = mediaFiles.filter(file => file.type.startsWith('image/')).length;
    const videoCount = mediaFiles.filter(file => file.type.startsWith('video/')).length;

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Media Attachments ({mediaFiles.length}/6)</h3>
          <div className="text-sm text-gray-500">
            {imageCount}/4 images, {videoCount}/2 videos
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {mediaFiles.map((file, index) => (
            <div key={index} className="relative border rounded-lg overflow-hidden">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <video
                  src={URL.createObjectURL(file)}
                  className="w-full h-32 object-cover"
                  controls
                />
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
              >
                <FaTrash size={12} />
              </button>
              <div className="p-1 bg-gray-100 text-xs truncate">
                {file.name}
              </div>
            </div>
          ))}

          {mediaFiles.length < 6 && (
            <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <FaFileUpload className="text-gray-400 mb-2" size={24} />
              <span className="text-sm text-gray-500">Add Media</span>
            </label>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-500">
          <p>• Maximum 4 images (up to 5MB each)</p>
          <p>• Maximum 2 videos (up to 20MB each)</p>
        </div>
      </div>
    );
  };

  const renderReturnDetails = (returnItem) => {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Return #{returnItem.returnId}</h3>

        <p className="text-sm mb-2">
          <span className="font-medium">Status: </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getReturnStatusClass(returnItem.status)}`}>
            {returnItem.status}
          </span>
        </p>

        <p className="text-sm mb-1">
          <span className="font-medium">Requested Date: </span>
          {format(new Date(returnItem.requestedDate), 'dd MMM yyyy')}
        </p>

        <p className="text-sm mb-3">
          <span className="font-medium">Refund Amount: </span>
          Rs. {returnItem.refundAmount}
        </p>

        {returnItem.media && returnItem.media.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Media Attachments</h4>
            <div className="grid grid-cols-3 gap-2">
              {returnItem.media.map((media, index) => (
                <div key={index} className="border rounded overflow-hidden">
                  {media.type === 'image' ? (
                    <a href={media.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={media.url}
                        alt={`Return media ${index}`}
                        className="w-full h-24 object-cover"
                      />
                    </a>
                  ) : (
                    <video
                      src={media.url}
                      className="w-full h-24 object-cover"
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-16 pb-10">
      <div className="text-2xl mb-8">
        <Title text1={'RETURN'} text2={'REQUEST'} />
      </div>

      {/* Return History */}
      {returns.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Return History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {returns.map(returnItem => (
              <div key={returnItem._id} className="border rounded-lg p-4 hover:shadow-md">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{returnItem.returnId}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(returnItem.requestedDate), 'dd MMM yyyy, h:mm a')}
                    </p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getReturnStatusClass(returnItem.status)}`}>
                      {returnItem.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center mt-2">
                  <div>
                    <p className="text-sm">{returnItem.items.length} items</p>
                    <p className="text-sm font-medium">Rs. {returnItem.refundAmount}</p>
                  </div>

                  {returnItem.media && returnItem.media.length > 0 && (
                    <div className="ml-auto flex">
                      {returnItem.media.some(m => m.type === 'image') && (
                        <div className="mr-2 text-green-600">
                          <FaImage />
                        </div>
                      )}
                      {returnItem.media.some(m => m.type === 'video') && (
                        <div className="text-blue-600">
                          <FaVideo />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {renderReturnDetails(returnItem)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start New Return */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Start a New Return</h2>

        <ReturnRestrictionInfo />

        {/* Step 1: Select Order */}
        {!selectedOrder ? (
          <div>
            <p className="mb-4">Select an eligible order to return items from:</p>
            {orders.length === 0 ? (
              <p className="text-gray-500">No eligible orders found. Only delivered orders with tracking IDs within 7 days are eligible for return.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map(order => (
                  <div
                    key={order._id}
                    className={`border p-4 rounded ${order.isEligible
                        ? "cursor-pointer hover:bg-gray-50 transition duration-200"
                        : "opacity-70 bg-yellow-100"
                      }`}
                    onClick={() => order.isEligible && handleOrderSelect(order)}
                  >
                    <div className="flex items-start">
                      {/* Display product images as thumbnails */}
                      <div className="flex-shrink-0 mr-4">
                        <div className="flex space-x-1">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <img
                              key={idx}
                              src={item.images && item.images[0]}
                              alt={item.name}
                              className="w-25 h-25 object-cover rounded"
                            />
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order details */}
                      <div className="flex-grow">
                        <h2 className="font-semibold">Order ID: {order.orderId}</h2>
                        <p>Date: {format(new Date(order.date), 'dd MMM yyyy, h:mm a')}</p>
                        <p>Items: {order.items.length}</p>
                        <p>Total: Rs. {order.amount}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Tracking ID:</span> {order.trackingId}
                        </p>

                        {/* Show reason why not eligible */}
                        {!order.isEligible && (
                          <p className="mt-2 text-xs text-red-600 font-bold">
                            {order.ineligibilityReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Order #{selectedOrder.orderId}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back to Orders
              </button>
            </div>

            {/* Step 2: Select Items */}
            <p className="font-medium mb-2">Select items to return:</p>
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedOrder.items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No items found in this order
                      </td>
                    </tr>
                  ) : (
                    selectedOrder.items.map((item, index) => (
                      <tr key={index} className={`hover:bg-gray-50 ${isItemSelected(item) ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.images && item.images[0] && (
                              <img src={item.images[0]} alt={item.name} className="w-12 h-12 object-cover mr-4" />
                            )}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.size && item.size !== 'undefined' && <span>Size: {item.size} </span>}
                          {item.color && item.color !== 'undefined' && <span>Color: {item.color}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">Rs. {item.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleItemSelect(item)}
                            className={`px-3 py-1 rounded text-sm font-medium ${isItemSelected(item)
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }`}
                          >
                            {isItemSelected(item) ? 'Deselect' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Step 3: Provide Return Details */}
            {itemsToReturn.length > 0 && (
              <div>
                <p className="font-medium mb-2">Provide return details:</p>
                <div className="space-y-4">
                  {itemsToReturn.map((item, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <p className="font-medium">{item.name}</p>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for return:
                        </label>
                        <select
                          value={item.reason}
                          onChange={(e) => updateItemReturn(item.productId, item.size, item.color, 'reason', e.target.value)}
                          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select a reason</option>
                          <option value="Wrong size">Wrong size</option>
                          <option value="Wrong color">Wrong color</option>
                          <option value="Defective product">Defective product</option>
                          <option value="Not as described">Not as described</option>
                          <option value="Received wrong item">Received wrong item</option>
                          <option value="Changed mind">Changed mind</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product condition:
                        </label>
                        <select
                          value={item.condition}
                          onChange={(e) => updateItemReturn(item.productId, item.size, item.color, 'condition', e.target.value)}
                          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Unused">Unused with tags</option>
                          <option value="Used">Used/worn</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload media section */}
                {renderMediaPreview()}

                <div className="mt-8">
                  <button
                    onClick={submitReturn}
                    disabled={isUploading}
                    className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md flex items-center ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      'Submit Return Request'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Returns;