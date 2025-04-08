import React, { useEffect, useState, createContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import WebSocketService from "../services/WebSocketService";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = 'Rs. ';
    const deliveryCharge = 150;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('');
    const navigate = useNavigate();

    // Add WebSocket connection and handlers
    useEffect(() => {
        // Ensure WebSocket connection is established
        if (!WebSocketService.isConnected()) {
            WebSocketService.connect(() => {
                console.log("WebSocket connected successfully in ShopContext");
            });
        }

        // Handle new products at context level
        const handleNewProduct = (data) => {
            console.log("ShopContext received new product:", data);
            if (data && data.product) {
                setProducts(prevProducts => {
                    // Only add if not already in the array
                    const exists = prevProducts.some(p => p._id === data.product._id);
                    if (!exists) {
                        console.log("Adding new product to global state:", data.product.name);
                        return [...prevProducts, data.product];
                    }
                    return prevProducts;
                });
            }
        };

        // Handle product updates at context level
        const handleUpdateProduct = (data) => {
            console.log("ShopContext received product update:", data);
            if (data && data.product) {
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product._id === data.product._id ? data.product : product
                    )
                );
            }
        };

        // Handle product deletions
        const handleDeleteProduct = (data) => {
            console.log("ShopContext received product deletion:", data);
            if (data && data.productId) {
                setProducts(prevProducts =>
                    prevProducts.filter(product => product._id !== data.productId)
                );
            }
        };

        // Register WebSocket handlers at the context level
        WebSocketService.on('newProduct', handleNewProduct);
        WebSocketService.on('updateProduct', handleUpdateProduct);
        WebSocketService.on('deleteProduct', handleDeleteProduct);

        return () => {
            // Cleanup handlers on unmount
            WebSocketService.off('newProduct', handleNewProduct);
            WebSocketService.off('updateProduct', handleUpdateProduct);
            WebSocketService.off('deleteProduct', handleDeleteProduct);
        };
    }, []);

    // Keep all existing code below
    const addToCart = async (itemId, size, color) => {
        // If product doesn't have sizes or colors, use 'undefined'
        const cartKey = `${size || 'undefined'}_${color || 'undefined'}`;

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][cartKey]) {
                cartData[itemId][cartKey] += 1;
            }
            else {
                cartData[itemId][cartKey] = 1;
            }
        }
        else {
            cartData[itemId] = {};
            cartData[itemId][cartKey] = 1;
        }

        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', {
                    itemId,
                    size: size || null,
                    color: color || null
                }, { headers: { token } });
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }
    }

    const getCartCount = () => {
        let totalCount = 0;

        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {

                }
            }
        }

        return totalCount;
    }

    const updateQuantity = async (itemId, cartKey, quantity) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId][cartKey] = quantity;

        setCartItems(cartData)

        if (token) {
            try {
                // Parse the cartKey to extract size and color
                const [size, color] = cartKey.split('_');
                await axios.post(backendUrl + '/api/cart/update', {
                    itemId,
                    size: size !== 'undefined' ? size : null,
                    color: color !== 'undefined' ? color : null,
                    quantity
                }, { headers: { token } });
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }
    }

    const getCartAmount = () => {
        let totalAmount = 0;

        for (const items in cartItems) {
            try {
                let itemInfo = products.find((product) => product._id === items);

                // Skip if product not found instead of showing toast during calculation
                if (!itemInfo) continue;

                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                }
            } catch (error) {
                // Only log to console during calculations, don't update state with toast
                console.error("Error calculating cart amount:", error);
            }
        }

        return totalAmount;
    }

    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list');

            if (response.data.success) {
                setProducts(response.data.products);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }

    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token } })
            if (response.data.success) {
                setCartItems(response.data.cartData)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }

    useEffect(() => {
        getProductsData();
    }, [])

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
        }
    }, [])


    const value = {
        products,
        setProducts, // Explicitly expose setProducts
        currency,
        deliveryCharge,
        search,
        setSearch,
        showSearch,
        setShowSearch,
        cartItems,
        addToCart,
        setCartItems,
        getCartCount,
        updateQuantity,
        getCartAmount,
        navigate,
        backendUrl,
        setToken,
        token
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;