import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import WebSocketService from '../services/WebSocketService';

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingInputs, setTrackingInputs] = useState({});
  const [searchCriteria, setSearchCriteria] = useState({
    orderId: true,
    customerName: false,
    price: false,
    productDetails: false,
    date: false // Add date search criteria
  });
  const [statusFilter, setStatusFilter] = useState('All');
  // Add date range states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedOrders, setDisplayedOrders] = useState([]);

  const fetchAllOrders = async () => {
    if (!token) {
      return null;
    }

    try {
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } });
      if (response.data.success) {
        // Reverse the order of orders so the newest comes at the top
        const ordersData = response.data.orders.reverse();
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Update pagination and displayed orders whenever filteredOrders or pagination settings change
  useEffect(() => {
    const totalItems = filteredOrders.length;
    const pages = Math.ceil(totalItems / ordersPerPage);
    setTotalPages(pages || 1);

    // Reset to first page when filters change
    if (currentPage > pages) {
      setCurrentPage(1);
    }

    // Calculate which orders to display on current page
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    setDisplayedOrders(filteredOrders.slice(startIndex, endIndex));
  }, [filteredOrders, currentPage, ordersPerPage]);

  // Handle changing page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle changing orders per page
  const handleOrdersPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setOrdersPerPage(value);
    setCurrentPage(1); // Reset to first page when changing display count
  };

  // Search and filter functionality
  useEffect(() => {
    // First filter by status
    let statusFiltered = orders;
    if (statusFilter !== 'All') {
      statusFiltered = orders.filter(order => order.status === statusFilter);
    }

    // Then apply date range filter if enabled and dates are provided
    if (searchCriteria.date) {
      const startDateObj = startDate ? new Date(startDate) : null;
      const endDateObj = endDate ? new Date(endDate) : null;

      if (startDateObj || endDateObj) {
        statusFiltered = statusFiltered.filter(order => {
          const orderDate = new Date(order.date);

          // If only start date is provided
          if (startDateObj && !endDateObj) {
            // Set time to start of day for proper comparison
            startDateObj.setHours(0, 0, 0, 0);
            return orderDate >= startDateObj;
          }

          // If only end date is provided
          if (!startDateObj && endDateObj) {
            // Set time to end of day for proper comparison
            endDateObj.setHours(23, 59, 59, 999);
            return orderDate <= endDateObj;
          }

          // If both dates are provided
          if (startDateObj && endDateObj) {
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            return orderDate >= startDateObj && orderDate <= endDateObj;
          }

          return true;
        });
      }
    }

    // Then apply search term filter if present
    if (!searchTerm.trim()) {
      setFilteredOrders(statusFiltered);
      return;
    }

    const filtered = statusFiltered.filter(order => {
      const term = searchTerm.toLowerCase();

      // Search by Order ID if selected
      if (searchCriteria.orderId && order.orderId.toLowerCase().includes(term)) {
        return true;
      }

      // Search by customer name if selected
      if (searchCriteria.customerName) {
        const fullName = `${order.address.firstName} ${order.address.lastName}`.toLowerCase();
        if (fullName.includes(term)) {
          return true;
        }
      }

      // Search by price if selected
      if (searchCriteria.price && order.amount.toString().includes(term)) {
        return true;
      }

      // Search by product details (size/color) if selected
      if (searchCriteria.productDetails) {
        return order.items.some(item => {
          const size = item.size ? item.size.toLowerCase() : '';
          const color = item.color ? item.color.toLowerCase() : '';
          return size.includes(term) || color.includes(term);
        });
      }

      return false;
    });

    setFilteredOrders(filtered);
  }, [searchTerm, searchCriteria, orders, statusFilter, startDate, endDate]);

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border bg-gray-200 disabled:opacity-50"
      >
        &laquo;
      </button>
    );

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded border ${currentPage === i ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
      >
        &raquo;
      </button>
    );

    return buttons;
  };

  // PDF Generation Function
  const generatePDF = async () => {
    try {
      // Check if there are any orders with status "Order Placed" or "Picking"
      const eligibleOrders = orders.filter(order =>
        order.status === "Order Placed" || order.status === "Picking"
      );

      if (eligibleOrders.length === 0) {
        toast.error('No orders found with status "Order Placed" or "Picking"');
        return;
      }

      const response = await axios.get(`${backendUrl}/api/order/generatePDF`, {
        headers: { token },
        responseType: 'blob'
      });

      // Add a link to download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'placed_orders_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF Generated Successfully', { autoClose: 1000 });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      // Display the specific error message from the backend
      toast.error(error.response?.data?.message || 'Failed to generate PDF');
    }
  };

  // Label Generation Function
  const generateOrderLabel = async (orderId, labelType = 'standard') => {
    try {
      const response = await axios.get(`${backendUrl}/api/order/generateLabel/${orderId}`, {
        headers: { token },
        params: { type: labelType }, // Pass label type as query parameter
        responseType: 'blob'
      });
      // Add a link to download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order_label_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Order Label Generated Successfully', { autoClose: 1000 });
    } catch (error) {
      console.error('Label Generation Error:', error);
      toast.error('Failed to generate order label');
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const newStatus = event.target.value;
      let trackingId = null;

      // If status is "Delivered", get tracking ID if exists
      if (newStatus === "Delivered") {
        trackingId = trackingInputs[orderId] || null;
      }

      const response = await axios.post(
        backendUrl + '/api/order/status',
        {
          orderId,
          status: newStatus,
          trackingId
        },
        { headers: { token } }
      );

      if (response.data.success) {
        // Clear tracking input after successful update
        if (newStatus === "Delivered" && trackingId) {
          setTrackingInputs(prev => ({ ...prev, [orderId]: '' }));
        }
        await fetchAllOrders();
        toast.success(`Order status updated to ${newStatus}`);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Handle change in tracking ID inputs
  const handleTrackingInput = (orderId, value) => {
    setTrackingInputs(prev => ({ ...prev, [orderId]: value }));
  };

  useEffect(() => {
    fetchAllOrders();

    // Define the handler for new orders
    const handleNewOrder = (newOrder) => {
      // Prepend the new order to the top of the list
      setOrders((prevOrders) => [newOrder.order, ...prevOrders]);
      setFilteredOrders((prevOrders) => [newOrder.order, ...prevOrders]);
    };

    // Connect to WebSocket and listen for new orders
    WebSocketService.connect(() => {
      WebSocketService.on('newOrder', handleNewOrder);
    });

    // Cleanup function to disconnect WebSocket and remove the listener
    return () => {
      WebSocketService.disconnect();
      WebSocketService.off('newOrder', handleNewOrder);
    };
  }, [token]);

  // Search functionality
  useEffect(() => {
    // First filter by status
    let statusFiltered = orders;
    if (statusFilter !== 'All') {
      statusFiltered = orders.filter(order => order.status === statusFilter);
    }

    // Apply date range filter if enabled
    if (searchCriteria.date) {
      const startDateObj = startDate ? new Date(startDate) : null;
      const endDateObj = endDate ? new Date(endDate) : null;

      if (startDateObj || endDateObj) {
        statusFiltered = statusFiltered.filter(order => {
          const orderDate = new Date(order.date);

          if (startDateObj && !endDateObj) {
            startDateObj.setHours(0, 0, 0, 0);
            return orderDate >= startDateObj;
          }

          if (!startDateObj && endDateObj) {
            endDateObj.setHours(23, 59, 59, 999);
            return orderDate <= endDateObj;
          }

          if (startDateObj && endDateObj) {
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            return orderDate >= startDateObj && orderDate <= endDateObj;
          }

          return true;
        });
      }
    }

    if (!searchTerm.trim()) {
      setFilteredOrders(statusFiltered);
      return;
    }

    const filtered = statusFiltered.filter(order => {
      const term = searchTerm.toLowerCase();

      // Search by Order ID if selected
      if (searchCriteria.orderId && order.orderId.toLowerCase().includes(term)) {
        return true;
      }

      // Search by customer name if selected
      if (searchCriteria.customerName) {
        const fullName = `${order.address.firstName} ${order.address.lastName}`.toLowerCase();
        if (fullName.includes(term)) {
          return true;
        }
      }

      // Search by price if selected
      if (searchCriteria.price && order.amount.toString().includes(term)) {
        return true;
      }

      // Search by product details (size/color) if selected
      if (searchCriteria.productDetails) {
        return order.items.some(item => {
          const size = item.size ? item.size.toLowerCase() : '';
          const color = item.color ? item.color.toLowerCase() : '';
          return size.includes(term) || color.includes(term);
        });
      }

      return false;
    });

    setFilteredOrders(filtered);
  }, [searchTerm, searchCriteria, orders, statusFilter, startDate, endDate]);

  // Toggle search criteria
  const handleCriteriaChange = (criterion) => {
    setSearchCriteria(prev => ({
      ...prev,
      [criterion]: !prev[criterion]
    }));
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  // Validation function for item details
  const renderItemDetails = (item) => {
    const details = [];
    // Check if both size and color are valid
    if (item.size && item.color && item.size !== 'undefined_undefined' && item.color !== 'undefined_undefined') {
      return `Size: ${item.size} |
            Color: ${item.color}`;
    }

    // If size is valid and not 'undefined'
    if (item.size && item.size !== 'undefined_undefined' && item.size !== 'undefined') {
      if (item.size.includes('_')) {
        const [sizePart, colorPart] = item.size.split('_');
        // If both size and color are valid (i.e., not 'undefined')
        if (sizePart !== 'undefined' && colorPart !== 'undefined') {
          return `Size: ${sizePart} Color: ${colorPart}`;
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

    return '';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className='text-2xl font-bold'>Orders</h3>
        <button
          onClick={generatePDF}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Get All Placed Orders
        </button>
      </div>

      {/* Search Section */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Orders</option>
            <option value="Order Placed">Order Placed</option>
            <option value="Picking">Picking</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Date range inputs - show when date search is enabled */}
        {searchCriteria.date && (
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center">
              <label className="mr-2 whitespace-nowrap">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center">
              <label className="mr-2 whitespace-nowrap">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm"
            >
              Clear Dates
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={searchCriteria.orderId}
              onChange={() => handleCriteriaChange('orderId')}
              className="mr-2 h-4 w-4"
            />
            <span>Order ID</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={searchCriteria.customerName}
              onChange={() => handleCriteriaChange('customerName')}
              className="mr-2 h-4 w-4"
            />
            <span>Customer Name</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={searchCriteria.price}
              onChange={() => handleCriteriaChange('price')}
              className="mr-2 h-4 w-4"
            />
            <span>Price</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={searchCriteria.productDetails}
              onChange={() => handleCriteriaChange('productDetails')}
              className="mr-2 h-4 w-4"
            />
            <span>Size/Color</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={searchCriteria.date}
              onChange={() => handleCriteriaChange('date')}
              className="mr-2 h-4 w-4"
            />
            <span>Date Range</span>
          </label>
        </div>
      </div>

      {/* Status filter indicators */}
      {statusFilter !== 'All' && (
        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold mr-2 px-3 py-1 rounded-full">
            Filtered by status: {statusFilter}
            <button
              onClick={() => setStatusFilter('All')}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Date filter indicators */}
      {searchCriteria.date && (startDate || endDate) && (
        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold mr-2 px-3 py-1 rounded-full">
            Date filter: {startDate ? `From ${new Date(startDate).toLocaleDateString()}` : ''}
            {endDate ? `${startDate ? ' to ' : 'Until '}${new Date(endDate).toLocaleDateString()}` : ''}
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="mr-2">Orders per page:</span>
          <select
            value={ordersPerPage}
            onChange={handleOrdersPerPageChange}
            className="p-1 border border-gray-300 rounded"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={300}>300</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredOrders.length > 0 ? (currentPage - 1) * ordersPerPage + 1 : 0} - {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
        </div>
      </div>

      <div>
        {displayedOrders.length > 0 ? (
          displayedOrders.map((order, index) => {
            // Determine the background color class based on the order status
            const statusClass =
              order.status === "Order Placed" ? "bg-green-200" :
                order.status === "Picking" ? "bg-yellow-200" :
                  order.status === "Out for Delivery" ? "bg-gray-200" :
                    "bg-white";

            return (
              <div
                className={`grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 
                            border-gray-300 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-black rounded-xl ${statusClass}`}
                key={index}
              >
                <img className='w-12 rounded-xs' src={assets.order_iocn} alt="" />
                <div>
                  <div>
                    <p className='font-bold text-sm mb-2 text-black'>Order ID: {order.orderId || 'N/A'}</p>
                    <div>
                      {
                        order.items.map((item, index) => {
                          const detailsText = renderItemDetails(item);
                          if (index === order.items.length - 1) {
                            return <p className='py-0.5 text-black' key={index}>{item.name} <b>×</b> {item.quantity}{detailsText && ` (${detailsText})`}</p>
                          } else {
                            return <p className='py-0.5 text-black' key={index}>{item.name} <b>×</b> {item.quantity}{detailsText && ` (${detailsText})`},</p>
                          }
                        })
                      }
                    </div>
                    <p className='mt-3 mb-2 font-medium text-black'>{order.address.firstName + " " + order.address.lastName}</p>
                    <div>
                      <p className='text-black'>{order.address.street + ","}</p>
                      <p className='text-black'>{order.address.city + ", " + order.address.state + ", " + order.address.postalCode}</p>
                    </div>
                    <p className='text-black'>{order.address.phoneNumber}</p>
                  </div>
                </div>
                <div>
                  <p className='text-sm sm:text-[15px] text-black'>Items: {order.items.length}</p>
                  <p className='mt-3 text-black'>Payment Method: {order.paymentMethod}</p>
                  <p className='text-black'>Payment: {order.payment ? "Done" : "Pending"}</p>
                  <p className='text-black'>Date: {new Date(order.date).toLocaleString()}</p>
                </div>
                <p className='text-sm sm:text-[15px] text-black'>{currency}{order.amount}.00</p>
                <div className="flex flex-col gap-2">
                  <select onChange={(event) => statusHandler(event, order._id)} value={order.status} className='p-2 font-semibold text-black'>
                    <option value="Order Placed">Order Placed</option>
                    <option value="Picking">Picking</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>

                  {/* Show tracking ID input only when status is or will be "Delivered" */}
                  {(order.status === "Delivered" || order.status === "Out for Delivery") && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Tracking ID"
                        value={trackingInputs[order._id] || ''}
                        onChange={(e) => handleTrackingInput(order._id, e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full text-sm"
                      />
                      {order.trackingId && (
                        <p className="text-xs mt-1 text-green-600">Current tracking: {order.trackingId}</p>
                      )}
                      {order.status === "Delivered" && (
                        <button
                          onClick={() => statusHandler({ target: { value: "Delivered" } }, order._id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white mt-1 py-1 px-2 rounded text-xs"
                        >
                          Update Tracking
                        </button>
                      )}
                    </div>
                  )}

                  {/* Generate Label section with label type selection */}
                  {(order.status !== "Delivered" && order.status !== "Out for Delivery") && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select
                          id={`labelType-${order._id}`}
                          className="bg-gray-100 text-gray-900 text-xs rounded py-1 px-2 w-28"
                          defaultValue="standard"
                        >
                          <option value="standard">Standard</option>
                          <option value="table">Table</option>
                        </select>
                        <button
                          onClick={() => {
                            const labelType = document.getElementById(`labelType-${order._id}`).value;
                            generateOrderLabel(order._id, labelType);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs"
                        >
                          Generate Label
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <img src={assets.order_iocn} alt="No orders" className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-gray-500 text-lg">No orders found matching your search criteria.</p>
          </div>
        )}
      </div>
      {filteredOrders.length > ordersPerPage && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            {renderPaginationButtons()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;