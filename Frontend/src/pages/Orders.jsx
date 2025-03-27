import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify'

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([])

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

  useEffect(() => {
    loadOrderData()
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
    <div className='boarder-t pt-16'>
      <div className='text-2xl'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>
      <div>
        {
          orderData.map((item, index) => {
            // Get additional details
            const itemDetails = renderItemDetails(item);

            return (
              <div key={index} className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <div className='flex items-start gap-6 text-sm'>
                  <img className='w-16 sm:w-20 rounded-lg' src={item.images[0]} alt="" />
                  <div>
                    <p className='sm:text-base font-bold'>{item.name}</p>
                    <div className='flex items-center gap-3 mt-1 text-base text-gray-700'>
                      <p className='font-semibold text-gray-500'>{currency}{item.price}</p>
                      <p className='font-semibold text-gray-500'>Quantity: {item.quantity}</p>
                    </div>
                    {itemDetails && (
                      <p className='font-semibold text-gray-500'>{itemDetails}</p>
                    )}
                    <p className='mt-1 font-sem font-medium'>Date: <span className='text-gray-400'>{new Date(item.date).toDateString()}</span></p>
                    <p className='mt-1 font-sem font-medium'>Payment Method: <span className='text-gray-400'>{item.paymentMethod}</span></p>
                  </div>
                </div>
                <div className='md:w-1/2 flex justify-between'>
                  <div className='flex item-center gap-2'>
                    <p className='min-w-2 h-2 rounded-full bg-green-500'></p>
                    <p className='text-sm md:text-base'>{item.status}</p>
                  </div>
                  <button onClick={loadOrderData} className='border px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-all duration-200 rounded-sm'>Track Order</button>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default Orders;
