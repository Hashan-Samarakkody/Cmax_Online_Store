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
                data: formData,
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