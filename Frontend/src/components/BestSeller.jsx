import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'
import WebSocketService from '../services/WebSocketService'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const BestSeller = () => {
    const { products, setProducts } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);
    const [ref, inView] = useInView({
        triggerOnce: false,
        threshold: 0.1,
    });

    useEffect(() => {
        // Filter and set best sellers - keep original functionality
        const bestProduct = products.filter((item) => item.bestseller === true);
        console.log(`Found ${bestProduct.length} bestseller products`);
        setBestSeller(bestProduct.slice(0, 4));
    }, [products]);

    useEffect(() => {
        // WebSocket functionality - kept exactly the same
        if (!WebSocketService.isConnected()) {
            WebSocketService.connect(() => {
                console.log("WebSocket connected successfully in BestSeller");
            });
        }

        const handleNewProduct = (data) => {
            console.log("BestSeller received new product:", data);
            if (data && data.product) {
                setProducts((prevProducts) => {
                    const exists = prevProducts.some(p => p._id === data.product._id);
                    if (!exists) {
                        console.log("Adding new product to state:", data.product.name);
                        return [...prevProducts, data.product];
                    }
                    return prevProducts;
                });
            }
        };

        const handleUpdateProduct = (data) => {
            console.log("BestSeller received product update:", data);
            if (data && data.product) {
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product._id === data.product._id ? data.product : product
                    )
                );
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
        <div className='my-16 py-6 bg-gray-50 rounded-2xl p-6' ref={ref}>
            <div className='text-center py-8'>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.7 }}
                >
                    <Title text1={'BEST'} text2={'SELLER'} />
                    <p className='w-3/4 m-auto text-sm sm:text-sm md:text-base text-gray-600 mt-4'>
                        Our most popular products loved by customers worldwide. These bestsellers
                        represent the perfect blend of quality, style, and exceptional value.
                    </p>
                </motion.div>
            </div>

            <motion.div
                className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6'
                variants={containerVariants}
                initial="hidden"
                animate={inView ? "show" : "hidden"}
            >
                {bestSeller.length === 0 &&
                    <p className="col-span-4 text-center">No bestseller products found</p>
                }
                {bestSeller.map((item) => (
                    <motion.div
                        key={item._id}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                        whileHover={{
                            y: -10,
                            boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
                            transition: { duration: 0.3 }
                        }}
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
                >
                    View All Bestsellers
                </motion.button>
            </div>
        </div>
    )
}

export default BestSeller