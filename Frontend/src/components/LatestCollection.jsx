import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'
import WebSocketService from '../services/WebSocketService'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useNavigate } from 'react-router-dom'

const LatestCollection = () => {
  const { products, setProducts } = useContext(ShopContext);
  const [latestProducts, setLatestCollection] = useState([]);
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Update latest products when products array changes
    setLatestCollection(products.slice(0, 8));
  }, [products]);

  useEffect(() => {
    // WebSocket functionality
    if (!WebSocketService.isConnected()) {
      WebSocketService.connect();
    }

    const handleNewProduct = (data) => {
      if (data && data.product) {
        setProducts(prevProducts => {
          const exists = prevProducts.some(p => p._id === data.product._id);
          return exists ? prevProducts : [...prevProducts, data.product];
        });
      }
    };

    const handleUpdateProduct = (data) => {
      if (data && data.product) {
        setProducts(prevProducts => prevProducts.map(product =>
          product._id === data.product._id ? data.product : product
        ));
      }
    };

    WebSocketService.on('newProduct', handleNewProduct);
    WebSocketService.on('updateProduct', handleUpdateProduct);

    return () => {
      WebSocketService.off('newProduct', handleNewProduct);
      WebSocketService.off('updateProduct', handleUpdateProduct);
    };
  }, [setProducts]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  return (
    <div className='my-16 py-6'>
      <div className='text-center py-8' ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
        >
          <Title text1={'LATEST'} text2={'COLLECTION'} />
          <p className='w-3/4 m-auto text-sm sm:text-sm md:text-base text-gray-600 mt-4'>
            Discover our newest arrivals and stay ahead of the trends with C-max's latest collection.
            We've handpicked these items to ensure quality, style, and value for our customers.
          </p>
        </motion.div>
      </div>

      {/* Rendering Products with animation */}
      <motion.div
        className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6'
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {latestProducts.map((item, index) => (
          <motion.div
            key={item._id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
          >
            <ProductItem id={item._id} image={item.images} name={item.name} price={item.price} />
          </motion.div>
        ))}
      </motion.div>

      <div className="text-center mt-8">
        <motion.button
          className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/collection')}
        >
          View All Products
        </motion.button>
      </div>
    </div>
  )
}

export default LatestCollection