import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { toast } from 'react-toastify';

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            // Try to extract color from item key if it contains a color
            const [size, color] = item.split('_');

            tempData.push({
              _id: items,
              size: size !== 'undefined' ? size : null,
              color: color !== 'undefined' ? color : null,
              quantity: cartItems[items][item],
            });
          }
        }
      }

      setCartData(tempData);
    }
  }, [cartItems, products]);

  const handleRemoveProduct = (productId, size, color) => {
    updateQuantity(productId, `${size || 'undefined'}_${color || 'undefined'}`, 0);
    toast.info('Product removed from cart!', { autoClose: 1000 });
  };

  return (
    <div className='border-t pt-14'>
      <div className='text-2xl mb-3'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {cartData.length === 0 ? (
        // Display "Cart is Empty" message when cartData is empty
        <div className='flex justify-center items-center h-[50vh]'>
          <p className='text-gray-400 font-semibold text-4xl'>Your cart is empty!</p>
        </div>
      ) : (
        <div>
          {cartData.map((item, index) => {
            const productData = products.find((product) => product._id === item._id);

            // Check if productData is valid
            if (!productData) {
              return null; // or render some fallback UI for missing product
            }

            // Prepare size and color display
            const sizeInfo = item.size ? ` | Size: ${item.size}` : '';
            const colorInfo = item.color ? ` | Color: ${item.color}` : '';

            return (
              <div
                key={index}
                className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'
              >
                <div className='flex items-start gap-6'>
                  <img className='w-16 sm:w-20 rounded-lg' src={productData.images[0]} alt='' />
                  <div>
                    <p className='text-xs sm:text-lg font-medium'>{productData.name}</p>
                    <div className='flex items-center gap-5 mt-2'>
                      <p>
                        {currency}
                        {productData.price}
                      </p>
                      {(sizeInfo || colorInfo) && (
                        <p className='px-2 sm:py-1 border bg-slate-50 rounded-lg'>
                          {sizeInfo}
                          {colorInfo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  onChange={(e) =>
                    e.target.value === '' || e.target.value === '0'
                      ? null
                      : updateQuantity(
                        item._id,
                        `${item.size || 'undefined'}_${item.color || 'undefined'}`,
                        Number(e.target.value)
                      )
                  }
                  className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1'
                  type='number'
                  min={1}
                  defaultValue={item.quantity}
                />
                <img
                  onClick={() => handleRemoveProduct(item._id, item.size, item.color)}
                  className='w-4 mr-4 sm:w-5 cursor-pointer'
                  src={assets.bin_icon}
                  alt=''
                />
              </div>
            );
          })}
        </div>
      )}

      {cartData.length > 0 && (
        <div className='flex justify-end mt-20'>
          <div className='w-full sm:w-[450px]'>
            <CartTotal />
            <div className='w-full text-end'>
              <button
                onClick={() => navigate('/place-order')}
                className='bg-black text-white text-sm my-8 px-8 py-3 rounded-sm'
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;