import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'
import WebSocketService from '../services/WebSocketService'

const BestSeller = () => {
    const { products, setProducts } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);

    useEffect(() => {
        console.log("Products updated in BestSeller:", products.length);
        // Filter and set best sellers
        const bestProduct = products.filter((item) => item.bestseller === true);
        console.log(`Found ${bestProduct.length} bestseller products`);
        setBestSeller(bestProduct.slice(0, 4));
    }, [products]);

    useEffect(() => {
        // Ensure WebSocket connection is established
        if (!WebSocketService.isConnected()) {
            WebSocketService.connect(() => {
                console.log("WebSocket connected successfully in BestSeller");
            });
        }

        // Handle new products
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

        // Handle product updates (THIS WAS MISSING)
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

    return (
        <div className='my-10'>
            <div className='text-center py-8 text-3xl'>
                <Title text1={'BEST'} text2={'SELLER'} />
                <p className='w-3/4 m-auto text-sm sm:text-sm md:text-base text-gray-600'>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aperiam fuga molestiae natus,
                    maxime in recusandae reprehenderit! Similique, quos aspernatur, possimus quaerat earum
                    veritatis et asperiores inventore aliquid aperiam necessitatibus consequatur.
                </p>
            </div>

            <div>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6'>
                    {bestSeller.length === 0 && <p className="col-span-4 text-center">No bestseller products found</p>}
                    {
                        bestSeller.map((item, index) => (
                            <ProductItem key={item._id} id={item._id} image={item.images} name={item.name} price={item.price} />
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

export default BestSeller