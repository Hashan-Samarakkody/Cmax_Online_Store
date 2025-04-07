import React, { useMemo, useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

const CartTotal = () => {
    const { currency, deliveryCharge, getCartAmount } = useContext(ShopContext);

    // Calculate the cart amount once and memoize it to avoid state updates during render
    const cartAmount = useMemo(() => {
        try {
            return getCartAmount();
        } catch (error) {
            console.error("Error calculating cart amount:", error);
            return 0;
        }
    }, [getCartAmount]);

    return (
        <div className='w-full'>
            <div className='text-2xl'>
                <Title text1={'CART'} text2={'TOTALS'} />
            </div>

            <div className='flex flex-col gap-2 mt-2 text-sm'>
                <div className='flex justify-between'>
                    <p>Subtotal</p>
                    <p>{currency} {cartAmount}.00</p>
                </div>
                <hr />
                <div className='flex justify-between'>
                    <p>Shipping Fee</p>
                    <p>{currency}{deliveryCharge}.00</p>
                </div>
                <hr />
                <div className='flex justify-between'>
                    <b>Total</b>
                    <b>{currency}{cartAmount === 0 ? 0 : cartAmount + deliveryCharge}.00</b>
                </div>
            </div>
        </div>
    )
}

export default CartTotal