import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiDownload, FiCalendar, FiLoader, FiUsers } from 'react-icons/fi';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

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

    // Get today's date in YYYY-MM-DD format for the max date attribute
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchUserActivity();
    }, [period]);

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

            // Only add date range parameters if we're showing the date range AND both dates are selected
            if (showDateRange && dateRange.startDate && dateRange.endDate) {
                queryParams.append('startDate', dateRange.startDate);
                queryParams.append('endDate', dateRange.endDate);
            }

            // Log what we're requesting to help debug
            console.log(`Fetching data with params: ${queryParams.toString()}`);

            // Fetch user activity data
            const response = await axios.get(
                `${backendUrl}/api/dashboard/user-activity-report?${queryParams.toString()}`,
                { headers: { token } }
            );

            if (response.data.success) {
                // Log the response to help debug
                console.log('Received data:', response.data.userActivity);

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
    };

    const handleResetDateRange = () => {
        setDateRange({
            startDate: '',
            endDate: ''
        });
        setShowDateRange(false);
        fetchUserActivity();
    };

    const handleExportCSV = () => {
        // Generate CSV content
        const headers = ['Period', 'New Registrations'];
        const rows = userActivity.map(item => [item.period, item.registrations]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
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

    return (
        <div className="p-6 max-w-7xl mx-auto">
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

                        <div>
                            <button
                                className={`px-4 py-2 rounded-md ${showDateRange ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} shadow-sm`}
                                onClick={() => setShowDateRange(!showDateRange)}
                            >
                                {showDateRange ? 'Hide Date Range' : 'Custom Date Range'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700"
                        >
                            <FiDownload className="mr-2" />
                            Export CSV
                        </button>
                    </div>
                </div>

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
        </div>
    );
};

export default UserActivityReport;