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
        let allOrdersItems = []
        response.data.orders.map((order) => {
          order.items.map((item) => {
            item['status'] = order.status
            item['payment'] = order.payment
            item['paymentMethod'] = order.paymentMethod
            item['date'] = order.date
            item['trackingId'] = order.trackingId
            item['orderId'] = order._id
            item['orderDisplayId'] = order.orderId
            allOrdersItems.push(item)
          })
        })
        setOrderData(allOrdersItems.reverse())
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Track order function
  const trackOrder = (item) => {
    if (item.status === 'Delivered' && item.trackingId) {
      // Open tracking website in a new tab
      window.open(`https://koombiyodelivery.lk/Track/track_id`, '_blank');
    } else {
      // For non-delivered items or without tracking, just refresh
      loadOrderData();
      toast.info(`Order status: ${item.status}`);
    }
  }

  useEffect(() => {
    // Initial load of orders
    loadOrderData()

    // Connect to WebSocket if authenticated
    if (token) {
      // Connect to WebSocket
      WebSocketService.connect(() => {
        console.log('WebSocket connected in Orders component')
      })

      // Register callback for new orders
      const handleNewOrder = (data) => {
        console.log('New order received via WebSocket:', data)
        // Reload orders when a new one arrives
        loadOrderData()
        toast.info('New order has been added!')
      }

      // Handle order status updates
      const handleStatusUpdate = (data) => {
        console.log('Order status update received:', data);
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
          orderData.map((item, index) => {
            // Get additional details
            const itemDetails = renderItemDetails(item);
            const isDelivered = item.status === 'Delivered';

            return (
              <div key={index} className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <div className='flex items-start gap-3 sm:gap-6 text-sm'>
                  <img className='w-16 sm:w-20 rounded-lg object-cover' src={item.images[0]} alt="" />
                  <div>
                    <p className='sm:text-base font-bold line-clamp-2 sm:line-clamp-none'>Item Name: {item.name}</p>
                    <div className='flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 mt-1 text-sm sm:text-base text-gray-700'>
                      <p className='font-semibold text-gray-500'>{currency}{item.price}</p>
                      <p className='font-semibold text-gray-500'>Quantity: {item.quantity}</p>
                    </div>
                    {itemDetails && (
                      <p className='font-semibold text-gray-500 text-sm sm:text-base'>{itemDetails}</p>
                    )}
                    <p className='mt-1 font-medium text-sm sm:text-base'>Date: <span className='text-gray-500'>{new Date(item.date).toDateString()}</span></p>
                    <p className='mt-1 font-medium text-sm sm:text-base'>Payment Method: <span className='text-gray-500'>{item.paymentMethod}</span></p>
                    <p className='mt-1 text-green-600 font-semibold text-sm sm:text-base'>Order ID: {item.orderDisplayId || "N/A"}</p>
                    {item.trackingId && isDelivered && (
                      <p className='mt-1 font-semibold text-blue-600 text-sm sm:text-base'>
                        Tracking ID: {item.trackingId}
                      </p>
                    )}
                  </div>
                </div>
                <div className='md:w-1/2 flex flex-wrap sm:flex-nowrap justify-between mt-3 md:mt-0 gap-3'>
                  <div className='flex items-center gap-2 w-full md:w-auto'>
                    <div className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <p className='text-sm md:text-base'>{item.status}</p>
                  </div>
                  <div className='flex flex-wrap gap-2 w-full md:w-auto'>
                    <button
                      onClick={() => trackOrder(item)}
                      className={`border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium 
                        ${isDelivered && item.trackingId
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                          : 'bg-green-600 text-white hover:bg-green-700 hover:text-white'} 
                        transition-all duration-200 rounded-sm w-full sm:w-auto`}
                    >
                      {isDelivered && item.trackingId ? 'Track Package' : 'Track Order'}
                    </button>

                    {isReturnEligible(item) && isDelivered && item.trackingId && (
                      <button
                        onClick={() => navigate('/returns')}
                        className="border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-200 rounded-sm w-full sm:w-auto"
                      >
                        Return Item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Orders;