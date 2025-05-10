import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { assets } from '../assets/assets';

const RecommendedProducts = ({ productId, type = 'personal' }) => {
    const { backendUrl, token } = useContext(ShopContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                let endpoint;
                let headers = {};

                switch (type) {
                    case 'personal': // Personalized recommendations
                        endpoint = `${backendUrl}/api/recommendations/recommendations`;
                        if (token) headers.Authorization = `Bearer ${token}`;
                        break;
                    case 'trending': // Trending products
                        endpoint = `${backendUrl}/api/recommendations/trending`;
                        break;
                    case 'similar': // Similar products
                        if (!productId) return;
                        endpoint = `${backendUrl}/api/recommendations/similar/${productId}`;
                        break;
                    case 'alsoBought': // Customers who bought this also bought
                        if (!productId) return;
                        endpoint = `${backendUrl}/api/recommendations/also-bought/${productId}`;
                        break;
                    default:
                        endpoint = `${backendUrl}/api/recommendations/trending`;
                }

                const response = await axios.get(endpoint, { headers });

                if (response.data.success) {
                    setProducts(response.data.recommendations || []);
                } else {
                    setError('Failed to fetch recommendations');
                }
            } catch (error) {
                console.error(`Error fetching ${type} recommendations:`, error);
                setError(`Couldn't load recommendations`);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [backendUrl, token, productId, type]);

    // Don't render if there are no products
    if (!loading && products.length === 0) return null;

    let titleText1 = '';
    let titleText2 = '';

    switch (type) {
        case 'personal':
            titleText1 = 'RECOMMENDED';
            titleText2 = 'FOR YOU';
            break;
        case 'trending':
            titleText1 = 'TRENDING';
            titleText2 = 'NOW';
            break;
        case 'similar':
            titleText1 = 'SIMILAR';
            titleText2 = 'PRODUCTS';
            break;
        case 'alsoBought':
            titleText1 = 'CUSTOMERS ALSO';
            titleText2 = 'BOUGHT';
            break;
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
        <div ref={ref} className="my-12">
            <div className="text-center mb-8">
                <Title text1={titleText1} text2={titleText2} />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                </div>
            ) : error ? (
                <div className="text-center text-red-500">{error}</div>
            ) : (
                <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                >
                    {products.map((product) => (
                        <motion.div key={product._id} variants={itemVariants}>
                            <ProductItem
                                id={product._id}
                                image={product.images}
                                name={product.name}
                                price={product.price}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default RecommendedProducts;