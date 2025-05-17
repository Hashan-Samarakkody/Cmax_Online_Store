import React, { useState, useEffect, useContext, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';

const AddressManager = ({ user, setUser }) => {
    const { backendUrl, token } = useContext(ShopContext);
    const [addresses, setAddresses] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        addressName: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        isDefault: false
    });

    // For district autocomplete
    const [districtInput, setDistrictInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const autocompleteRef = useRef(null);

    // List of Sri Lankan districts
    const districts = [
        'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
        'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
        'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
        'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
        'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
    ];

    // Handle district input change
    const handleDistrictInputChange = (e) => {
        const value = DOMPurify.sanitize(e.target.value);
        setDistrictInput(value);
        setFormData({ ...formData, state: value });
    };

    // Select district from suggestions
    const handleSelectDistrict = (district) => {
        setDistrictInput(district);
        setFormData({ ...formData, state: district });
        setShowSuggestions(false);
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const sanitizedValue = DOMPurify.sanitize(type === 'checkbox' ? checked : value);

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : sanitizedValue
        });
    };

    const validatePostalCodeWithGeonames = async (postalCode, district) => {
        try {
            // This calls the geonames.org postal code search API
            const response = await axios.get(
                `http://api.geonames.org/postalCodeSearchJSON?postalcode=${postalCode}&country=LK&maxRows=10&username=demo`
            );

            // Check if we got any results
            if (response.data && response.data.postalCodes && response.data.postalCodes.length > 0) {
                // If district checking is desired
                if (district) {
                    // Some postal codes may match multiple places, so check if any match the district
                    return response.data.postalCodes.some(entry => {
                        // Check for district match (case-insensitive)
                        // The adminName1 or adminName2 field might contain the district name
                        const adminName1 = (entry.adminName1 || '').toLowerCase();
                        const adminName2 = (entry.adminName2 || '').toLowerCase();
                        const placeName = (entry.placeName || '').toLowerCase();
                        const districtLower = district.toLowerCase();

                        return adminName1.includes(districtLower) ||
                            districtLower.includes(adminName1) ||
                            adminName2.includes(districtLower) ||
                            districtLower.includes(adminName2) ||
                            placeName.includes(districtLower);
                    });
                }

                // If we're just checking if the postal code exists, return true
                return true;
            }

            // No matching postal codes found
            return false;
        } catch (error) {
            console.error('Error validating postal code with geonames:', error);
            // If the API call fails, we'll be lenient and allow the submission
            return true;
        }
      };

    const validateInputs = () => {
        const sanitizedData = { ...formData };
        for (const key in formData) {
            if (typeof formData[key] === 'string') {
                sanitizedData[key] = DOMPurify.sanitize(formData[key].trim());
            } else {
                sanitizedData[key] = formData[key];
            }
        }

        if (!sanitizedData.addressName || sanitizedData.addressName.length < 2) {
            toast.error('Address title must be at least 2 characters.');
            return false;
        }

        const streetRegex = /^[a-zA-Z0-9\s.,-/]+$/;
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

        const postalCodeRegex = /^\d{5}$/;
        if (!sanitizedData.postalCode || !postalCodeRegex.test(sanitizedData.postalCode)) {
            toast.error('Please enter a valid 5-digit postal code.');
            return false;
        }

        return sanitizedData;
    };

    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);

        try {
            // Get coordinates using browser's Geolocation API
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;

            // Use OpenStreetMap's Nominatim API for reverse geocoding (free and no API key required)
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );

            const address = response.data;

            // Extract address components
            const street = address.address.road || '';
            const houseNumber = address.address.house_number || '';
            const fullStreet = houseNumber ? `${houseNumber} ${street}` : street;
            const city = address.address.city || address.address.town || address.address.village || '';
            const state = address.address.state_district || address.address.state || '';
            const postalCode = address.address.postcode || '';

            // Find the closest district match (Sri Lanka specific)
            let closestDistrict = '';
            if (state) {
                closestDistrict = districts.find(district =>
                    state.toLowerCase().includes(district.toLowerCase())
                ) || '';
            }

            // Update form fields
            setFormData(prev => ({
                ...prev,
                street: fullStreet,
                city: city,
                state: closestDistrict || state,
                postalCode: postalCode
            }));

            setDistrictInput(closestDistrict || state);

            toast.success("Location detected successfully");
        } catch (error) {
            console.error("Error getting location:", error);
            toast.error("Couldn't detect your location. Please enter manually.");
        } finally {
            setIsLocating(false);
        }
    };

    // Fetch addresses
    const fetchAddresses = async () => {
        try {
            setIsLoading(true); // Add a loading state
            const response = await axios.get(`${backendUrl}/api/user/addresses`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setAddresses(response.data.addresses || []);
            } else {
                console.warn('No addresses returned or success is false');
                setAddresses([]);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            // Display a more specific error message
            if (error.response?.status === 404) {
                toast.error('Address service not available. Please try again later.');
            } else if (error.response?.status === 401) {
                toast.error('Your session has expired. Please log in again.');
                // Handle token expiration
            } else {
                toast.error('Failed to load addresses. Please check your connection.');
            }
            setAddresses([]); // Set empty array on error
        } finally {
            setIsLoading(false); // End loading state
        }
    };

    // Submit address form
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate inputs before proceeding
        const validatedData = validateInputs();
        if (!validatedData) {
            return; // Stop if validation failed
        }

        setIsSubmitting(true);

        try {
            let url = `${backendUrl}/api/user/addresses`;
            let method = 'post';

            if (editingAddress) {
                url = `${url}/${editingAddress._id}`;
                method = 'put';
            }

            const response = await axios({
                method,
                url,
                data: validatedData,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success(editingAddress ? 'Address updated successfully' : 'Address added successfully');
                await fetchAddresses();
                resetForm();
            }
        } catch (error) {
            console.error('Error saving address:', error);
            toast.error('Failed to save address');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete address
    const handleDelete = async (addressId) => {
        try {
            const response = await axios.delete(`${backendUrl}/api/user/addresses/${addressId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Address deleted successfully');
                await fetchAddresses();
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.error('Failed to delete address');
        }
    };

    // Set as default address
    const setDefaultAddress = async (addressId) => {
        try {
            const response = await axios.put(`${backendUrl}/api/user/addresses/${addressId}/default`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Default address updated');
                await fetchAddresses();
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            toast.error('Failed to update default address');
        }
    };

    // Edit address
    const handleEdit = (address) => {
        setEditingAddress(address);
        setFormData({
            addressName: address.addressName || '',
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            postalCode: address.postalCode || '',
            isDefault: address.isDefault || false
        });
        setDistrictInput(address.state || '');
        setShowAddForm(true);

        // Scroll to form
        setTimeout(() => {
            document.getElementById('addressForm')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            addressName: '',
            street: '',
            city: '',
            state: '',
            postalCode: '',
            isDefault: false
        });
        setDistrictInput('');
        setEditingAddress(null);
        setShowAddForm(false);
    };

    // Filter districts based on input
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

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch addresses on component mount
    useEffect(() => {
        if (token) {
            fetchAddresses();
        }
    }, [token]);

    return (
        <div className="px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <h2 className="text-xl font-semibold text-gray-800">My Addresses</h2>
                <button
                    onClick={() => {
                        resetForm();
                        setShowAddForm(!showAddForm);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                    disabled={isLoading}
                >
                    {showAddForm ? 'Cancel' : '+ Add New Address'}
                </button>
            </div>

            {/* Show loading state */}
            {isLoading && (
                <div className="flex justify-center my-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            )}

            {/* Address form */}
            {showAddForm && (
                <form id="addressForm" onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
                    <h3 className="text-lg font-medium mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>

                    {/* Add location detection button */}
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={isLocating}
                            className="flex items-center justify-center w-full bg-blue-50 text-blue-600 border border-blue-200 py-2.5 px-4 rounded-md hover:bg-blue-100 disabled:opacity-70"
                        >
                            {isLocating ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
                                    Detecting location...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Use My Current Location
                                </>
                            )}
                        </button>
                        <p className="text-xs text-red-500 mt-1 text-center">* <i>This feature won't work accurately in all locations. Please verify your address before saving.</i></p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="addressName"
                                value={formData.addressName}
                                onChange={handleChange}
                                placeholder="Home, Office, etc."
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Street Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>

                        <div className="relative" ref={autocompleteRef}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                District <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Select district"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                value={districtInput}
                                onChange={handleDistrictInputChange}
                                onFocus={() => setShowSuggestions(true)}
                                required
                            />
                            {showSuggestions && (
                                <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
                                    {filteredDistricts.length > 0 ? (
                                        filteredDistricts.map((district, index) => (
                                            <li
                                                key={index}
                                                className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm sm:text-base"
                                                onClick={() => handleSelectDistrict(district)}
                                            >
                                                {district}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-3 text-gray-500 text-sm">No districts found</li>
                                    )}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Postal Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isDefault"
                                name="isDefault"
                                checked={formData.isDefault}
                                onChange={handleChange}
                                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                                Set as default address
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-70 w-full sm:w-auto"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                        </button>
                    </div>
                </form>
            )}

            {/* Address cards */}
            {addresses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {addresses.map((address) => (
                        <div
                            key={address._id}
                            className={`border rounded-lg p-4 relative ${address.isDefault ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                        >
                            {address.isDefault && (
                                <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                    Default
                                </span>
                            )}

                            <div className="mb-2">
                                <h3 className="font-medium">{address.addressName}</h3>
                            </div>

                            <div className="text-gray-600 mb-4">
                                <p className="text-sm sm:text-base">{address.street}</p>
                                <p className="text-sm sm:text-base">{address.city}, {address.state} {address.postalCode}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleEdit(address)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium py-1.5 px-3 border border-blue-200 rounded-full hover:bg-blue-50"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(address._id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium py-1.5 px-3 border border-red-200 rounded-full hover:bg-red-50"
                                >
                                    Delete
                                </button>
                                {!address.isDefault && (
                                    <button
                                        onClick={() => setDefaultAddress(address._id)}
                                        className="text-green-600 hover:text-green-800 text-sm font-medium py-1.5 px-3 border border-green-200 rounded-full hover:bg-green-50"
                                    >
                                        Set as Default
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-500">You don't have any saved addresses yet.</p>
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="mt-3 text-green-600 hover:text-green-800 font-medium"
                        >
                            + Add your first address
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddressManager;