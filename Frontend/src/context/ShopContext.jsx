import React, { useEffect, useState, createContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import WebSocketService from "../services/WebSocketService";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = 'Rs. ';
    const deliveryCharge = 30;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('');
    const [wishlistItems, setWishlistItems] = useState([]);
    const navigate = useNavigate();

    const addToWishlist = async (itemId) => {
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/add', {
                itemId
            }, { headers: { token } });

            if (response.data.success) {
                setWishlistItems([...wishlistItems, itemId]);
                toast.success('Added to wishlist!');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const removeFromWishlist = async (itemId) => {
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/remove', {
                itemId
            }, { headers: { token } });

            if (response.data.success) {
                setWishlistItems(wishlistItems.filter(id => id !== itemId));
                toast.success('Removed from wishlist!');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const getWishlist = async () => {
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/get', {}, { headers: { token } });
            if (response.data.success) {
                setWishlistItems(response.data.wishlistItems);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const recordPurchaseInteractions = async (items) => {
        if (!token) return;

        try {
            // Extract product IDs from the purchased items
            const productIds = Object.keys(items);

            // Record each purchase as an interaction
            for (const productId of productIds) {
                await axios.post(
                    `${backendUrl}/api/recommendations/interactions`,
                    {
                        productId,
                        interactionType: 'purchase'
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }
        } catch (error) {
            console.error('Error recording purchase interactions:', error);
        }
    };

    // Add to useEffect that runs on login/token change
    useEffect(() => {
        if (token) {
            getUserCart(token);
            getWishlist();
        }
    }, [token]);

    // Add WebSocket connection and handlers
    useEffect(() => {
        // Ensure WebSocket connection is established
        if (!WebSocketService.isConnected()) {
            WebSocketService.connect(() => {
                console.log("WebSocket connected");
            });
        } else {
            console.log("WebSocket already connected");
        }

        // Handle new products at context level
        const handleNewProduct = (data) => {
            if (data && data.product) {
                setProducts(prevProducts => {
                    // Only add if not already in the array
                    const exists = prevProducts.some(p => p._id === data.product._id);
                    if (!exists) {
                        return [...prevProducts, data.product];
                    }
                    return prevProducts;
                });
            }
        };

        // Handle product visibility changes
        const handleProductVisibilityChanged = (data) => {
            if (!data.productId || data.isVisible === undefined) return;

            // Update the products array with the new visibility setting
            setProducts(prevProducts =>
                prevProducts.map(product => {
                    if (product._id === data.productId) {
                        return { ...product, isVisible: data.isVisible };
                    }
                    return product;
                }).filter(product => {
                    // If product was hidden, remove it from user view
                    if (product._id === data.productId && !data.isVisible) {
                        return false;
                    }
                    return true;
                })
            );
        };

        // Handle cart updates
        const handleCartUpdate = (data) => {
            if (data && data.cartData) {
                setCartItems(data.cartData);
            }
        };

        // Handle product updates at context level
        const handleUpdateProduct = (data) => {
            if (data && data.product) {
                setProducts(prevProducts => {
                    // Add a new array with the updated product
                    const updatedProducts = prevProducts.map(product =>
                        product._id === data.product._id ?
                            {
                                ...data.product,
                                // Preserve category and subcategory objects if they exist
                                category: product.category && typeof product.category === 'object' ?
                                    product.category : data.product.category,
                                subcategory: product.subcategory && typeof product.subcategory === 'object' ?
                                    product.subcategory : data.product.subcategory
                            } : product
                    );

                    // Force a render by returning a new array
                    return [...updatedProducts];
                });
            }
        };

        // Handle product deletions
        const handleDeleteProduct = (data) => {
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
        WebSocketService.on('productVisibilityChanged', handleProductVisibilityChanged);
        WebSocketService.on('cartUpdate', handleCartUpdate);
        return () => {
            // Cleanup handlers on unmount
            WebSocketService.off('newProduct', handleNewProduct);
            WebSocketService.off('updateProduct', handleUpdateProduct);
            WebSocketService.off('deleteProduct', handleDeleteProduct);
            WebSocketService.off('productVisibilityChanged', handleProductVisibilityChanged);
            WebSocketService.off('cartUpdate', handleCartUpdate);
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
                toast.success('Product added to cart!');
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
        // Add a deep copy of current cart items
        let cartData = structuredClone(cartItems);

        // Parse cartKey to extract size and color
        const [size, color] = cartKey.split('_');

        if (quantity === 0) {
            // If quantity is 0, remove the item completely
            if (cartData[itemId] && cartData[itemId][cartKey]) {
                delete cartData[itemId][cartKey];

                // If no more items with this ID, remove the entire product entry
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }
            }
        } else {
            // Otherwise just update the quantity
            if (!cartData[itemId]) cartData[itemId] = {};
            cartData[itemId][cartKey] = quantity;
        }

        // Update local state immediately for better UI responsiveness
        setCartItems({ ...cartData });

        // Then update server state
        if (token) {
            try {
                const response = await axios.post(backendUrl + '/api/cart/update', {
                    itemId,
                    size: size !== 'undefined' ? size : null,
                    color: color !== 'undefined' ? color : null, // Ensure color is sent to backend
                    quantity
                }, { headers: { token } });

                return response;
            } catch (error) {
                console.error("Failed to update cart on server:", error);
                toast.error("Failed to update cart");
                // Rollback to server state on error
                await getUserCart(token);
                throw error;
            }
        }

        return Promise.resolve();
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
        setProducts,
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
        token,
        wishlistItems,
        setWishlistItems,
        addToWishlist,
        removeFromWishlist,
        getWishlist,
        recordPurchaseInteractions
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;