import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'
import WebSocketService from '../services/WebSocketService'

const LatestCollection = () => {
  const { products, setProducts } = useContext(ShopContext);
  const [latestProducts, setLatestCollection] = useState([]);

  useEffect(() => {
    // Update latest products when products array changes
    setLatestCollection(products.slice(0, 8));
  }, [products]);

  useEffect(() => {
    // Ensure WebSocket connection is established
    if (!WebSocketService.isConnected()) {
      WebSocketService.connect();
    }

    // Handle new product events
    const handleNewProduct = (data) => {
      if (data && data.product) {
        setProducts(prevProducts => {
          // Only add if not already in the array
          const exists = prevProducts.some(p => p._id === data.product._id);
          return exists ? prevProducts : [...prevProducts, data.product];
        });
      }
    };

    // Handle product updates
    const handleUpdateProduct = (data) => {
      if (data && data.product) {
        setProducts(prevProducts => prevProducts.map(product =>
          product._id === data.product._id ? data.product : product
        ));
      }
    };

    // Register for WebSocket events
    WebSocketService.on('newProduct', handleNewProduct);
    WebSocketService.on('updateProduct', handleUpdateProduct);

    // Cleanup on unmount
    return () => {
      WebSocketService.off('newProduct', handleNewProduct);
      WebSocketService.off('updateProduct', handleUpdateProduct);
    };
  }, [setProducts]);

  return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Title text1={'LATEST'} text2={'COLLECTION'} />
        <p className='w-3/4 m-auto text-sm sm:text-sm md:text-base text-gray-600'>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aperiam fuga molestiae natus,
          maxime in recusandae reprehenderit! Similique, quos aspernatur, possimus quaerat earum
          veritatis et asperiores inventore aliquid aperiam necessitatibus consequatur.
        </p>
      </div>

      {/* Rendering Products */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6'>
        {
          latestProducts.map((item, index) => (
            <ProductItem key={item._id} id={item._id} image={item.images} name={item.name} price={item.price} />
          ))
        }
      </div>
    </div>
  )
}

export default LatestCollection