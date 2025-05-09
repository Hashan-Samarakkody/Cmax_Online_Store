import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import {
    BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';

const ReturnAnalysis = ({ token }) => {
    const [returns, setReturns] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('all');
    const navigate = useNavigate();

    // Analysis data states
    const [categoryReturnRates, setCategoryReturnRates] = useState([]);
    const [returnReasons, setReturnReasons] = useState([]);
    const [processingTimes, setProcessingTimes] = useState([]);
    const [monthlyReturnTrend, setMonthlyReturnTrend] = useState([]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch returns
            const returnsResponse = await axios.get(`${backendUrl}/api/returns/admin`, {
                headers: { token }
            });

            // Fetch products - FIXED: use the correct endpoint
            const productsResponse = await axios.get(`${backendUrl}/api/product/list`, {
                headers: { token }
            });

            // Fetch categories - FIXED: use the correct endpoint
            const categoriesResponse = await axios.get(`${backendUrl}/api/categories`, {
                headers: { token }
            });

            // Fetch orders summary - FIXED: use the correct endpoint
            const ordersResponse = await axios.get(`${backendUrl}/api/returns/return-summary`, {
                headers: { token }
            });

            if (returnsResponse.data.success && productsResponse.data.success &&
                categoriesResponse.data && ordersResponse.data.success) {

                const returnsData = returnsResponse.data.returns;
                const productsData = productsResponse.data.products;
                const categoriesData = categoriesResponse.data;  // Categories response structure is different
                const ordersData = ordersResponse.data.orders;

                setReturns(returnsData);
                setProducts(productsData);
                setCategories(categoriesData);
                setOrders(ordersData);

                // Process data for analysis
                processReturnsByCategory(returnsData, productsData, categoriesData, ordersData);
                processReturnReasons(returnsData);
                processProcessingTimes(returnsData);
                processMonthlyTrends(returnsData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load return analysis data');
        } finally {
            setLoading(false);
        }
    };

    // Process return rates by category
    const processReturnsByCategory = (returnsData, productsData, categoriesData, ordersData) => {
        // Create a map of product IDs to their categories
        const productCategoryMap = {};
        productsData.forEach(product => {
            productCategoryMap[product._id] = {
                category: product.category,
                subcategory: product.subcategory
            };
        });

        // Create category name map
        const categoryNameMap = {};
        categoriesData.forEach(category => {
            categoryNameMap[category._id] = category.name;

            if (category.subcategories) {
                category.subcategories.forEach(sub => {
                    categoryNameMap[sub._id] = sub.name;
                });
            }
        });

        // Count returns by category
        const returnsByCategory = {};
        const ordersByCategory = {};

        // Initialize counts
        categoriesData.forEach(category => {
            returnsByCategory[category._id] = 0;
            ordersByCategory[category._id] = 0;
        });

        // Count returns by category
        returnsData.forEach(returnItem => {
            returnItem.items.forEach(item => {
                const productId = item.productId;
                if (productCategoryMap[productId]) {
                    const categoryId = productCategoryMap[productId].category;
                    returnsByCategory[categoryId] = (returnsByCategory[categoryId] || 0) + item.quantity;
                }
            });
        });

        // Count orders by category
        ordersData.forEach(order => {
            order.items.forEach(item => {
                const productId = item.productId;
                if (productCategoryMap[productId]) {
                    const categoryId = productCategoryMap[productId].category;
                    ordersByCategory[categoryId] = (ordersByCategory[categoryId] || 0) + item.quantity;
                }
            });
        });

        // Calculate return rates
        const rates = Object.keys(returnsByCategory).map(categoryId => {
            const returns = returnsByCategory[categoryId] || 0;
            const orders = ordersByCategory[categoryId] || 0;
            const rate = orders > 0 ? (returns / orders) * 100 : 0;

            return {
                category: categoryNameMap[categoryId] || 'Unknown',
                returns: returns,
                orders: orders,
                rate: parseFloat(rate.toFixed(2))
            };
        }).filter(item => item.orders > 0).sort((a, b) => b.rate - a.rate);

        setCategoryReturnRates(rates);
    };

    // Process return reasons
    const processReturnReasons = (returnsData) => {
        const reasons = {};
        let totalItems = 0;

        returnsData.forEach(returnItem => {
            returnItem.items.forEach(item => {
                const reason = item.reason || 'Not specified';
                reasons[reason] = (reasons[reason] || 0) + 1;
                totalItems++;
            });
        });

        const reasonsData = Object.keys(reasons).map(reason => ({
            reason,
            count: reasons[reason],
            percentage: parseFloat(((reasons[reason] / totalItems) * 100).toFixed(2))
        })).sort((a, b) => b.count - a.count);

        setReturnReasons(reasonsData);
    };

    // Process return processing times
    const processProcessingTimes = (returnsData) => {
        // Filter returns that have been completed
        const completedReturns = returnsData.filter(r =>
            r.status === 'Completed' && r.completedDate && r.requestedDate);

        // Calculate processing time in days for each return
        const times = completedReturns.map(r => {
            const requestDate = new Date(r.requestedDate);
            const completedDate = new Date(r.completedDate);
            const diffTime = Math.abs(completedDate - requestDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                returnId: r.returnId,
                processingDays: diffDays,
                status: r.status
            };
        });

        // Calculate average processing time
        const avgTime = times.length > 0
            ? times.reduce((sum, item) => sum + item.processingDays, 0) / times.length
            : 0;

        // Group by processing days
        const grouped = {};
        times.forEach(item => {
            grouped[item.processingDays] = (grouped[item.processingDays] || 0) + 1;
        });

        const timeData = {
            times: Object.keys(grouped).map(days => ({
                days: parseInt(days),
                count: grouped[days]
            })).sort((a, b) => a.days - b.days),
            average: parseFloat(avgTime.toFixed(1)),
            completed: completedReturns.length,
            pending: returnsData.length - completedReturns.length
        };

        setProcessingTimes(timeData);
    };

    // Process monthly return trends
    const processMonthlyTrends = (returnsData) => {
        const monthlyData = {};

        returnsData.forEach(returnItem => {
            const date = new Date(returnItem.requestedDate);
            const monthYear = format(date, 'MMM yyyy');

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    month: monthYear,
                    count: 0,
                    revenue: 0
                };
            }

            monthlyData[monthYear].count++;
            monthlyData[monthYear].revenue += returnItem.refundAmount || 0;
        });

        const trends = Object.values(monthlyData)
            .sort((a, b) => new Date(a.month) - new Date(b.month));

        setMonthlyReturnTrend(trends);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                   <div className="relative w-24 h-24">
                     {/* Pulsing circle animation */}
                     <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                     <div className="absolute top-0 left-0 w-full h-full border-t-4 border-green-400 rounded-full animate-spin"></div>
           
                     {/* Shop icon or logo in center */}
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                       <img
                         src={assets.logo}
                         alt="Loading"
                         className="w-12 h-12 object-contain animate-pulse"
                       />
                     </div>
                   </div>
                <p className="mt-4 text-gray-600 font-medium">Loading Return Analysis Report...</p>
                 </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Return Analysis Report</h1>
                <button
                    onClick={() => navigate('/return-requests')}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="ml-1">Back to Returns</span>
                </button>
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Filter Data</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setDateRange('week')}
                            className={`px-3 py-1 rounded ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setDateRange('month')}
                            className={`px-3 py-1 rounded ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setDateRange('year')}
                            className={`px-3 py-1 rounded ${dateRange === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            This Year
                        </button>
                        <button
                            onClick={() => setDateRange('all')}
                            className={`px-3 py-1 rounded ${dateRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            All Time
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Return Rates by Category */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Return Rates by Category</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryReturnRates.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Return Rate']} />
                            <Legend />
                            <Bar dataKey="rate" name="Return Rate (%)" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 max-h-60 overflow-y-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-4 text-left text-sm font-bold">Category</th>
                                    <th className="py-2 px-4 text-right text-sm font-bold">Returns</th>
                                    <th className="py-2 px-4 text-right text-sm font-bold">Orders</th>
                                    <th className="py-2 px-4 text-right text-sm font-bold">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryReturnRates.map((item, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="py-2 px-4 text-sm">{item.category}</td>
                                        <td className="py-2 px-4 text-right text-sm">{item.returns}</td>
                                        <td className="py-2 px-4 text-right text-sm">{item.orders}</td>
                                        <td className="py-2 px-4 text-right text-sm">{item.rate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Return Reasons */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Common Reasons for Returns</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={returnReasons}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                dataKey="count"
                                nameKey="reason"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {returnReasons.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [`${value} items (${props.payload.percentage}%)`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 max-h-60 overflow-y-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-4 text-left text-sm font-bold">Reason</th>
                                    <th className="py-2 px-4 text-right text-sm font-bold">Count</th>
                                    <th className="py-2 px-4 text-right text-sm font-bold">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returnReasons.map((item, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="py-2 px-4 text-sm">{item.reason}</td>
                                        <td className="py-2 px-4 text-right text-sm">{item.count}</td>
                                        <td className="py-2 px-4 text-right text-sm">{item.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Processing Time */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Return Processing Efficiency</h2>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <p className="text-sm text-blue-700">Avg. Processing Time</p>
                            <p className="text-xl font-bold text-blue-900">{processingTimes.average} days</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                            <p className="text-sm text-green-700">Completed Returns</p>
                            <p className="text-xl font-bold text-green-900">{processingTimes.completed}</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg text-center">
                            <p className="text-sm text-yellow-700">Pending Returns</p>
                            <p className="text-xl font-bold text-yellow-900">{processingTimes.pending}</p>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={processingTimes.times}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="days" label={{ value: 'Days to Process', position: 'insideBottom', offset: -5 }} />
                            <YAxis label={{ value: 'Number of Returns', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => [`${value} returns`, 'Count']} />
                            <Bar dataKey="count" name="Returns" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly Trends */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Monthly Return Trends</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyReturnTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="count" name="Return Count" stroke="#8884d8" activeDot={{ r: 8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Return Value (Rs.)" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Customer Satisfaction */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Customer Satisfaction with Returns Process</h2>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800">
                        ⚠️ Note: Currently there is no direct feedback data for return satisfaction. To improve this report, consider implementing:
                    </p>
                    <ul className="list-disc ml-6 mt-2 text-yellow-700">
                        <li>Post-return customer satisfaction surveys</li>
                        <li>Sentiment analysis of customer communication during return process</li>
                        <li>Return-to-repurchase ratio tracking to measure customer retention after returns</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ReturnAnalysis;