import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import RelatedProducts from '../components/RelatedProducts';
import ProductReviews from '../components/ProductReviews';
import { toast } from 'react-toastify';
import { backendUrl } from '../../../admin/src/App';
import WebSocketService from '../services/WebSocketService';
import { FiHeart } from 'react-icons/fi';
import RecommendedProducts from '../components/RecommendedProducts';

const Product = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const { wishlistItems, addToWishlist, removeFromWishlist } = useContext(ShopContext);
  const isInWishlist = wishlistItems.includes(productId);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Fetch product data
  const fetchProductData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/product/single`, { productId });
      if (response.data.success && response.data.product) {
        console.log("API fetched product data:", response.data.product);
        // Ensure quantity is a number
        const product = {
          ...response.data.product,
          quantity: Number(response.data.product.quantity || 0)
        };
        setProductData(product);
        setImage(product.images?.[0] || '');
      }
    } catch (error) {
      console.error("Error fetching product directly:", error);
    }

    // Fallback to context data if API request fails or returned empty data
    if ((!productData || !productData.name) && products && productId) {
      const foundProduct = products.find(item => item._id === productId);
      if (foundProduct) {
        console.log("Context product data:", foundProduct);
        // Ensure quantity is a number
        const product = {
          ...foundProduct,
          quantity: Number(foundProduct.quantity || 0)
        };
        setProductData(product);
        setImage(foundProduct.images?.[0] || '');
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProductData();

    // Product update handler
    const handleUpdateProduct = (data) => {
      if (data && data.product && data.product._id === productId) {
        setProductData(data.product);
        // Update image if needed
        if (!image || (data.product.images && !data.product.images.includes(image))) {
          setImage(data.product.images && data.product.images.length > 0 ? data.product.images[0] : '');
        }
        // Check if selected size/color still exists
        if (data.product.hasSizes && size && !data.product.sizes.includes(size)) {
          setSize('');
        }
        if (data.product.hasColors && color && !data.product.colors.includes(color)) {
          setColor('');
        }
      }
    };

    // Product deletion handler
    const handleDeleteProduct = (data) => {
      if (data && data.productId === productId) {
        toast.info('This product is no longer available');
        navigate('/collection');
      }
    };

    try {
      // Setup safe WebSocket connection
      const setupWebSocket = () => {
        WebSocketService.on('updateProduct', handleUpdateProduct);
        WebSocketService.on('deleteProduct', handleDeleteProduct);
      };

      // Connect if needed and set up listeners
      if (WebSocketService.isConnected()) {
        setupWebSocket();
      } else {
        WebSocketService.connect(setupWebSocket);
      }
    } catch (err) {
      console.error("Error setting up WebSocket:", err);
    }

    // Cleanup function
    return () => {
      try {
        WebSocketService.off('updateProduct', handleUpdateProduct);
        WebSocketService.off('deleteProduct', handleDeleteProduct);
      } catch (err) {
        console.error("Error cleaning up WebSocket listeners:", err);
      }
    };
  }, [productId, products]);

  useEffect(() => {
    // Record product view interaction when a user views a product
    const recordProductView = async () => {
      if (token && productId) {
        try {
          await axios.post(
            `${backendUrl}/api/recommendations/interactions`,
            {
              productId,
              interactionType: 'view'
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        } catch (error) {
          console.error('Error recording product view:', error);
          // Don't show error to user as this is a background operation
        }
      }
    };

    recordProductView();
  }, [productId, token]);

  const handleAddToCart = () => {
    if (productData.hasSizes && !size) {
      toast.error('Please select a size');
      return;
    }
    if (productData.hasColors && !color) {
      toast.error('Please select a color');
      return;
    }

    // Add to cart functionality
    addToCart(productData._id, size, color);

    // Record cart interaction
    if (token) {
      try {
        axios.post(
          `${backendUrl}/api/recommendations/interactions`,
          {
            productId: productData._id,
            interactionType: 'cart'
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } catch (error) {
        console.error('Error recording cart interaction:', error);
      }
    }
  };

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);

      // Record wishlist interaction
      if (token) {
        try {
          axios.post(
            `${backendUrl}/api/recommendations/interactions`,
            {
              productId,
              interactionType: 'wishlist'
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        } catch (error) {
          console.error('Error recording wishlist interaction:', error);
        }
      }
    }
  };

  // If loading or no product data, show fancy loading indicator
  if (isLoading || !productData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-24 h-24">
          {/* Pulsing circle animation */}
          <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-t-4 border-green-400 rounded-full animate-spin"></div>
          {/* Shop icon or logo in center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <img
              src={assets.product_icon}
              alt="Loading"
              className="w-12 h-12 object-contain animate-pulse"
            />
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading Product...</p>
      </div>
    );
  }

  return (
    <div className='border-t-2 pt-6 md:pt-10 px-4 sm:px-6 md:px-8 lg:px-0 transition-opacity ease-in duration-500 opacity-100'>
      {/* Product Data */}
      <div className='flex flex-col sm:flex-row gap-6 sm:gap-12'>
        {/* Product Images */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-auto max-h-[500px] pb-2 sm:pb-0 scrollbar-hide sm:scrollbar-default sm:w-[18.7%] w-full'>
            {productData.images.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                className={`w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer border rounded ${image === item ? 'border-blue-500' : 'border-transparent'}`}
                src={item}
                alt={`${productData.name} - view ${index + 1}`}
                key={index}
              />
            ))}
          </div>
          <div className='w-full sm:w-[80%]'>
            <img className='w-full h-auto rounded-lg' src={image} alt={productData.name} />
          </div>
        </div>

        {/* Product Details */}
        <div className='flex-1'>
          <h1 className='text-2xl sm:text-3xl font-medium'>{productData.name}</h1>

          <p className="text-xl mt-3 sm:mt-5 font-medium">{currency}{productData.price}</p>
          {productData.quantity > 0 ? (
            <p className="mt-1 text-green-600">
              In stock: {productData.quantity} {productData.quantity === 1 ? 'item' : 'items'}
            </p>
          ) : (
            <p className="mt-1 text-red-600 font-medium">Out of stock</p>
          )}
          <p className='mt-3 sm:mt-5 text-gray-600 text-sm sm:text-base text-justify'>{productData.description}</p>

          {/* Size selection */}
          {productData.hasSizes && (
            <div className='flex flex-col gap-3 my-6 sm:my-8'>
              <p className='font-semibold'>Select Size</p>
              <div className='flex flex-wrap gap-2'>
                {productData.sizes.map((item, index) => (
                  <button
                    onClick={() => setSize(item)}
                    key={index}
                    className={`border border-gray-400 py-2 px-4 rounded-lg ${item === size ? 'bg-gray-400 text-white' : ''} text-sm sm:text-base`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selection */}
          {productData.hasColors && (
            <div className='flex flex-col gap-3 my-6 sm:my-8'>
              <p className='font-semibold'>Select Color</p>
              <div className='flex flex-wrap gap-4'>
                {productData.colors.map((colorItem, index) => (
                  <div
                    key={index}
                    onClick={() => setColor(colorItem)}
                    className="relative cursor-pointer"
                  >
                    {/* Container for color and ring */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center
              transition-all duration-300
              ${color === colorItem ? 'ring-3 ring-blue-500 ring-offset-2' : 'ring-1 ring-blue-300 ring-offset-2 hover:ring-2 hover:ring-blue-600 hover:ring-offset-2'}`}
                    >
                      {/* The actual color circle */}
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: colorItem }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
            <button
              onClick={handleAddToCart}
              disabled={productData.quantity <= 0}
              className={`${productData.quantity <= 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-black hover:bg-gray-800 active:bg-gray-700'} 
    text-white px-6 sm:px-8 py-3 text-sm rounded-lg cursor-pointer transition-colors duration-200 ease-in-out w-full sm:w-auto`}
            >
              {productData.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={() => {
                handleWishlistToggle()
              }}
              className={`cursor-pointer border border-black px-6 sm:px-8 py-3 text-sm rounded-lg flex items-center justify-center gap-2 ${isInWishlist ? 'bg-red-50 border-red-300' : 'bg-white'
                } hover:bg-green-200 transition-colors duration-200 ease-in-out w-full sm:w-auto`}
            >
              <FiHeart className={isInWishlist ? 'fill-red-500 text-red-500' : ''} />
              {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          <hr className='mt-6 sm:mt-8 w-full sm:w-4/5' />
          <div className='text-xs sm:text-sm text-gray-500 mt-4 sm:mt-5 flex flex-col gap-1'>
            <p>100% Original Product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Description and Reviews Tabs */}
      <div className='mt-12 sm:mt-20'>
        <div className='flex w-full overflow-hidden'>
          <button
            onClick={() => setActiveTab('description')}
            className={`px-3 sm:px-5 py-2 sm:py-3 text-sm border flex-1 ${activeTab === 'description' ? 'font-bold bg-gray-50' : ''}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3 sm:px-5 py-2 sm:py-3 text-sm border flex-1 ${activeTab === 'reviews' ? 'font-bold bg-gray-50' : ''}`}
          >
            Reviews
          </button>
        </div>

        {/* Tab content */}
        <div className='border p-4 sm:p-6'>
          {activeTab === 'description' ? (
            <div className='flex flex-col gap-4 text-sm text-gray-500 text-justify'>
              <p>
                An e-commerce platform for the fashion-forward, bringing the latest in casual
                wear and formal wear for men and women. We offer a wide range of trendy and
                affordable clothing items, from casual and formal shirts to stylish dresses,
                trousers, and skirts. Our collection of clothing items is designed to cater to
                the fashion needs of the modern man and woman.
              </p>
              <p>
                E-commerce websites have revolutionized the way people shop for clothes. With
                the convenience of shopping from home, customers can browse through a wide
                range of clothing items and choose the ones that best suit their style and
                budget.
              </p>
            </div>
          ) : (
            <ProductReviews productId={productId} />
          )}
        </div>
      </div>

      <div className="mt-8 sm:mt-12">
        <RecommendedProducts productId={productId} type="alsoBought" />
      </div>

      {/* Related Products */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  );
};

export default Product;