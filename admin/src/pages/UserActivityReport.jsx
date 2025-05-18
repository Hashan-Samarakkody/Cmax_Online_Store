import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiDownload, FiCalendar, FiLoader, FiUsers, FiShoppingBag, FiDollarSign, FiStar, FiClock } from 'react-icons/fi';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import WebSocketService from '../services/WebSocketService';
import * as XLSX from 'xlsx';

const UserActivityReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userActivity, setUserActivity] = useState([]);
    const [period, setPeriod] = useState('monthly');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [showDateRange, setShowDateRange] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const [growth, setGrowth] = useState({
        percentage: 0,
        positive: true
    });

    // Loyal customers state
    const [loyalCustomersLoading, setLoyalCustomersLoading] = useState(false);
    const [loyalCustomersError, setLoyalCustomersError] = useState(null);
    const [loyalCustomers, setLoyalCustomers] = useState([]);
    const [loyalCustomersSortBy, setLoyalCustomersSortBy] = useState('loyalty');
    const [loyalCustomersLimit, setLoyalCustomersLimit] = useState(5);
    const [showLoyalCustomers, setShowLoyalCustomers] = useState(false);
    const [dataRefreshed, setDataRefreshed] = useState(false);

    // Activity log state
    const [activityLog, setActivityLog] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityError, setActivityError] = useState(null);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const rowsPerPageOptions = [10, 25, 50, 100, 200, 300];

    // Get today's date in YYYY-MM-DD format for the max date attribute
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchUserActivity();

        // Set up WebSocket listeners for real-time updates
        const handleLoyaltyUpdate = (data) => {
            // Only refresh if the loyal customers section is visible
            if (showLoyalCustomers) {
                console.log('Loyalty update received:', data);

                // Background refresh (true parameter prevents loading state)
                fetchLoyalCustomers(true);

                // Display refresh indicator with the type of update that occurred
                let updateMessage = 'Data refreshed';
                if (data.action) {
                    switch (data.action) {
                        case 'order':
                            updateMessage = 'New order detected';
                            break;
                        case 'review':
                            updateMessage = 'New review added';
                            break;
                        case 'updateReview':
                            updateMessage = 'Review updated';
                            break;
                        case 'deleteReview':
                            updateMessage = 'Review deleted';
                            break;
                    }
                }

                // Display toast notification for the update
                toast.info(updateMessage);

                // Visual indicator
                setDataRefreshed(true);
                setTimeout(() => setDataRefreshed(false), 3000);
            }
        };

        // Connect to WebSocket if not already connected
        if (!WebSocketService.isConnected()) {
            WebSocketService.connect();
        }

        // Register event listeners for all relevant events
        WebSocketService.on('loyaltyUpdate', handleLoyaltyUpdate);
        WebSocketService.on('newOrder', handleLoyaltyUpdate);
        WebSocketService.on('deleteReview', handleLoyaltyUpdate);
        WebSocketService.on('newReview', handleLoyaltyUpdate);
        WebSocketService.on('updateReview', handleLoyaltyUpdate);

        // Cleanup listeners on component unmount
        return () => {
            WebSocketService.off('loyaltyUpdate', handleLoyaltyUpdate);
            WebSocketService.off('newOrder', handleLoyaltyUpdate);
            WebSocketService.off('deleteReview', handleLoyaltyUpdate);
            WebSocketService.off('newReview', handleLoyaltyUpdate);
            WebSocketService.off('updateReview', handleLoyaltyUpdate);
        };
    }, [period, showLoyalCustomers]);

    useEffect(() => {
        if (showActivityLog) {
            fetchActivityLog();
        }
    }, [showActivityLog, dateRange.startDate, dateRange.endDate]);

    useEffect(() => {
        if (showLoyalCustomers) {
            fetchLoyalCustomers();
        }
    }, [showLoyalCustomers, loyalCustomersSortBy, loyalCustomersLimit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [dateRange.startDate, dateRange.endDate, rowsPerPage]);

    const fetchUserActivity = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) {
                navigate('/');
                return;
            }

            // Prepare query parameters
            let queryParams = new URLSearchParams();
            queryParams.append('period', period);

            // Only add date range parameters if 're showing the date range AND both dates are selected
            if (showDateRange && dateRange.startDate && dateRange.endDate) {
                queryParams.append('startDate', dateRange.startDate);
                queryParams.append('endDate', dateRange.endDate);
            }

            // Fetch user activity data
            const response = await axios.get(
                `${backendUrl}/api/dashboard/user-activity-report?${queryParams.toString()}`,
                { headers: { token } }
            );

            if (response.data.success) {

                if (response.data.userActivity.length === 0) {
                    toast.info('No user activity data found for the selected period');
                }

                setUserActivity(response.data.userActivity);
                calculateTotalAndGrowth(response.data.userActivity);
            } else {
                setError(response.data.message || 'Failed to fetch user activity data');
            }
        } catch (error) {
            console.error('Error fetching user activity:', error);
            setError(error.response?.data?.message || error.message);
            toast.error('Failed to load user activity data');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityLog = async (isBackgroundRefresh = false) => {
        try {
            if (!isBackgroundRefresh) {
                setActivityLoading(true);
            }
            setActivityError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) {
                navigate('/');
                return;
            }

            // Prepare query parameters
            let queryParams = new URLSearchParams();

            // Add date range if applicable
            if (showDateRange && dateRange.startDate && dateRange.endDate) {
                queryParams.append('startDate', dateRange.startDate);
                queryParams.append('endDate', dateRange.endDate);
            }

            // Add pagination parameters
            queryParams.append('limit', 300); // Always fetch maximum allowed for client-side pagination

            const response = await axios.get(
                `${backendUrl}/api/dashboard/user-activity-log?${queryParams.toString()}`,
                { headers: { token } }
            );

            if (response.data.success) {
                setActivityLog(response.data.activities);
                // Reset to first page when new data is loaded
                setCurrentPage(1);

                if (response.data.activities.length === 0 && !isBackgroundRefresh) {
                    toast.info('No user activity log found for the selected period');
                }
            } else {
                setActivityError(response.data.message || 'Failed to fetch user activity log');
            }
        } catch (error) {
            console.error('Error fetching user activity log:', error);
            setActivityError(error.response?.data?.message || error.message);
            if (!isBackgroundRefresh) {
                toast.error('Failed to load user activity log');
            }
        } finally {
            if (!isBackgroundRefresh) {
                setActivityLoading(false);
            } else {
                setActivityLoading(false);
            }
        }
    };

    const fetchLoyalCustomers = async (isBackgroundRefresh = false) => {
        try {
            // Only show loading indicator if not a background refresh
            if (!isBackgroundRefresh) {
                setLoyalCustomersLoading(true);
            }

            setLoyalCustomersError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) {
                navigate('/');
                return;
            }

            // Prepare query parameters with timestamp to ensure fresh data
            const queryParams = new URLSearchParams();
            queryParams.append('sortBy', loyalCustomersSortBy);
            queryParams.append('limit', loyalCustomersLimit);
            queryParams.append('_t', Date.now()); // Prevent caching

            // Use same period from user activity report if date range is active
            if (showDateRange && dateRange.startDate && dateRange.endDate) {
                queryParams.append('period', 'month');
            }

            // Fetch loyal customers data
            const response = await axios.get(
                `${backendUrl}/api/dashboard/loyal-customers?${queryParams.toString()}`,
                { headers: { token } }
            );

            if (response.data.success) {
                setLoyalCustomers(response.data.customers);
                if (response.data.customers.length === 0 && !isBackgroundRefresh) {
                    toast.info('No loyal customer data found for the selected criteria');
                }
            } else {
                setLoyalCustomersError(response.data.message || 'Failed to fetch loyal customers data');
                if (!isBackgroundRefresh) {
                    toast.error('Failed to load loyal customers data');
                }
            }
        } catch (error) {
            console.error('Error fetching loyal customers:', error);
            setLoyalCustomersError(error.response?.data?.message || error.message);
            if (!isBackgroundRefresh) {
                toast.error('Failed to load loyal customers data');
            }
        } finally {
            if (!isBackgroundRefresh) {
                setLoyalCustomersLoading(false);
            } else {
                // For background refreshes, still need to turn off loading state
                // but  do it silently
                setLoyalCustomersLoading(false);
            }
        }
    };

    const handleExportActivityLogExcel = () => {
        if (!activityLog.length) return;

        // Format data for export
        const exportData = activityLog.map(activity => ({
            'First Name': activity.firstName || '',
            'User Name': activity.username || '',
            'Email': activity.email || '',
            'Last Logged In': formatDate(activity.lastLogin) || '',
            'Activity': activity.actionType || '',
            'Order ID': activity.orderId || '',
            'Return ID': activity.returnId || '',
            'Loyalty Score': activity.loyaltyScore || '0',
            'Date': formatDate(activity.date) || ''
        }));

        // Add workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Add styles to the worksheet
        const activityTypes = {
            'Placed an order': 'e6ffed', // light green
            'Added a review': 'f0f0f0',  // light gray
            'Placed a return request': 'ffdce0', // light red
            'Logged in': 'ffffff' // white
        };

        // Apply cell styles based on activity type
        exportData.forEach((row, idx) => {
            // Add 1 to idx because of header row
            const rowIndex = idx + 1;
            // Get background color for this activity type
            const bgColor = activityTypes[row['Activity']] || 'ffffff';

            // Skip the header row (idx = 0)
            if (idx >= 0) {
                // Apply background color to all cells in the row
                Object.keys(row).forEach((key, colIdx) => {
                    const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIdx });
                    if (!ws[cellRef]) ws[cellRef] = {};
                    if (!ws[cellRef].s) ws[cellRef].s = {};
                    ws[cellRef].s = { fill: { fgColor: { rgb: bgColor } } };
                });
            }
        });

        // Add the worksheet to the workbook and save
        XLSX.utils.book_append_sheet(wb, ws, 'User Activity Log');

        const fileName = `user_activity_log_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const calculateTotalAndGrowth = (data) => {
        // Calculate total registrations
        const total = data.reduce((sum, item) => sum + item.registrations, 0);
        setTotalUsers(total);

        // Calculate growth rate by comparing periods
        if (data.length > 1) {
            const currentPeriod = data[data.length - 1].registrations;
            const previousPeriod = data[data.length - 2].registrations;

            if (previousPeriod > 0) {
                const growthRate = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
                setGrowth({
                    percentage: Math.abs(growthRate).toFixed(2),
                    positive: growthRate >= 0
                });
            }
        }
    };

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyDateRange = () => {
        if (!dateRange.startDate || !dateRange.endDate) {
            toast.warning('Please select both start and end dates');
            return;
        }

        if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
            toast.warning('Start date cannot be after end date');
            return;
        }

        fetchUserActivity();

        // Also refresh loyal customers if that section is visible
        if (showLoyalCustomers) {
            fetchLoyalCustomers();
        }
    };

    const handleResetDateRange = () => {
        setDateRange({
            startDate: '',
            endDate: ''
        });
        setShowDateRange(false);
        fetchUserActivity();

        // Also refresh loyal customers if that section is visible
        if (showLoyalCustomers) {
            fetchLoyalCustomers();
        }
    };

    const handleExportCSV = () => {
        // Generate CSV content
        const headers = ['Period', 'New Registrations'];
        const rows = userActivity.map(item => [item.period, item.registrations]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Add download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Set file name based on period and date range
        let fileName = `user_activity_${period}`;
        if (showDateRange && dateRange.startDate && dateRange.endDate) {
            fileName += `_${dateRange.startDate}_to_${dateRange.endDate}`;
        }

        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportLoyalCustomersCSV = () => {
        if (!loyalCustomers.length) return;

        // Generate CSV content
        const headers = ['Name', 'Email', 'Orders', 'Total Spent', 'Reviews', 'Avg Rating', 'Last Order', 'Loyalty Score'];
        const rows = loyalCustomers.map(customer => [
            customer.name,
            customer.email,
            customer.orderCount,
            customer.totalSpent.toFixed(2),
            customer.reviewCount,
            customer.averageRating,
            new Date(customer.lastOrder).toLocaleDateString(),
            customer.loyaltyScore
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Add download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Set file name
        const fileName = `loyal_customers_report_${new Date().toISOString().split('T')[0]}`;

        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatCurrency = (amount) => {
        return `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };


    return (
        <div className="p-6 mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">User Activity Report</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="ml-1">Back to Dashboard</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                {/* Report Controls */}
                <div className="flex flex-col md:flex-row md:justify-between mb-6 space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div>
                            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                                Time Period
                            </label>
                            <select
                                id="period"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm px-4 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    {/* User Activity Log Toggle Button */}
                    <div className="mt-12 mb-6">
                        <button
                            onClick={() => {
                                setShowActivityLog(!showActivityLog);
                                if (!showActivityLog) fetchActivityLog();
                            }}
                            className={`flex items-center px-4 py-2 rounded-md ${showActivityLog ? 'bg-indigo-700' : 'bg-indigo-600'} text-white hover:bg-indigo-700 transition-colors`}
                        >
                            <FiClock className="mr-2" />
                            {showActivityLog ? 'Hide Activity Log' : 'Show Detailed Activity Log'}
                        </button>
                    </div>

                </div>

                {/* User Activity Log Section */}
                {showActivityLog && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <h2 className="text-2xl font-bold">Detailed User Activity Log</h2>
                                {dataRefreshed && (
                                    <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-md animate-pulse">
                                        Data refreshed
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleExportActivityLogExcel}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700"
                            >
                                <FiDownload className="mr-2" />
                                Export Excel
                            </button>
                        </div>

                        {/* Loading State */}
                        {activityLoading && (
                            <div className="flex justify-center items-center h-64">
                                <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
                            </div>
                        )}

                        {/* Error State */}
                        {activityError && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                                <p className="text-red-800">{activityError}</p>
                            </div>
                        )}

                        {/* Activity Log Table */}
                        {!activityLoading && !activityError && activityLog.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <label htmlFor="rowsPerPage" className="block text-sm font-medium text-gray-700 mb-1">
                                                Rows per page
                                            </label>
                                            <select
                                                id="rowsPerPage"
                                                value={rowsPerPage}
                                                onChange={(e) => {
                                                    setRowsPerPage(Number(e.target.value));
                                                    setCurrentPage(1); // Reset to first page when changing rows per page
                                                }}
                                                className="rounded-md border-gray-300 shadow-sm px-4 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                {rowsPerPageOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Showing {activityLog.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0} to {Math.min(currentPage * rowsPerPage, activityLog.length)} of {activityLog.length} entries
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                                                <th className="px-4 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                                                <th className="px-4 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                                                <th className="px-4 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">Reference ID</th>
                                                <th className="px-4 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">Loyalty Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {activityLog
                                                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                                                .map((activity, index) => {
                                                    // Set background color based on activity type
                                                    let bgColorClass = '';
                                                    switch (activity.actionType) {
                                                        case 'Placed an order':
                                                            bgColorClass = 'bg-green-50';
                                                            break;
                                                        case 'Added a review':
                                                            bgColorClass = 'bg-gray-50';
                                                            break;
                                                        case 'Placed a return request':
                                                            bgColorClass = 'bg-red-50';
                                                            break;
                                                        case 'Logged in':
                                                        default:
                                                            bgColorClass = 'bg-white';
                                                    }

                                                    return (
                                                        <tr key={index} className={bgColorClass}>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        <img
                                                                            className="h-10 w-10 rounded-full object-cover"
                                                                            src={activity.profileImage || 'https://via.placeholder.com/100'}
                                                                            alt=""
                                                                        />
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900">{activity.firstName} {activity.lastName}</div>
                                                                        <div className="text-xs text-gray-500">{activity.email}</div>
                                                                        <div className="text-xs text-gray-400">@{activity.username}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(activity.lastLogin)}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${activity.actionType === 'Placed an order' ? 'bg-green-100 text-green-800' :
                                                                        activity.actionType === 'Added a review' ? 'bg-gray-100 text-gray-800' :
                                                                            activity.actionType === 'Placed a return request' ? 'bg-red-100 text-red-800' :
                                                                                'bg-blue-100 text-blue-800'}`}>
                                                                    {activity.actionType}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {activity.orderId && <div><span className="font-medium">Order:</span> {activity.orderId}</div>}
                                                                {activity.returnId && <div><span className="font-medium">Return:</span> {activity.returnId}</div>}
                                                                {activity.reviewId && <div><span className="font-medium">Review</span></div>}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <span className="text-sm font-medium text-indigo-600">{activity.loyaltyScore || '0'}</span>
                                                                    <div className="ml-3 bg-gray-200 rounded-full h-2 w-20">
                                                                        <div
                                                                            className="bg-indigo-600 h-2 rounded-full"
                                                                            style={{ width: `${Math.min((activity.loyaltyScore || 0) * 10, 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 rounded-md mr-2 ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                        >
                                            First
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 rounded-md mr-2 ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-700">
                                            Page {currentPage} of {Math.ceil(activityLog.length / rowsPerPage)}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(activityLog.length / rowsPerPage)))}
                                            disabled={currentPage === Math.ceil(activityLog.length / rowsPerPage)}
                                            className={`px-3 py-1 rounded-md ml-2 ${currentPage === Math.ceil(activityLog.length / rowsPerPage) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                        >
                                            Next
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(Math.ceil(activityLog.length / rowsPerPage))}
                                            disabled={currentPage === Math.ceil(activityLog.length / rowsPerPage)}
                                            className={`px-3 py-1 rounded-md ml-2 ${currentPage === Math.ceil(activityLog.length / rowsPerPage) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                        >
                                            Last
                                        </button>
                                    </div>

                                    <div className="text-sm text-gray-600">
                                        Jump to page:
                                        <input
                                            type="number"
                                            min="1"
                                            max={Math.ceil(activityLog.length / rowsPerPage)}
                                            value={currentPage}
                                            onChange={(e) => {
                                                const page = parseInt(e.target.value);
                                                if (page >= 1 && page <= Math.ceil(activityLog.length / rowsPerPage)) {
                                                    setCurrentPage(page);
                                                }
                                            }}
                                            className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* No Data State */}
                        {!activityLoading && !activityError && activityLog.length === 0 && (
                            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 text-lg">No activity log data available for the selected period.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Date Range Controls */}
                {showDateRange && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiCalendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="startDate"
                                        max={dateRange.endDate || today}
                                        value={dateRange.startDate}
                                        onChange={handleDateRangeChange}
                                        className="pl-10 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiCalendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="endDate"
                                        max={today}
                                        min={dateRange.startDate}
                                        value={dateRange.endDate}
                                        onChange={handleDateRangeChange}
                                        className="pl-10 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleApplyDateRange}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
                                >
                                    Apply
                                </button>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleResetDateRange}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm hover:bg-gray-700"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <FiUsers className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-blue-900">Total New Users</p>
                                <p className="text-2xl font-semibold">{totalUsers}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`${growth.positive ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
                        <div className="flex items-center">
                            <div className={`${growth.positive ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-full`}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-6 w-6 ${growth.positive ? 'text-green-600' : 'text-red-600'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    {growth.positive ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    )}
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${growth.positive ? 'text-green-900' : 'text-red-900'}`}>
                                    Growth Rate (Period to Period)
                                </p>
                                <p className="text-2xl font-semibold">
                                    {growth.percentage}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Data Visualization */}
                {!loading && !error && userActivity.length > 0 && (
                    <>
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4">User Registration Trend</h2>
                            <div className="h-80 bg-white">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={userActivity}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="period"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => {
                                                if (period === 'monthly') {
                                                    // Format YYYY-MM to MMM YYYY
                                                    const [year, month] = value.split('-');
                                                    return new Date(`${year}-${month}-01`).toLocaleDateString('default', { month: 'short', year: 'numeric' });
                                                }
                                                return value;
                                            }}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value) => [`${value} users`, 'New Registrations']}
                                            labelFormatter={(value) => {
                                                if (period === 'monthly') {
                                                    // Format YYYY-MM to Month YYYY
                                                    const [year, month] = value.split('-');
                                                    return new Date(`${year}-${month}-01`).toLocaleDateString('default', { month: 'long', year: 'numeric' });
                                                } else if (period === 'weekly') {
                                                    // Format YYYY-WXX to Week XX, YYYY
                                                    const [year, week] = value.split('-W');
                                                    return `Week ${week}, ${year}`;
                                                }
                                                return value;
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="registrations"
                                            name="New Users"
                                            stroke="#4f46e5"
                                            activeDot={{ r: 8 }}
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-4">Registration Distribution</h2>
                            <div className="h-80 bg-white">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={userActivity}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="period"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => {
                                                if (period === 'monthly') {
                                                    // Format YYYY-MM to MMM YYYY
                                                    const [year, month] = value.split('-');
                                                    return new Date(`${year}-${month}-01`).toLocaleDateString('default', { month: 'short' });
                                                } else if (period === 'weekly') {
                                                    // Format YYYY-WXX to WXX
                                                    const [_, week] = value.split('-W');
                                                    return `W${week}`;
                                                }
                                                return value.split('-').slice(1).join('-'); // For daily, show MM-DD
                                            }}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value) => [`${value} users`, 'New Registrations']}
                                            labelFormatter={(value) => {
                                                if (period === 'monthly') {
                                                    // Format YYYY-MM to Month YYYY
                                                    const [year, month] = value.split('-');
                                                    return new Date(`${year}-${month}-01`).toLocaleDateString('default', { month: 'long', year: 'numeric' });
                                                } else if (period === 'weekly') {
                                                    // Format YYYY-WXX to Week XX, YYYY
                                                    const [year, week] = value.split('-W');
                                                    return `Week ${week}, ${year}`;
                                                }
                                                return value;
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="registrations" name="New Users" fill="#4f46e5" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* No Data State */}
                {!loading && !error && userActivity.length === 0 && (
                    <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 text-lg">No user activity data available for the selected period.</p>
                            {showDateRange && (
                                <p className="text-gray-400 mt-2">Try adjusting your date range or time period.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Data Table */}
            {!loading && !error && userActivity.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold mb-4">Registration Data</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        New Registrations
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {userActivity.map((item, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {period === 'monthly' ? (
                                                // Format YYYY-MM to Month YYYY
                                                new Date(`${item.period}-01`).toLocaleDateString('default', { month: 'long', year: 'numeric' })
                                            ) : period === 'weekly' ? (
                                                // Format YYYY-WXX to Week XX, YYYY
                                                `Week ${item.period.split('-W')[1]}, ${item.period.split('-W')[0]}`
                                            ) : (
                                                // Daily - keep as is
                                                item.period
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.registrations}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Loyal Customers Section Toggle */}
            <div className="mt-12 mb-6">
                <button
                    onClick={() => {
                        setShowLoyalCustomers(!showLoyalCustomers);
                        if (!showLoyalCustomers) fetchLoyalCustomers();
                    }}
                    className={`flex items-center px-4 py-2 rounded-md ${showLoyalCustomers ? 'bg-indigo-700' : 'bg-indigo-600'} text-white hover:bg-indigo-700 transition-colors`}
                >
                    <FiUsers className="mr-2" />
                    {showLoyalCustomers ? 'Hide Loyal Customers' : 'Show Loyal Customers'}
                </button>
            </div>

            {/* Loyal Customers Section */}
            {showLoyalCustomers && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <h2 className="text-2xl font-bold">Most Loyal Customers</h2>
                            {dataRefreshed && (
                                <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-md animate-pulse">
                                    Data refreshed
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleExportLoyalCustomersCSV}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700"
                        >
                            <FiDownload className="mr-2" />
                            Export CSV
                        </button>
                    </div>

                    {/* Add refresh button to controls */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div>
                            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                                Sort By
                            </label>
                            <select
                                id="sortBy"
                                value={loyalCustomersSortBy}
                                onChange={(e) => setLoyalCustomersSortBy(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm px-4 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="loyalty">Loyalty Score</option>
                                <option value="orders">Order Count</option>
                                <option value="spent">Total Spent</option>
                                <option value="reviews">Review Count</option>
                                <option value="rating">Average Rating</option>
                                <option value="recent">Recent Activity</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
                                Show Top
                            </label>
                            <select
                                id="limit"
                                value={loyalCustomersLimit}
                                onChange={(e) => setLoyalCustomersLimit(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm px-4 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="5">5 Customers</option>
                                <option value="10">10 Customers</option>
                                <option value="20">20 Customers</option>
                                <option value="50">50 Customers</option>
                            </select>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loyalCustomersLoading && (
                        <div className="flex justify-center items-center h-64">
                            <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
                        </div>
                    )}

                    {/* Error State */}
                    {loyalCustomersError && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                            <p className="text-red-800">{loyalCustomersError}</p>
                        </div>
                    )}

                    {/* Customer Cards */}
                    {!loyalCustomersLoading && !loyalCustomersError && loyalCustomers.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loyalCustomers.map((customer) => (
                                <div key={customer.userId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <img
                                                    className="h-12 w-12 rounded-full object-cover"
                                                    src={customer.profileImage || 'https://via.placeholder.com/100'}
                                                    alt={customer.name}
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
                                                <p className="text-sm text-gray-500">{customer.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-center py-2">
                                            <div className="flex items-center">
                                                <FiShoppingBag className="text-indigo-500 mr-2" />
                                                <span className="text-sm text-gray-700">Orders:</span>
                                            </div>
                                            <span className="text-sm font-medium">{customer.orderCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-t border-gray-100">
                                            <div className="flex items-center">
                                                <FiDollarSign className="text-green-500 mr-2" />
                                                <span className="text-sm text-gray-700">Total Spent:</span>
                                            </div>
                                            <span className="text-sm font-medium">{formatCurrency(customer.totalSpent)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-t border-gray-100">
                                            <div className="flex items-center">
                                                <FiStar className="text-amber-400 mr-2" />
                                                <span className="text-sm text-gray-700">Reviews:</span>
                                            </div>
                                            <span className="text-sm font-medium">
                                                {customer.reviewCount} ({customer.averageRating}/5)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-t border-gray-100">
                                            <div className="flex items-center">
                                                <FiClock className="text-blue-500 mr-2" />
                                                <span className="text-sm text-gray-700">Last Order:</span>
                                            </div>
                                            <span className="text-sm font-medium">{formatDate(customer.lastOrder)}</span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Loyalty Score:</span>
                                                <span className="text-lg font-bold text-indigo-600">{customer.loyaltyScore}</span>
                                            </div>
                                            <div className="mt-2 bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-indigo-600 h-2.5 rounded-full"
                                                    style={{ width: `${Math.min(customer.loyaltyScore * 10, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No Data State */}
                    {!loyalCustomersLoading && !loyalCustomersError && loyalCustomers.length === 0 && (
                        <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500 text-lg">No customer loyalty data available.</p>
                            </div>
                        </div>
                    )}

                    {/* Data Table */}
                    {!loyalCustomersLoading && !loyalCustomersError && loyalCustomers.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                                                Orders
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                                                Total Spent
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                                                Reviews
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                                                Last Order
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                                                Loyalty Score
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loyalCustomers.map((customer, index) => (
                                            <tr key={customer.userId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={customer.profileImage || 'https://via.placeholder.com/100'}
                                                                alt=""
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                                            <div className="text-sm text-gray-500">{customer.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {customer.orderCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatCurrency(customer.totalSpent)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <span>{customer.reviewCount}</span>
                                                        {customer.reviewCount > 0 && (
                                                            <span className="ml-2 flex items-center">
                                                                <FiStar className="text-amber-400 h-4 w-4 mr-1" />
                                                                {customer.averageRating}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(customer.lastOrder)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-indigo-600">{customer.loyaltyScore}</span>
                                                        <div className="ml-3 bg-gray-200 rounded-full h-2 w-20">
                                                            <div
                                                                className="bg-indigo-600 h-2 rounded-full"
                                                                style={{ width: `${Math.min(customer.loyaltyScore * 10, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserActivityReport;