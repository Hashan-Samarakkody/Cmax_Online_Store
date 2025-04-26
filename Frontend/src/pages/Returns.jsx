import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Returns = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [itemsToReturn, setItemsToReturn] = useState([]);

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchReturns();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      const response = await axios.post(`${backendUrl}/api/order/userorders`, {}, {
        headers: { token }
      });

      if (response.data.success) {
        // Only show orders that are delivered and within 7 days
        const eligibleOrders = response.data.orders.filter(order => {
          if (order.status !== 'Delivered') return false;

          const orderDate = new Date(order.date);
          const currentDate = new Date();
          const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
          return daysDifference <= 7;
        });

        setOrders(eligibleOrders);
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

      // Format return items to match the backend expectations
      const formattedItems = itemsToReturn.map(item => {
        // Find the matching original item
        const originalItem = selectedOrder.items.find(
          oi => oi.productId === item.productId && oi.size === item.size && oi.color === item.color
        );

        if (!originalItem) {
          throw new Error(`Could not find original item data for ${item.name}`);
        }

        return {
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: originalItem.price,
          size: item.size || undefined,
          color: item.color || undefined,
          reason: item.reason,
          condition: item.condition
        };
      });

      const response = await axios.post(`${backendUrl}/api/returns/request`, {
        orderId: selectedOrder.orderId,
        items: formattedItems,
        reason: "Customer return" // Adding a general reason for the return
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Return request submitted successfully');
        // Reset form and refresh data
        setSelectedOrder(null);
        setItemsToReturn([]);
        fetchReturns();
      }
    } catch (error) {
      console.error('Error submitting return:', error);
      toast.error(error.response?.data?.message || 'Failed to submit return request');
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

  return (
    <div className="pt-16 pb-10">
      <div className="text-2xl mb-8">
        <Title text1={'RETURN'} text2={'REQUEST'} />
      </div>

      {/* Return History */}
      {returns.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Return History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Return ID</th>
                  <th className="px-4 py-2 border-b">Date</th>
                  <th className="px-4 py-2 border-b">Items</th>
                  <th className="px-4 py-2 border-b">Refund Amount</th>
                  <th className="px-4 py-2 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {returns.map(returnItem => (
                  <tr key={returnItem._id}>
                    <td className="px-4 py-2 border-b">{returnItem.returnId}</td> 
                    <td className="px-4 py-2 border-b">{format(new Date(returnItem.requestedDate), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-2 border-b">{returnItem.items.length} items</td>
                    <td className="px-4 py-2 border-b">Rs. {returnItem.refundAmount}</td>
                    <td className="px-4 py-2 border-b">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getReturnStatusClass(returnItem.status)}`}>
                        {returnItem.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Start New Return */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Start a New Return</h2>

        {/* Step 1: Select Order */}
        {!selectedOrder ? (
          <div>
            <p className="mb-4">Select an eligible order to return items from:</p>
            {orders.length === 0 ? (
              <p className="text-gray-500">No eligible orders found. Only delivered orders within 7 days are eligible for return.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map(order => (
                  <div
                    key={order._id}
                    className="border p-4 rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => handleOrderSelect(order)}
                  >
                    <p className="font-semibold">Order ID: {order.orderId}</p>
                    <p>Date: {format(new Date(order.date), 'dd MMM yyyy')}</p>
                    <p>Items: {order.items.length}</p>
                    <p>Total: Rs. {order.amount}</p>
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

                <div className="mt-8">
                  <button
                    onClick={submitReturn}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md"
                  >
                    Submit Return Request
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