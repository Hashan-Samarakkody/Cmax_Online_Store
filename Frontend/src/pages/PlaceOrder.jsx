import React, { useContext, useState, useRef, useEffect } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';

const PlaceOrder = () => {
  const [method, setMethod] = useState('cod');
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    deliveryCharge,
    products,
    recordPurchaseInteractions,
    currency
  } = useContext(ShopContext);

  const [addressOption, setAddressOption] = useState('new'); // 'new', 'default', or 'saved'
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [stockError, setStockError] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check stock availability before placing the order
  const verifyStockAvailability = () => {
    const stockErrors = [];

    for (const itemId in cartItems) {
      const product = products.find((product) => product._id === itemId);
      if (!product) continue;

      // Calculate total quantity for this product across all size/color combinations
      let totalRequestedQuantity = 0;
      for (const variant in cartItems[itemId]) {
        totalRequestedQuantity += cartItems[itemId][variant];
      }

      // Check if requested quantity exceeds available stock
      if (totalRequestedQuantity > product.quantity) {
        stockErrors.push({
          id: itemId,
          name: product.name,
          requested: totalRequestedQuantity,
          available: product.quantity
        });
      }
    }

    // If there are stock errors, show them and return false
    if (stockErrors.length > 0) {
      setStockError(true);
      setOutOfStockItems(stockErrors);

      toast.error(
        <div>
          <p>Not enough stock for some items:</p>
          <ul className="mt-2 list-disc pl-4">
            {stockErrors.map((item, i) => (
              <li key={i} className="text-sm">
                {item.name}: Available {item.available}, Requested {item.requested}
              </li>
            ))}
          </ul>
        </div>,
        { autoClose: 5000 }
      );

      return false;
    }

    setStockError(false);
    setOutOfStockItems([]);
    return true;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    phoneNumber: ''
  });

  const [districtInput, setDistrictInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const autocompleteRef = useRef(null);
  const [fieldsDisabled, setFieldsDisabled] = useState(false);

  const districts = [
    "Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya",
    "Puttalam", "Kurunegala", "Gampaha", "Colombo", "Kalutara",
    "Anuradhapura", "Polonnaruwa", "Matale", "Kandy", "Nuwara Eliya",
    "Kegalle", "Ratnapura", "Trincomalee", "Batticaloa", "Ampara",
    "Badulla", "Monaragala", "Hambantota", "Matara", "Galle"
  ];

  const fetchUserProfile = async () => {
    if (!token) return;

    try {
      // Get user profile
      const profileResponse = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success && profileResponse.data.user) {
        const { user } = profileResponse.data;

        setFormData(prev => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || ''
        }));

        return user;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Could not load user profile information');
    }
    return null;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          // Get user profile
          const profileResponse = await axios.get(`${backendUrl}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (profileResponse.data.success && profileResponse.data.user) {
            const { user } = profileResponse.data;

            // Get addresses separately if available
            try {
              const addressesResponse = await axios.get(`${backendUrl}/api/user/addresses`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              if (addressesResponse.data.success) {
                const addresses = addressesResponse.data.addresses || [];
                setUserAddresses(addresses);

                // If user has a default address, set it as default option
                const hasDefaultAddress = addresses.some(addr => addr.isDefault);
                if (hasDefaultAddress) {
                  setAddressOption('default');
                  handleAddressOptionChange('default', addresses);
                }
              }
            } catch (addressError) {
              console.error('Error fetching user addresses:', addressError);
              setUserAddresses(user.addresses || []);
            }

            setFormData(prev => ({
              ...prev,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phoneNumber: user.phoneNumber || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [token, backendUrl]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (districtInput) {
      const filtered = districts.filter(
        district => district.toLowerCase().includes(districtInput.toLowerCase())
      );
      setFilteredDistricts(filtered);
    } else {
      setFilteredDistricts(districts);
    }
  }, [districtInput]);

  useEffect(() => {
    if (formData.state) {
      setDistrictInput(formData.state);
    }
  }, [formData.state]);

  // Handle address option change
  const handleAddressOptionChange = async (option, addressList = userAddresses) => {
    // Early return if clicking on the already selected option
    if (option === addressOption) return;

    setAddressOption(option);

    switch (option) {
      case 'new':
        // Clear form data and enable fields for new address entry
        setFieldsDisabled(false);
        setSelectedAddress(null);
        setFormData(prev => ({
          ...prev,
          street: '',
          city: '',
          state: '',
          postalCode: '',
        }));
        setDistrictInput('');
        setShowSuggestions(false);
        break;

      case 'default':
        // First fetch user profile data
        await fetchUserProfile();

        const defaultAddress = addressList.find(addr => addr.isDefault);
        if (defaultAddress) {
          setFieldsDisabled(true);
          setSelectedAddress(defaultAddress._id);
          setFormData(prev => ({
            ...prev,
            firstName: defaultAddress.firstName || prev.firstName,
            lastName: defaultAddress.lastName || prev.lastName,
            email: defaultAddress.email || prev.email,
            street: defaultAddress.street || '',
            city: defaultAddress.city || '',
            state: defaultAddress.state || '',
            postalCode: defaultAddress.postalCode || '',
            phoneNumber: defaultAddress.phoneNumber || prev.phoneNumber
          }));
          setDistrictInput(defaultAddress.state || '');
        } else {
          toast.warning('No default address found');
          setAddressOption('new');
          setFieldsDisabled(false);
        }
        break;

      case 'saved':
        setFieldsDisabled(false);
        setSelectedAddress(null);
        setFormData(prev => ({
          ...prev,
          street: '',
          city: '',
          state: '',
          postalCode: '',
        }));
        setDistrictInput('');
        break;

      default:
        break;
    }
  };

  // Handle saved address selection
  const handleAddressSelect = (address) => {
    setSelectedAddress(address._id);
    setFieldsDisabled(true);

    setFormData(prev => ({
      ...prev,
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
    }));
    setDistrictInput(address.state || '');
  };

  const onChangeHandler = (event) => {
    if (fieldsDisabled && ['street', 'city', 'state', 'postalCode'].includes(event.target.name)) {
      return;
    }

    const name = event.target.name;
    const value = event.target.value;

    setFormData((data) => ({ ...data, [name]: value }));
  };

  const handleDistrictInputChange = (e) => {
    if (fieldsDisabled) return;

    const value = e.target.value;
    const sanitizedValue = DOMPurify.sanitize(value.trim());

    setDistrictInput(sanitizedValue);
    setFormData((data) => ({ ...data, state: sanitizedValue }));

    if (!showSuggestions) {
      setShowSuggestions(true);
    }
  };

  const handleSelectDistrict = (district) => {
    if (fieldsDisabled) return;

    const sanitizedDistrict = DOMPurify.sanitize(district);

    setDistrictInput(sanitizedDistrict);
    setFormData((data) => ({ ...data, state: sanitizedDistrict }));
    setShowSuggestions(false);
  };

  const validateInputs = () => {
    const sanitizedData = {};
    for (const key in formData) {
      sanitizedData[key] = DOMPurify.sanitize(formData[key].trim());
    }

    if (!sanitizedData.firstName || sanitizedData.firstName.length < 2 || /^\d+$/.test(sanitizedData.firstName)) {
      toast.error('First name must be at least 2 characters and cannot be only numbers.');
      return false;
    }
    if (!sanitizedData.lastName || sanitizedData.lastName.length < 2 || /^\d+$/.test(sanitizedData.lastName)) {
      toast.error('Last name must be at least 2 characters and cannot be only numbers.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sanitizedData.email || !emailRegex.test(sanitizedData.email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }

    const phoneRegex = /^\+?\d{10,12}$/;
    if (!sanitizedData.phoneNumber || !phoneRegex.test(sanitizedData.phoneNumber)) {
      toast.error('Please enter a valid phone number (10-12 digits).');
      return false;
    }

    const streetRegex = /^[a-zA-Z0-9\s.,\-/]+$/;
    if (!sanitizedData.street || sanitizedData.street.length < 2 || !streetRegex.test(sanitizedData.street)) {
      toast.error('Street must be at least 2 characters long and can only contain letters, numbers, spaces, and special characters (.,-/).');
      return false;
    }

    const cityRegex = /^[a-zA-Z0-9\s.,-]+$/;
    if (!sanitizedData.city || sanitizedData.city.length < 2 || !cityRegex.test(sanitizedData.city)) {
      toast.error('City must be at least 2 characters long and can only contain letters, numbers, spaces, and special characters (.,-/).');
      return false;
    }

    if (!sanitizedData.state || sanitizedData.state.length < 2 || !districts.includes(sanitizedData.state)) {
      toast.error('Please select a valid district.');
      return false;
    }

    if (!sanitizedData.postalCode || sanitizedData.postalCode.length < 4 || isNaN(sanitizedData.postalCode)) {
      toast.error('Postal code must be a valid number with at least 4 digits.');
      return false;
    }

    return sanitizedData;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;

    const sanitizedData = validateInputs();
    if (!sanitizedData) return;

    if (!verifyStockAvailability()) {
      return;
    }

    try {
      setIsSubmitting(true);

      let orderItems = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find((product) => product._id === items));
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      // Add a stock warning banner if any items are low in stock
      const lowStockItems = orderItems.filter(item => {
        const product = products.find(p => p._id === item._id);
        return product && product.quantity <= 5 && product.quantity > 0;
      });

      if (lowStockItems.length > 0) {
        toast.info(
          <div>
            <p>Some items are low in stock:</p>
            <ul className="mt-2 list-disc pl-4">
              {lowStockItems.map((item, i) => (
                <li key={i} className="text-sm">
                  {item.name}: Only {products.find(p => p._id === item._id).quantity} left
                </li>
              ))}
            </ul>
          </div>,
          { autoClose: 5000 }
        );
      }

      // Order placement logic
      const orderData = {
        userId: '', // Will be filled from token on server
        address: sanitizedData,
        items: orderItems,
        amount: getCartAmount() + deliveryCharge
      };

      switch (method) {
        case 'cod':
          const response = await axios.post(`${backendUrl}/api/order/place`, orderData, {
            headers: { token }
          });
          if (response.data.success) {
            recordPurchaseInteractions(cartItems);
            setCartItems({});
            toast.success('Order placed successfully!');
            navigate('/orders');
          } else {
            toast.error(response.data.message || 'Failed to place order');
          }
          break;

        case 'stripe':
          const responseStripe = await axios.post(`${backendUrl}/api/order/stripe`, orderData, {
            headers: { token }
          });
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(responseStripe.data.message || 'Failed to create payment session');
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error.response?.data?.message || 'An error occurred while placing the order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render cart items with quantity
  const renderCartItemsWithQuantity = () => {
    return (
      <div className="mt-4 border-t pt-4">
        <h3 className="font-medium text-gray-700 mb-2">Order Summary:</h3>
        {/* Scroll indicator */}
        {Object.keys(cartItems).length > 3 && (
          <div className="text-center py-1 text-xs text-gray-500 bg-gray-100 border-t">
            Scroll to see more items
          </div>
        )}
        <div className="max-h-60 overflow-y-auto pr-1 border border-gray-200 rounded-md bg-gray-50">
          <div className="p-2">
            {Object.keys(cartItems).map(itemId => {
              const product = products.find(p => p._id === itemId);
              if (!product) return null;

              return Object.keys(cartItems[itemId]).map(variant => {
                const quantity = cartItems[itemId][variant];
                if (quantity <= 0) return null;

                // Parse variant to extract size and color
                let displayVariant = '';
                const [size, color] = variant.split('_');
                if (size !== 'undefined') displayVariant += `Size: ${size} `;
                if (color !== 'undefined') displayVariant += `Color: ${color}`;

                // Check if item is out of stock or over-requested
                const isStockIssue = product.quantity < quantity;

                return (
                  <div key={`${itemId}-${variant}`} className={`flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0
                    ${isStockIssue ? 'bg-red-50 border-red-300' : 'bg-white'} rounded-sm mb-1 px-2`}>
                    <div className="flex items-center">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium">{product.name}</p>
                        {displayVariant && <p className="text-xs text-gray-500">{displayVariant}</p>}
                        <div className="flex items-center">
                          <p className="text-xs font-medium">Qty: {quantity}</p>
                          {isStockIssue && (
                            <span className="ml-2 text-xs text-red-600">
                              (Only {product.quantity} available)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium">
                      {currency}{(product.price * quantity).toFixed(2)}
                    </p>
                  </div>
                );
              }).filter(Boolean);
            })}
          </div>
          
        </div>
      </div>
    );
  }

  // Check if cart is empty
  const isCartEmpty = !Object.keys(cartItems).length;

  if (isCartEmpty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <img src={assets.empty_cart} alt="Empty Cart" className="w-32 h-32 mb-4 opacity-60" />
        <h2 className="text-xl font-medium text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6 text-center">Add some items to your cart before checking out.</p>
        <button
          onClick={() => navigate('/shop')}
          className="bg-black text-white px-6 py-2 rounded-sm hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col px-4 md:px-6 md:flex-row justify-between gap-4 pt-5 md:pt-14 min-h-[80vh] border-t">
      <div className="flex flex-col gap-4 w-full md:max-w-[480px]">
        <div className="text-lg md:text-2xl my-3">
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>

        {/* Address selection options */}
        <div className="mb-4 p-3 md:p-4 bg-gray-50 rounded-md border border-gray-200">
          <p className="font-medium mb-3 text-sm md:text-base text-gray-700">Choose delivery address:</p>

          <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-3">
            <label className="flex items-center cursor-pointer py-1">
              <input
                type="radio"
                checked={addressOption === 'new'}
                onChange={() => handleAddressOptionChange('new')}
                className="mr-2 w-4 h-4 accent-blue-500"
                name="addressOption"
              />
              <span className="text-sm">Enter new details</span>
            </label>

            {userAddresses.some(addr => addr.isDefault) && (
              <label className="flex items-center cursor-pointer py-1">
                <input
                  type="radio"
                  checked={addressOption === 'default'}
                  onChange={() => handleAddressOptionChange('default')}
                  className="mr-2 w-4 h-4 accent-blue-500"
                  name="addressOption"
                />
                <span className="text-sm">Use default information</span>
              </label>
            )}

            {userAddresses.length > 0 && (
              <label className="flex items-center cursor-pointer py-1">
                <input
                  type="radio"
                  checked={addressOption === 'saved'}
                  onChange={() => handleAddressOptionChange('saved')}
                  className="mr-2 w-4 h-4 accent-blue-500"
                  name="addressOption"
                />
                <span className="text-sm">Select saved address</span>
              </label>
            )}
          </div>

          {/* Saved addresses dropdown */}
          {addressOption === 'saved' && userAddresses.length > 0 && (
            <div className="mt-3 p-2 border border-gray-300 rounded">
              <p className="text-xs md:text-sm mb-2 text-gray-500">Select an address:</p>
              <div className="max-h-40 overflow-y-auto">
                {userAddresses.map((address) => (
                  <div
                    key={address._id}
                    onClick={() => handleAddressSelect(address)}
                    className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${selectedAddress === address._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <p className="font-medium text-sm">{address.addressName || 'Address'} {address.isDefault && <span className="text-xs text-blue-600">(Default)</span>}</p>
                    <p className="text-xs text-gray-500 break-words">
                      {address.street}, {address.city}, {address.state}, {address.postalCode}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            type="text"
            placeholder="First name"
            className="border border-gray-300 rounded px-3 py-2 md:py-1.5 w-full text-sm md:text-base"
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            type="text"
            placeholder="Last name"
            className="border border-gray-300 rounded px-3 py-2 md:py-1.5 w-full text-sm md:text-base"
          />
        </div>

        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          type="email"
          placeholder="Email Address"
          className="border border-gray-300 rounded px-3 py-2 md:py-1.5 w-full text-sm md:text-base"
        />

        <input
          required
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          type="text"
          placeholder="Street"
          className={`border ${fieldsDisabled ? 'bg-gray-100 border-gray-200' : 'border-gray-300'} rounded px-3 py-2 md:py-1.5 w-full text-sm md:text-base`}
          disabled={fieldsDisabled}
        />

        <div className="flex flex-col md:flex-row gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            type="text"
            placeholder="City"
            className={`border ${fieldsDisabled ? 'bg-gray-100 border-gray-200' : 'border-gray-300'} rounded px-3 py-2 md:py-1.5 w-full text-sm md:text-base`}
            disabled={fieldsDisabled}
          />

          <div className="relative w-full mt-3 md:mt-0" ref={autocompleteRef}>
            <input
              required
              value={districtInput}
              onChange={handleDistrictInputChange}
              onFocus={() => !fieldsDisabled && setShowSuggestions(true)}
              type="text"
              placeholder="District"
              className={`border ${fieldsDisabled ? 'bg-gray-100 border-gray-200' : 'border-gray-300'} rounded px-3 py-2 md:py-1.5 w-full text-sm md:text-base`}
              disabled={fieldsDisabled}
            />
            {showSuggestions && !fieldsDisabled && (
              <ul className="absolute z-20 w-full mt-1 max-h-52 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
                {filteredDistricts.length > 0 ? (
                  filteredDistricts.map((district, index) => (
                    <li
                      key={index}
                      className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSelectDistrict(district)}
                    >
                      {district}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2.5 text-gray-500 text-sm">No districts found</li>
                )}
              </ul>
            )}
          </div>
        </div>

        <input
          required
          onChange={onChangeHandler}
          name="postalCode"
          value={formData.postalCode}
          type="number"
          placeholder="Postal Code"
          className={`border ${fieldsDisabled ? 'bg-gray-100 border-gray-200' : 'border-gray-300'} rounded px-3 py-2 md:py-1.5 w-full text-sm md:text-base`}
          disabled={fieldsDisabled}
        />

        <input
          required
          onChange={onChangeHandler}
          name="phoneNumber"
          value={formData.phoneNumber}
          type="tel"
          pattern="^\+?\d{10,12}$"
          maxLength={12}
          placeholder="Phone Number"
          className="border border-gray-300 rounded px-3 py-2 md:py-1.5 w-full text-sm md:text-base"
        />
      </div>

      <div className="mt-8 md:mt-0 md:min-w-[320px] lg:min-w-[380px] w-full md:w-auto">
        <div className="mt-2 md:mt-8">
          <CartTotal />

          {/* Display cart items with quantity */}
          {renderCartItemsWithQuantity()}

          {/* Stock error warning */}
          {stockError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-800">
              <p className="font-medium">Some items in your cart have stock issues:</p>
              <ul className="mt-2 list-disc pl-4">
                {outOfStockItems.map((item, i) => (
                  <li key={i}>
                    {item.name}: Available {item.available}, Requested {item.requested}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 md:mt-12">
          <Title text1={'PAYMENT'} text2={'METHOD'} />
          <div className="flex flex-col gap-2 mt-3">
            <div
              onClick={() => setMethod('stripe')}
              className={`flex items-center gap-3 p-3 cursor-pointer border rounded ${method === 'stripe' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${method === 'stripe' ? 'border-green-500' : 'border-gray-300'}`}>
                {method === 'stripe' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
              </div>
              <img className="h-5 mx-4" src={assets.stripe_logo} alt="Stripe" />
            </div>

            <div
              onClick={() => setMethod('cod')}
              className={`flex items-center gap-3 p-3 cursor-pointer border rounded ${method === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${method === 'cod' ? 'border-green-500' : 'border-gray-300'}`}>
                {method === 'cod' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
              </div>
              <p className="text-gray-700 text-sm font-medium mx-4">CASH ON DELIVERY</p>
            </div>
          </div>

          <div className="w-full flex justify-center md:justify-end mt-8 mb-8 md:mb-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${isSubmitting ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'} text-white px-8 md:px-16 py-3 w-full md:w-auto text-sm font-medium rounded-sm transition-colors`}
            >
              {isSubmitting ? 'PROCESSING...' : 'PLACE ORDER'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;