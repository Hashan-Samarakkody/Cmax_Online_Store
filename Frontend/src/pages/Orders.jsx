import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify'
import WebSocketService from '../services/WebSocketService';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const navigate = useNavigate();
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState('id'); // 'id', 'date', 'amount'
  const [selectedDate, setSelectedDate] = useState(null);

  // Filter states
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all'); // 'all', 'cash on delivery', 'stripe'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Order Placed', 'Picking', 'Out for Delivery', 'Delivered'
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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

  // Filter and search orders
  const filteredOrders = orderData.filter(order => {
    // Apply payment method filter
    if (filterPaymentMethod === 'Cash On Delivery' && order.paymentMethod !== 'Cash On Delivery') {
      return false;
    }
    if (filterPaymentMethod === 'stripe' && order.paymentMethod !== 'Stripe') {
      return false;
    }

    // Apply status filter
    if (filterStatus !== 'all' && order.status !== filterStatus) {
      return false;
    }

    // Apply search
    if (searchQuery.trim() === '' && !selectedDate) return true;

    if (searchBy === 'id') {
      const orderIdMatch = order.orderId && order.orderId.toLowerCase().includes(searchQuery.toLowerCase());
      return orderIdMatch;
    }

    if (searchBy === 'date' && selectedDate) {
      const orderDate = new Date(order.date);
      return (
        orderDate.getFullYear() === selectedDate.getFullYear() &&
        orderDate.getMonth() === selectedDate.getMonth() &&
        orderDate.getDate() === selectedDate.getDate()
      );
    }

    if (searchBy === 'amount') {
      const totalOrderPrice = order.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      // Check if the search query is a valid number
      const searchAmount = parseFloat(searchQuery);
      if (!isNaN(searchAmount)) {
        return totalOrderPrice === searchAmount || totalOrderPrice.toFixed(2) === searchQuery;
      }
      return false;
    }

    return true;
  });

  // Pagination logic
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDate(null);
    setFilterPaymentMethod('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  return (
    <div className='boarder-t pt-16 px-3 sm:px-4 md:px-6'>
      <div className='text-2xl'>
        <Title text1={'MY'} text2={'ORDERS'} />
        <p className='text-sm font-semibold'> Once you placed an order you will receive an order confirmation via email.</p>
        <p className='text-xs text-red-500 font-semibold'> * Please be kind enough to check your spam folder in case it does not appear in your inbox.</p>
      </div>
      <br />

      {/* Search and Filter Controls */}
      <div className='bg-gray-50 p-4 rounded-lg mb-4 shadow-sm'>
        <div className='flex flex-col lg:flex-row gap-4 mb-4'>
          {/* Search Section */}
          <div className='flex-1'>
            <h3 className='text-gray-700 font-medium mb-2'>Search Orders</h3>
            <div className='flex gap-3 mb-3'>
              <label className='flex items-center'>
                <input
                  type="radio"
                  name="searchBy"
                  value="id"
                  checked={searchBy === 'id'}
                  onChange={() => {
                    setSearchBy('id');
                    setSelectedDate(null);
                  }}
                  className="mr-1"
                />
                Order ID
              </label>
              <label className='flex items-center'>
                <input
                  type="radio"
                  name="searchBy"
                  value="date"
                  checked={searchBy === 'date'}
                  onChange={() => setSearchBy('date')}
                  className="mr-1"
                />
                Date
              </label>
              <label className='flex items-center'>
                <input
                  type="radio"
                  name="searchBy"
                  value="amount"
                  checked={searchBy === 'amount'}
                  onChange={() => {
                    setSearchBy('amount');
                    setSelectedDate(null);
                  }}
                  className="mr-1"
                />
                Amount
              </label>
            </div>

            {searchBy === 'date' ? (
              <div className='relative'>
                <div
                  className='flex items-center border p-2 rounded cursor-pointer bg-white'
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                >
                  <FaCalendarAlt className='text-gray-500 mr-2' />
                  <span>{selectedDate ? selectedDate.toDateString() : 'Select a date'}</span>
                </div>
                {datePickerOpen && (
                  <div className='absolute z-10'>
                    <DatePicker
                      selected={selectedDate}
                      onChange={date => {
                        setSelectedDate(date);
                        setDatePickerOpen(false);
                      }}
                      inline
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className='relative'>
                <input
                  type="text"
                  placeholder={searchBy === 'id' ? 'Search by order ID' : 'Enter amount (e.g. 99.99)'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full border p-2 pl-9 rounded'
                />
                <FaSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              </div>
            )}
          </div>

          {/* Filter Section */}
          <div className='lg:w-64'>
            <div className='mb-3'>
              <h3 className='text-gray-700 font-medium mb-2'>Filter by Payment</h3>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className='w-full border p-2 rounded'
              >
                <option value="all">All Payment Methods</option>
                <option value="Cash On Delivery">Cash on Delivery</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>

            <div>
              <h3 className='text-gray-700 font-medium mb-2'>Filter by Status</h3>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='w-full border p-2 rounded'
              >
                <option value="all">All Statuses</option>
                <option value="Order Placed">Order Placed</option>
                <option value="Picking">Picking</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display per page options and Reset Filters */}
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <label className='text-sm text-gray-600'>Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
              className='border rounded p-1 text-sm'
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={300}>300</option>
            </select>
          </div>

          <div>
            <button
              onClick={resetFilters}
              className='text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded'
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Active filters display */}
        <div className='mt-3 flex flex-wrap gap-2'>
          {filterStatus !== 'all' && (
            <div className='bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center'>
              Status: {filterStatus}
              <button
                className='ml-1 text-blue-600 hover:text-blue-800'
                onClick={() => setFilterStatus('all')}
              >
                ✕
              </button>
            </div>
          )}
          {filterPaymentMethod !== 'all' && (
            <div className='bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center'>
              Payment: {filterPaymentMethod === 'Cash On Delivery' ? 'Cash on Delivery' : 'Stripe'}
              <button
                className='ml-1 text-green-600 hover:text-green-800'
                onClick={() => setFilterPaymentMethod('all')}
              >
                ✕
              </button>
            </div>
          )}
          {searchQuery && (
            <div className='bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center'>
              {searchBy === 'id' ? 'ID' : 'Amount'}: {searchQuery}
              <button
                className='ml-1 text-purple-600 hover:text-purple-800'
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            </div>
          )}
          {selectedDate && (
            <div className='bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center'>
              Date: {selectedDate.toDateString()}
              <button
                className='ml-1 text-yellow-600 hover:text-yellow-800'
                onClick={() => setSelectedDate(null)}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

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
        ) : currentOrders.length === 0 ? (
          <div className='flex flex-col justify-center items-center h-[30vh]'>
            <img
              className='w-32 sm:w-40 opacity-50'
              src={assets.empty_order}
              alt='No Results'
            />
            <p className='text-gray-400 font-medium text-xl mt-4 text-center'>No orders match your filters</p>
            <button
              onClick={resetFilters}
              className='mt-3 text-blue-600 hover:text-blue-800 underline'
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {currentOrders.map((order) => {
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
                        <div className={`w-2.5 h-2.5 rounded-full ${order.status === 'Delivered' ? 'bg-blue-500' :
                          order.status === 'Out for Delivery' ? 'bg-purple-500' :
                            order.status === 'Picking' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
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
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className='flex justify-center mt-6'>
                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'
                      }`}
                  >
                    First
                  </button>

                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'
                      }`}
                  >
                    Prev
                  </button>

                  <div className='flex gap-1 mx-1'>
                    {[...Array(totalPages)].map((_, index) => {
                      // Display limited page numbers with ellipsis for better UX
                      const pageNumber = index + 1;

                      // Always show first, last, and pages around current
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`w-8 h-8 flex items-center justify-center border rounded ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                              }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        (pageNumber === 2 && currentPage > 3) ||
                        (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        // Display ellipsis when needed
                        return <span key={pageNumber} className="px-1">...</span>;
                      }

                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'
                      }`}
                  >
                    Next
                  </button>

                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'
                      }`}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}

            <p className='text-center text-gray-600 text-sm mt-2'>
              Showing {indexOfFirstOrder + 1}-
              {indexOfLastOrder > filteredOrders.length ? filteredOrders.length : indexOfLastOrder}
              of {filteredOrders.length} orders
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default Orders;