import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify'
import WebSocketService from '../services/WebSocketService';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([])
  const navigate = useNavigate();
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const toggleOrderExpand = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const isReturnEligible = (item) => {
    if (item.status !== 'Delivered') return false;

    // Check if within 7 days
    const orderDate = new Date(item.date);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
    return daysDifference <= 7;
  };

  const loadOrderData = async () => {
    try {
      if (!token) {
        return null
      }
      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } })
      if (response.data.success) {
        // Store grouped orders instead of individual items
        setOrderData(response.data.orders.reverse())
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Track order function
  const trackOrder = (order) => {
    if (order.status === 'Delivered' && order.trackingId) {
      // Open tracking website in a new tab
      window.open(`https://koombiyodelivery.lk/Track/track_id`, '_blank');
    } else {
      // For non-delivered items or without tracking, just refresh
      loadOrderData();
      toast.info(`Order status: ${order.status}`);
    }
  }

  useEffect(() => {
    // Initial load of orders
    loadOrderData()

    // Connect to WebSocket if authenticated
    if (token) {
      // Connect to WebSocket
      WebSocketService.connect(() => {
        console.log("WebSocket connected");
      })

      // Register callback for new orders
      const handleNewOrder = (data) => {
        // Reload orders when a new one arrives
        loadOrderData()
        toast.info('New order has been added!')
      }

      // Handle order status updates
      const handleStatusUpdate = (data) => {
        // Only update if this update is for the current user
        loadOrderData();
        toast.info(`Order status updated: ${data.status}`);
      }

      // Subscribe to events
      WebSocketService.on('newOrder', handleNewOrder)
      WebSocketService.on('orderStatusUpdate', handleStatusUpdate)

      // Cleanup on unmount
      return () => {
        WebSocketService.off('newOrder', handleNewOrder)
        WebSocketService.off('orderStatusUpdate', handleStatusUpdate)
      }
    }
  }, [token])


  // Helper function to render additional details
  const renderItemDetails = (item) => {
    const itemDetails = [];

    // Check if both size and color are valid
    if (item.size && item.color && item.size !== 'undefined_undefined' && item.color !== 'undefined_undefined') {
      return `Size: ${item.size} | Color: ${item.color}`;
    }

    // If size is valid and not 'undefined'
    if (item.size && item.size !== 'undefined_undefined' && item.size !== 'undefined') {
      if (item.size.includes('_')) {
        const [sizePart, colorPart] = item.size.split('_');

        // If both size and color are valid (i.e., not 'undefined')
        if (sizePart !== 'undefined' && colorPart !== 'undefined') {
          return `Size: ${sizePart}  Color: ${colorPart}`;
        } else if (sizePart !== 'undefined') {
          return `Size: ${sizePart}`;
        } else if (colorPart !== 'undefined') {
          return `Color: ${colorPart}`;
        }
      }
    }

    // If only color is valid and not 'undefined'
    if (item.color && item.color !== 'undefined_undefined' && item.color !== 'undefined') {
      return `Color: ${item.color}`;
    }
  }

  return (
    <div className='boarder-t pt-16 px-3 sm:px-4 md:px-6'>
      <div className='text-2xl'>
        <Title text1={'MY'} text2={'ORDERS'} />
        <p className='text-sm font-semibold'> Once you placed an order you will receive an order confirmation via email.</p>
        <p className='text-xs text-red-500 font-semibold'> * Please be kind enough to check your spam folder in case it does not appear in your inbox.</p>
      </div>
      <br />
      <div>
        {orderData.length === 0 ? (
          <div className='flex flex-col justify-center items-center h-[50vh]'>
            <img
              className='w-40 sm:w-60 animate-pulse'
              src={assets.empty_order}
              alt='Empty Cart'
            />
            <p className='text-gray-400 font-semibold text-2xl sm:text-4xl mt-4 animate-pulse text-center'>No orders to display!</p>
          </div>
        ) : (
          orderData.map((order) => {
            const isDelivered = order.status === 'Delivered';
            const isExpanded = expandedOrderId === order._id;

            // Calculate total order price
            const totalOrderPrice = order.items.reduce((total, item) => {
              return total + (item.price * item.quantity);
            }, 0);

            return (
              <div key={order._id} className='my-4 border rounded-lg shadow-sm overflow-hidden'>
                {/* Order Summary (Always Visible) */}
                <div
                  className='p-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 cursor-pointer'
                  onClick={() => toggleOrderExpand(order._id)}
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <div className={`w-2.5 h-2.5 rounded-full ${isDelivered ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      <p className='font-semibold text-lg'>{order.status}</p>
                    </div>
                    <p className='text-gray-700'>Order ID: <span className='font-medium'>{order.orderId || "N/A"}</span></p>
                    <p className='text-gray-700'>Date: <span className='font-medium'>{new Date(order.date).toDateString()}</span></p>
                    <p className='text-gray-700'>Payment Method: <span className='font-medium'>{order.paymentMethod}</span></p>
                    <p className='font-semibold text-green-700'>{currency}{totalOrderPrice.toFixed(2)}</p>
                    {order.trackingId && isDelivered && (
                      <p className='mt-1 font-semibold text-blue-600 text-sm'>
                        Tracking ID: {order.trackingId}
                      </p>
                    )}
                  </div>
                  <div className='mt-4 md:mt-0 flex flex-col gap-2 min-w-fit'>
                    <div className='flex gap-2'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          trackOrder(order);
                        }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-sm 
                          ${isDelivered && order.trackingId
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {isDelivered && order.trackingId ? 'Track Package' : 'Track Order'}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrderExpand(order._id);
                        }}
                        className="px-3 py-1.5 text-sm font-medium bg-gray-200 hover:bg-gray-300 rounded-sm"
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>

                    {/* Return eligibility check for the whole order */}
                    {isDelivered && order.trackingId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/returns', { state: { orderId: order._id } });
                        }}
                        className="px-3 py-1.5 text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 rounded-sm"
                      >
                        Return Items
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Order Items */}
                {isExpanded && (
                  <div className='bg-white border-t'>
                    <div className='p-4'>
                      <h3 className='font-medium text-gray-800 mb-2'>Order Items ({order.items.length})</h3>
                      <div className='space-y-4'>
                        {order.items.map((item, itemIndex) => {
                          // Get additional details
                          const itemDetails = renderItemDetails(item);

                          return (
                            <div key={itemIndex} className='flex gap-4 pb-4 border-b last:border-b-0'>
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className='w-16 h-16 object-cover rounded-md'
                              />
                              <div className='flex-1'>
                                <p className='font-medium line-clamp-2'>{item.name}</p>
                                {itemDetails && (
                                  <p className='text-sm text-gray-600'>{itemDetails}</p>
                                )}
                                <div className='flex flex-wrap gap-4 mt-1 text-sm text-gray-700'>
                                  <p>Unit Price: <span className='font-medium'>{currency}{item.price}</span></p>
                                  <p>Quantity: <span className='font-medium'>{item.quantity}</span></p>
                                  <p>Total: <span className='font-medium'>{currency}{(item.price * item.quantity).toFixed(2)}</span></p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}

export default Orders;