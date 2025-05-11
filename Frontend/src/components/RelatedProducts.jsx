import React, { useEffect } from 'react'
import { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const RelatedProducts = ({ category, subCategory }) => {
    const { products } = useContext(ShopContext);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    useEffect(() => {
        setLoading(true);
        if (products.length > 0) {
            let productsCopy = products.slice();
            productsCopy = productsCopy.filter((item) => category === item.category);
            productsCopy = productsCopy.filter((item) => subCategory === item.subCategory);
            setRelatedProducts(productsCopy.slice(0, 10));
        }
        setLoading(false);
    }, [products, category, subCategory]);

    // Don't render if there are no related products
    if (!loading && relatedProducts.length === 0) {
        return null;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div ref={ref} className='my-16 px-4 sm:px-0'>
            <div className='text-center mb-8'>
                <Title text1={'RELATED'} text2={'PRODUCTS'} />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <motion.div
                    className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                >
                    {relatedProducts.map((item, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <ProductItem
                                id={item._id}
                                image={item.images}
                                name={item.name}
                                price={item.price}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}

export default RelatedProducts