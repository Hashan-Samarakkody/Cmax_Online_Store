import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import ProductItem from '../components/ProductItem';

const Wishlist = () => {
    const { products, wishlistItems, removeFromWishlist, addToCart, navigate } = useContext(ShopContext);
    const [wishlistProducts, setWishlistProducts] = useState([]);

    useEffect(() => {
        // Filter products that are in the wishlist
        const filtered = products.filter(product => wishlistItems.includes(product._id));
        setWishlistProducts(filtered);
    }, [products, wishlistItems]);

    return (
        <div className='border-t pt-8 sm:pt-14 px-3 sm:px-6'>
            <div className='text-xl sm:text-2xl mb-6 sm:mb-8'>
                <Title text1={'YOUR'} text2={'WISHLIST'} />
            </div>

            {wishlistProducts.length === 0 ? (
                <div className='flex flex-col justify-center items-center h-[50vh]'>
                    <img
                        className='w-48 sm:w-64 md:w-80 animate-pulse'
                        src={assets.empty_wishlist}
                        alt='Empty Wishlist'
                        onClick={() => navigate('/collection')}
                    />
                    <p className='text-gray-400 font-semibold text-xl sm:text-2xl md:text-4xl mt-4 text-center animate-pulse'>Your wishlist is empty!</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6'>
                    {wishlistProducts.map(item => (
                        <div key={item._id} className="relative">
                            <ProductItem
                                id={item._id}
                                image={item.images}
                                name={item.name}
                                price={item.price}
                            />
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        removeFromWishlist(item._id);
                                    }}
                                    className="bg-white p-1 sm:p-2 rounded-full shadow hover:bg-red-100 transition-colors"
                                >
                                    <img src={assets.remove_icon} alt="Add to cart" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;