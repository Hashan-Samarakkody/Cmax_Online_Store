import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const ProductItem = ({ id, image, name, price }) => {
    const { currency } = useContext(ShopContext);

    // Check if image array exists and has elements
    const productImage = image && image.length > 0 ? image[0] : 'default-image-url.jpg';  

    return (
        <Link className='text-gray-800 rounded-xl' to={`/product/${id}`}>
            <div className='overflow-hidden rounded-lg'>
                <img className='h-fit hover:scale-115 transition ease-in-out' src={productImage} alt={name} />
            </div>
            <p className='pt-2 pb-1 text-sm text-wrap'>{name}</p>
            <p className='text-sm font-semibold'>{currency}{price}</p>
        </Link>
    );
};


export default ProductItem;
