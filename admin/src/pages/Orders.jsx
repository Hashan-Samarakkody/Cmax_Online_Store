import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import WebSocketService from '../WebSocketService'; // Import WebSocketService

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    if (!token) {
      return null;
    }

    try {
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } });
      if (response.data.success) {
        // Reverse the order of orders so the newest comes at the top
        setOrders(response.data.orders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // PDF Generation Function
  const generatePDF = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/order/generatePDF`, {
        headers: { token },
        responseType: 'blob'
      });
      // Create a link to download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'placed_orders_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Clean up the link

      toast.success('PDF Generated Successfully', { autoClose: 1000 });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Label Generation Function
  const generateOrderLabel = async (orderId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/order/generateLabel/${orderId}`, {
        headers: { token },
        responseType: 'blob'
      });
      // Create a link to download the PDF
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
      const response = await axios.post(backendUrl + '/api/order/status', { orderId, status: event.target.value }, { headers: { token } });
      if (response.data.success) {
        await fetchAllOrders();
      }
    } catch (error) {
      console.log(error);
      toast.error(response.data.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();

    // Define the handler for new orders
    const handleNewOrder = (newOrder) => {
      // Prepend the new order to the top of the list
      setOrders((prevOrders) => [newOrder.order, ...prevOrders]);
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
      <div>
        {
          orders.map((order, index) => {
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

                  {/* Generate Label button - only show for non-delivered orders */}
                  {order.status !== "Delivered" && (
                    <button
                      onClick={() => generateOrderLabel(order._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs"
                    >
                      Generate Label
                    </button>
                  )}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default Orders;