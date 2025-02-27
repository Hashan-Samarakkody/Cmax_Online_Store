import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'

const PlaceOrder = () => {

  const [method, setMethod] = useState('cod');
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAnmount, deliveryCharge, products } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phoneNumber: ''
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    setFormData(data => ({ ...data, [name]: value }))

  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      let orderItems = []
      for (const items in cartItems) {
        for (const item in cartItems[item]) {
          if (cartItems[item][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items))

            if (itemInfo) {
              itemInfo.size = item
              itemInfo.quantity = cartItems[item][item]
              orderItems.push(itemInfo)
            }
          }
        }
      }

      let orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAnmount() + deliveryCharge
      }

      switch (method) {

        case 'cod':
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } });
          if (response.data.success) {
            setCartItems({})
            navigate('/orders')
          } else {
            toast.error(response.data.message)
          }

          break;

        default:
          break;
      }

    } catch (error) {

    }
  }


  return (
    <form onSubmitHandler={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      {/* Left Side */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>

        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name="firstName" value={formData.firstName} type="text" placeholder='First name' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />
          <input required onChange={onChangeHandler} name="lastName" value={formData.lastName} type="text" placeholder='Last name' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />
        </div>

        <input required onChange={onChangeHandler} name="email" value={formData.email} type="email" placeholder='Email Address' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />
        <input required onChange={onChangeHandler} name="street" value={formData.street} type="text" placeholder='Street' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />

        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name="city" value={formData.city} type="text" placeholder='City' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />
          <input required onChange={onChangeHandler} name="state" value={formData.state} type="text" placeholder='State' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name="postalCode" value={formData.postalCode} type="number" placeholder='Postal Code' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />
          <input required onChange={onChangeHandler} name="country" value={formData.country} type="text" placeholder='Country' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />
        </div>

        <input required onChange={onChangeHandler} name="phoneNumber" value={formData.phoneNumber} type="tel" pattern='^\+?\d{10}$' maxLength={12} placeholder='Phone Number' className='border border-gray-300 rounded px-3.5 py-1.5 w-full' />

      </div>

      {/* Right Side */}
      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <CartTotal />
        </div>

        <div className='mt-12 '>
          <Title text1={'PAYMENT'} text2={'METHOD'} />
          {/* payment Method Selection */}
          <div className='flex gap-3 flex-col lg:flex-row'>
            <div onClick={() => setMethod('stripe')} className='flex items-center gap-3 p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></p>
              <img className='h-5 mx-4' src={assets.stripe_logo} alt="" />
            </div>

            <div onClick={() => setMethod('rezorpay')} className='flex items-center gap-3 p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'rezorpay' ? 'bg-green-400' : ''}`}></p>
              <img className='h-5 mx-4' src={assets.razorpay_logo} alt="" />
            </div>

            <div onClick={() => setMethod('cod')} className='flex items-center gap-3 p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
              <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
            </div>
          </div>

          <div className='w-full text-end mt-8'>
            <button type='submit' onClick={() => navigate('/orders')} className='bg-black text-white px-16 py-3 text-sm rounded-sm'>PLACE ORDER</button>
          </div>

        </div>

      </div>
    </form>
  )
}

export default PlaceOrder