import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { backendUrl } from '../App';
import { useNavigate } from 'react-router-dom';

const AdminManagement = ({ token }) => {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        role: '',
        active: ''
    });

    // Fetch all admins
    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                setLoading(true);

                // Build query parameters
                const queryParams = new URLSearchParams();
                if (filter.role) queryParams.append('role', filter.role);
                if (filter.active !== '') queryParams.append('active', filter.active);

                const response = await axios.get(
                    `${backendUrl}/api/admin/all?${queryParams.toString()}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    setAdmins(response.data.admins);
                } else {
                    toast.error(response.data.message);

                    // If unauthorized, redirect to login
                    if (response.data.message.includes('permission') ||
                        response.data.message.includes('Authentication')) {
                        navigate('/dashboard');
                    }
                }
            } catch (error) {
                console.error('Error fetching admins:', error);
                toast.error('Failed to load admin list');

                // Handle unauthorized access
                if (error.response && error.response.status === 401) {
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAdmins();
    }, [token, navigate, filter]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
    };

    // Toggle admin active status
    const toggleAdminStatus = async (adminId, currentStatus) => {
        try {
            const response = await axios.patch(
                `${backendUrl}/api/admin/toggle-status/${adminId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                // Update the admin in the state
                setAdmins(prev =>
                    prev.map(admin =>
                        admin._id === adminId
                            ? { ...admin, active: !currentStatus }
                            : admin
                    )
                );
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error toggling admin status:', error);
            toast.error('Failed to update admin status');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
                    <h1 className="text-2xl font-bold">Admin Management</h1>
                    <p className="text-green-100">Manage administrator accounts</p>
                </div>

                {/* Filters */}
                <div className="p-4 bg-green-50 border-b border-green-100">
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                name="role"
                                value={filter.role}
                                onChange={handleFilterChange}
                                className="rounded-md border border-gray-300 px-3 py-2 text-gray-700"
                            >
                                <option value="">All Roles</option>
                                <option value="superadmin">Superadmin</option>
                                <option value="manager">Manager</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="active"
                                value={filter.active}
                                onChange={handleFilterChange}
                                className="rounded-md border border-gray-300 px-3 py-2 text-gray-700"
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Deactivated</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Admin List */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                        </div>
                    ) : admins.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {admins.map(admin => (
                                        <tr key={admin._id} className={!admin.active ? 'bg-gray-100' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <img
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            src={admin.profileImage?.includes('http')
                                                                ? admin.profileImage
                                                                : `${backendUrl}/uploads/${admin.profileImage}`}
                                                            alt={admin.name}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://via.placeholder.com/40';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                                                        <div className="text-sm text-gray-500">{admin.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                                                        admin.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-green-100 text-green-800'}`}
                                                >
                                                    {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${admin.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {admin.active ? 'Active' : 'Deactivated'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {admin.lastLogin
                                                    ? new Date(admin.lastLogin).toLocaleString()
                                                    : 'Never logged in'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end h-full">
                                                {admin.role !== 'superadmin' && (
                                                    <button
                                                        onClick={() => toggleAdminStatus(admin._id, admin.active)}
                                                        className={`px-3 py-1.5 rounded text-white text-sm font-medium
                                                            ${admin.active
                                                                ? 'bg-red-500 hover:bg-red-600'
                                                                : 'bg-green-500 hover:bg-green-600'}`}
                                                    >
                                                        {admin.active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className="mt-2 font-medium">No admin accounts found</p>
                            <p>Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminManagement;