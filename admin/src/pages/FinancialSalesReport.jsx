import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiDownload, FiCalendar, FiLoader, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const FinancialSalesReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [totalSales, setTotalSales] = useState(0);
    const [comparison, setComparison] = useState({
        percentage: 0,
        positive: true
    });
    const [categoryMappings, setCategoryMappings] = useState({
        categories: {},
        subcategories: {}
    });

    // Get today's date in YYYY-MM-DD format for the max date attribute
    const today = new Date().toISOString().split('T')[0];
    // Set default start date to one month ago
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
    const oneMonthAgo = defaultStartDate.toISOString().split('T')[0];

    const handleExportCSV = () => {
        if (!salesData) {
            toast.warning('No sales data available to export');
            return;
        }

        try {
            // CSV header
            let csvContent = 'Category,Subcategory,Product ID,Product Name,Color,Size,Unit Price,Quantity Sold,Subtotal\n';

            // Process data into CSV rows
            Object.entries(salesData).forEach(([categoryId, subcategories]) => {
                const categoryName = getCategoryName(categoryId);

                Object.entries(subcategories).forEach(([subcategoryId, products]) => {
                    const subcategoryName = getSubcategoryName(subcategoryId);

                    Object.entries(products).forEach(([productId, product]) => {
                        product.variations.forEach(variation => {
                            const subtotal = variation.quantity * variation.unitPrice;
                            // Escape fields with quotes if they contain commas
                            const escapeCsv = (field) => {
                                return field && field.includes(',') ? `"${field}"` : field;
                            };

                            csvContent += `${escapeCsv(categoryName)},`;
                            csvContent += `${escapeCsv(subcategoryName)},`;
                            csvContent += `${escapeCsv(productId)},`;
                            csvContent += `${escapeCsv(product.productName)},`;
                            csvContent += `${escapeCsv(variation.color)},`;
                            csvContent += `${escapeCsv(variation.size)},`;
                            csvContent += `${variation.unitPrice},`;
                            csvContent += `${variation.quantity},`;
                            csvContent += `${subtotal}\n`;
                        });
                    });
                });
            });

            // Create and download the CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `sales_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            toast.error('Failed to export CSV');
        }
    };

    // Set initial date range when component mounts
    useEffect(() => {
        setDateRange({
            startDate: oneMonthAgo,
            endDate: today
        });
    }, []);

    // Fetch data when component mounts or date range changes
    useEffect(() => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchCategoryMappings();
            fetchSalesData();
        }
    }, [dateRange.startDate, dateRange.endDate]);

    const getCategoryName = (id) => {
        return categoryMappings.categories[id] || id;
    };

    const getSubcategoryName = (id) => {
        return categoryMappings.subcategories[id] || id;
    };

    const fetchCategoryMappings = async () => {
        try {
            const token = localStorage.getItem('adminToken');

            if (!token) {
                navigate('/');
                return;
            }

            // Fetch both categories and subcategories
            const categoriesResponse = await axios.get(
                `${backendUrl}/api/categories`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const subcategoriesResponse = await axios.get(
                `${backendUrl}/api/subcategories`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (categoriesResponse.data && subcategoriesResponse.data) {
                const mappings = {
                    categories: {},
                    subcategories: {}
                };

                // Map category IDs to names
                categoriesResponse.data.forEach(category => {
                    mappings.categories[category._id] = category.name;
                });

                // Map subcategory IDs to names
                subcategoriesResponse.data.forEach(subcategory => {
                    mappings.subcategories[subcategory._id] = subcategory.name;
                });

                setCategoryMappings(mappings);
            }
        } catch (error) {
            console.error('Error fetching category mappings:', error);
        }
    };

    const fetchSalesData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) {
                navigate('/');
                return;
            }

            // Make API call to get sales data
            const response = await axios.get(
                `${backendUrl}/api/reports/financial-sales`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate
                    }
                }
            );

            if (response.data && response.data.success) {
                setSalesData(response.data.salesData);

                // Process category data for visualization
                const categories = processCategoryData(response.data.salesData);
                setCategoryData(categories);

                // Calculate total sales
                const total = calculateTotalSales(response.data.salesData);
                setTotalSales(total);

                // Fetch previous period data for comparison
                fetchPreviousPeriodData(dateRange.startDate, dateRange.endDate, total);
            } else {
                setError(response.data?.message || 'Failed to fetch sales data');
                toast.error('Failed to load sales data');
            }
        } catch (error) {
            console.error('Error fetching sales data:', error);
            setError(error.response?.data?.message || error.message);
            toast.error('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPreviousPeriodData = async (startDate, endDate, currentTotal) => {
        try {
            const token = localStorage.getItem('adminToken');

            // Calculate previous period of same length
            const start = new Date(startDate);
            const end = new Date(endDate);
            const dayDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));

            const prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);

            const prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - dayDiff);

            // Format dates
            const formattedPrevStart = prevStart.toISOString().split('T')[0];
            const formattedPrevEnd = prevEnd.toISOString().split('T')[0];

            // Get previous period data
            const response = await axios.get(
                `${backendUrl}/api/reports/financial-sales`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        startDate: formattedPrevStart,
                        endDate: formattedPrevEnd
                    }
                }
            );

            if (response.data && response.data.success) {
                const prevTotal = calculateTotalSales(response.data.salesData);

                // Calculate growth percentage
                if (prevTotal > 0) {
                    const growthRate = ((currentTotal - prevTotal) / prevTotal) * 100;
                    setComparison({
                        percentage: Math.abs(growthRate).toFixed(2),
                        positive: growthRate >= 0
                    });
                } else {
                    setComparison({
                        percentage: 100,
                        positive: true
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching previous period data:', error);
        }
    };

    // Process sales data to extract category information for charts
    const processCategoryData = (data) => {
        const categories = [];

        Object.entries(data || {}).forEach(([categoryId, subcategories]) => {
            let categoryTotal = 0;
            const categoryName = getCategoryName(categoryId);

            Object.entries(subcategories).forEach(([_, products]) => {
                Object.entries(products).forEach(([_, product]) => {
                    product.variations.forEach(variation => {
                        categoryTotal += variation.quantity * variation.unitPrice;
                    });
                });
            });

            categories.push({
                name: categoryName,
                value: categoryTotal,
                id: categoryId // Keep the ID for reference
            });
        });

        return categories;
    };

    // Calculate total sales from all categories
    const calculateTotalSales = (data) => {
        let grandTotal = 0;

        Object.entries(data || {}).forEach(([_, subcategories]) => {
            Object.entries(subcategories).forEach(([_, products]) => {
                Object.entries(products).forEach(([_, product]) => {
                    product.variations.forEach(variation => {
                        grandTotal += variation.quantity * variation.unitPrice;
                    });
                });
            });
        });

        return grandTotal;
    };

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGenerateReport = () => {
        if (!dateRange.startDate || !dateRange.endDate) {
            toast.warning('Please select both start and end dates');
            return;
        }

        if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
            toast.warning('Start date cannot be after end date');
            return;
        }

        fetchSalesData();
    };

    // Colors for pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Financial Sales Report</h1>
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
            <i className='text-sm text-red-500 mb-5'>*Only delivered orders are included in this report</i>


            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                {/* Report Controls */}
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <h2 className="text-lg font-semibold mb-4">Select Date Range</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                        <div className="flex items-end space-x-2">
                            <button
                                onClick={handleGenerateReport}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
                            >
                                Generate Report
                            </button>
                            {!loading && salesData && (
                                <button
                                    onClick={handleExportCSV}
                                    className="px-4 py-2 flex items-center gap-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700"
                                >
                                    <FiDownload className="h-5 w-5" />
                                    Export CSV
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <FiDollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-blue-900">Total Sales</p>
                                <p className="text-2xl font-semibold">Rs.{totalSales.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`${comparison.positive ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
                        <div className="flex items-center">
                            <div className={`${comparison.positive ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-full`}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-6 w-6 ${comparison.positive ? 'text-green-600' : 'text-red-600'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    {comparison.positive ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    )}
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${comparison.positive ? 'text-green-900' : 'text-red-900'}`}>
                                    Compared to Previous Period
                                </p>
                                <p className="text-2xl font-semibold">
                                    {comparison.percentage}%
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
                {!loading && !error && salesData && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
                                <div className="h-80 bg-white">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`Rs.${value.toFixed(2)}`, 'Sales']}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold mb-4">Category Performance</h2>
                                <div className="h-80 bg-white">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={categoryData}
                                            margin={{
                                                top: 5,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value) => [`Rs.${value.toFixed(2)}`, 'Sales']}
                                            />
                                            <Legend />
                                            <Bar dataKey="value" name="Sales" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* No Data State */}
                {!loading && !error && !salesData && (
                    <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <FiBarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 text-lg">No sales data available for the selected period.</p>
                            <p className="text-gray-400 mt-2">Try adjusting your date range.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Sales Data Table */}
            {!loading && !error && salesData && (
                <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
                    <h2 className="text-lg font-semibold mb-4">Detailed Sales Data</h2>

                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Color
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Size
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Qty Sold
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subtotal
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(salesData).map(([categoryId, subcategories]) => {
                                let categoryTotal = 0;
                                const categoryName = getCategoryName(categoryId);

                                const subcategoryRows = Object.entries(subcategories).map(([subcategoryId, products]) => {
                                    let subcategoryTotal = 0;
                                    const subcategoryName = getSubcategoryName(subcategoryId);
                                    const productRows = [];

                                    Object.entries(products).forEach(([productId, product]) => {
                                        let isFirstVariation = true;

                                        product.variations.forEach((variation, idx) => {
                                            const subtotal = variation.quantity * variation.unitPrice;
                                            subcategoryTotal += subtotal;

                                            productRows.push(
                                                <tr key={`${productId}-${variation.color}-${variation.size}-${idx}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {isFirstVariation ? productId.substring(0, 8) : ''}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {isFirstVariation ? product.productName : ''}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {variation.color}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {variation.size}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        Rs.{variation.unitPrice.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {variation.quantity}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        Rs.{subtotal.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right"></td>
                                                </tr>
                                            );

                                            isFirstVariation = false;
                                        });
                                    });

                                    categoryTotal += subcategoryTotal;

                                    return [
                                        ...productRows,
                                        <tr key={`subcategory-${subcategoryId}`} className="bg-gray-50">
                                            <td colSpan="7" className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                Sub category: {subcategoryName}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                Rs.{subcategoryTotal.toFixed(2)}
                                            </td>
                                        </tr>
                                    ];
                                });

                                return [
                                    ...subcategoryRows.flat(),
                                    <tr key={`category-${categoryId}`} className="bg-indigo-50">
                                        <td colSpan="7" className="px-6 py-3 whitespace-nowrap text-sm font-medium text-indigo-900">
                                            Category: {categoryName}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-indigo-900 text-right">
                                            Rs.{categoryTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                ];
                            })}

                            <tr className="bg-indigo-100">
                                <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-900">
                                    Sales made during ({dateRange.startDate}) - ({dateRange.endDate})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-900 text-right">
                                    Rs.{totalSales.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FinancialSalesReport;