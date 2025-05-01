import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import ProductItem from '../components/ProductItem';

const Wishlist = () => {
    const { products, wishlistItems, removeFromWishlist, addToCart,navigate } = useContext(ShopContext);
    const [wishlistProducts, setWishlistProducts] = useState([]);

    useEffect(() => {
        // Filter products that are in the wishlist
        const filtered = products.filter(product => wishlistItems.includes(product._id));
        setWishlistProducts(filtered);
    }, [products, wishlistItems]);

    return (
        <div className='border-t pt-14'>
            <div className='text-2xl mb-8'>
                <Title text1={'YOUR'} text2={'WISHLIST'} />
            </div>

            {wishlistProducts.length === 0 ? (
                <div className='flex flex-col justify-center items-center h-[50vh]'>
                    <img
                        className='w-80 sm:w-100 animate-pulse'
                        src={assets.empty_wishlist}
                        alt='Empty Wishlist'
                        onClick={() => navigate('/collection')}
                    />
                    <p className='text-gray-400 font-semibold text-4xl mt-4 text-center animate-pulse'>Your wishlist is empty!</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                    {wishlistProducts.map(item => (
                        <div key={item._id} className="relative">
                            <ProductItem
                                id={item._id}
                                image={item.images}
                                name={item.name}
                                price={item.price}
                            />
                            <div className="absolute top-3 right-3 flex flex-col gap-2">

                                <button
                                    onClick={() => {
                                        addToCart(item._id);
                                        removeFromWishlist(item._id);
                                    }}
                                    className="bg-white p-2 rounded-full shadow hover:bg-red-100 transition-colors"
                                >
                                    <img src={assets.remove_icon} alt="Add to cart" className="w-10 h-10" />
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