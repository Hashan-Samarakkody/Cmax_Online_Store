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
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, deliveryCharge, products } = useContext(ShopContext);

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

  const districts = [
    "Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya",
    "Puttalam", "Kurunegala", "Gampaha", "Colombo", "Kalutara",
    "Anuradhapura", "Polonnaruwa", "Matale", "Kandy", "Nuwara Eliya",
    "Kegalle", "Ratnapura", "Trincomalee", "Batticaloa", "Ampara",
    "Badulla", "Monaragala", "Hambantota", "Matara", "Galle"
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await axios.get(`${backendUrl}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success && response.data.user) {
            const { user } = response.data;
            // Set form data with user information
            setFormData({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phoneNumber: user.phoneNumber || '',
              street: user.street || '',
              city: user.city || '',
              state: user.state || '',
              postalCode: user.postalCode || ''
            });
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
  }, []);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    setFormData((data) => ({ ...data, [name]: value }));
  };

  const handleDistrictInputChange = (e) => {
    const value = e.target.value;
    const sanitizedValue = DOMPurify.sanitize(value.trim());

    setDistrictInput(sanitizedValue);
    setFormData((data) => ({ ...data, state: sanitizedValue }));

    if (!showSuggestions) {
      setShowSuggestions(true);
    }
  };

  const handleSelectDistrict = (district) => {
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

    if (!sanitizedData.street || sanitizedData.street.length < 5) {
      toast.error('Street must be at least 5 characters long.');
      return false;
    }
    if (!sanitizedData.city || sanitizedData.city.length < 2) {
      toast.error('City must be at least 2 characters long.');
      return false;
    }

    const validDistricts = [
      "Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya",
      "Puttalam", "Kurunegala", "Gampaha", "Colombo", "Kalutara",
      "Anuradhapura", "Polonnaruwa", "Matale", "Kandy", "Nuwara Eliya",
      "Kegalle", "Ratnapura", "Trincomalee", "Batticaloa", "Ampara",
      "Badulla", "Monaragala", "Hambantota", "Matara", "Galle"
    ];

    if (!sanitizedData.state || sanitizedData.state.length < 2 || !validDistricts.includes(sanitizedData.state)) {
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

    const sanitizedData = validateInputs();
    if (!sanitizedData) return;

    try {
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

      const orderData = {
        address: sanitizedData,
        items: orderItems,
        amount: getCartAmount() + deliveryCharge
      };

      switch (method) {
        case 'cod':
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } });
          if (response.data.success) {
            setCartItems({});
            navigate('/orders');
          } else {
            toast.error(response.data.message);
          }
          break;

        case 'stripe':
          const responseStripe = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: { token } });
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(responseStripe.data.message);
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while placing the order.');
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t">
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>

        <div className="flex gap-3">
          <input required onChange={onChangeHandler} name="firstName" value={formData.firstName} type="text" placeholder="First name" className="border border-gray-300 rounded px-3.5 py-1.5 w-full" />
          <input required onChange={onChangeHandler} name="lastName" value={formData.lastName} type="text" placeholder="Last name" className="border border-gray-300 rounded px-3.5 py-1.5 w-full" />
        </div>

        <input required onChange={onChangeHandler} name="email" value={formData.email} type="email" placeholder="Email Address" className="border border-gray-300 rounded px-3.5 py-1.5 w-full" />
        <input required onChange={onChangeHandler} name="street" value={formData.street} type="text" placeholder="Street" className="border border-gray-300 rounded px-3.5 py-1.5 w-full" />

        <div className="flex gap-3">
          <input required onChange={onChangeHandler} name="city" value={formData.city} type="text" placeholder="City" className="border border-gray-300 rounded px-3.5 py-1.5 w-full" />

          <div className="relative w-full" ref={autocompleteRef}>
            <input
              required
              value={districtInput}
              onChange={handleDistrictInputChange}
              onFocus={() => setShowSuggestions(true)}
              type="text"
              placeholder="District"
              className="border border-gray-300 rounded px-3.5 py-1.5 w-full"
            />
            {showSuggestions && (
              <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
                {filteredDistricts.length > 0 ? (
                  filteredDistricts.map((district, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectDistrict(district)}
                    >
                      {district}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-gray-500">No districts found</li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <input required onChange={onChangeHandler} name="postalCode" value={formData.postalCode} type="number" placeholder="Postal Code" className="border border-gray-300 rounded px-3.5 py-1.5 w-full" />
        </div>
        <input required onChange={onChangeHandler} name="phoneNumber" value={formData.phoneNumber} type="tel" pattern="^\+?\d{10,12}$" maxLength={12} placeholder="Phone Number" className="border border-gray-300 rounded px-3.5 py-1.5 w-full" />
      </div>

      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12 ">
          <Title text1={'PAYMENT'} text2={'METHOD'} />
          <div className="flex gap-3 flex-col lg:flex-row">
            <div onClick={() => setMethod('stripe')} className="flex items-center gap-3 p-2 px-3 cursor-pointer">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></p>
              <img className="h-5 mx-4" src={assets.stripe_logo} alt="" />
            </div>

            <div onClick={() => setMethod('cod')} className="flex items-center gap-3 p-2 px-3 cursor-pointer">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
              <p className="text-gray-500 text-sm font-medium mx-4">CASH ON DELIVERY</p>
            </div>
          </div>

          <div className="w-full text-end mt-8">
            <button type="submit" className="bg-black text-white px-16 py-3 text-sm rounded-sm">PLACE ORDER</button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
