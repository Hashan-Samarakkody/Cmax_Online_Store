import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiShoppingCart, FiUsers, FiShoppingBag } from 'react-icons/fi';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { backendUrl } from '../App';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';
import RevenuePrediction from '../components/RevenuePrediction';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [subcategoryDistribution, setSubcategoryDistribution] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [categoryMap, setCategoryMap] = useState({}); // Map of category names to IDs

  // Function to fetch all dashboard data
  const fetchAllData = async () => {
    const token = localStorage.getItem('adminToken');

    try {
      setLoading(true);

      // Fetch dashboard stats
      const statsResponse = await axios.get(backendUrl + '/api/dashboard/stats', {
        headers: { token }
      });
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch product performance
      const prodResponse = await axios.get(backendUrl + '/api/dashboard/product-performance', {
        headers: { token }
      });
      if (prodResponse.data.success) {
        setProductPerformance(prodResponse.data.productPerformance || []);
      }

      // Fetch sales trends with selected period
      const salesRes = await axios.get(backendUrl + '/api/dashboard/sales-trends', {
        headers: { token },
        params: { period: selectedPeriod }
      });
      if (salesRes.data.success) setSalesTrends(salesRes.data.salesData || []);

      // Fetch category distribution and build category map
      await fetchCategoryData();

      // Fetch subcategory distribution
      await fetchSubcategoryData();

      // Update last update timestamp
      setLastUpdate(Date.now());
    } catch (apiError) {
      console.error('API error:', apiError);
      setError(`API error: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to build a map of category names to IDs
  const buildCategoryMap = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.get(`${backendUrl}/api/categories`, {
        headers: { token }
      });

      if (response.data) {
        // Create a map of category names to IDs
        const map = {};
        response.data.forEach(cat => {
          map[cat.name.toLowerCase()] = cat._id;
        });
        setCategoryMap(map);
      }
    } catch (error) {
      console.error('Error building category map:', error);
    }
  };

  // Function to fetch subcategories data
  const fetchSubcategoryData = async (categoryId = null) => {
    const token = localStorage.getItem('adminToken');
    try {

      // Create request options with token
      const options = {
        headers: { token }
      };

      // Only add params if categoryId exists
      if (categoryId) {
        options.params = { categoryId };
      }

      const response = await axios.get(
        `${backendUrl}/api/categories/subcategories/all`,
        options
      );

      // Transform the response data to have the format we need for the chart
      const subcategoryData = response.data.map(subcategory => ({
        name: subcategory.name,
        count: subcategory.productCount || 0
      }));

      // Sort by count and get top subcategories
      const sortedData = subcategoryData.sort((a, b) => b.count - a.count).slice(0, 10);
      setSubcategoryDistribution(sortedData);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching subcategory data:', error);
    }
  };

  // Function to handle category click
  const handleCategoryClick = (_, elements) => {
    if (elements.length > 0) {
      const categoryIndex = elements[0].index;
      const category = categoryDistribution[categoryIndex];

      if (category) {
        // Find the category ID from the category name using our map
        const categoryName = category.category.toLowerCase();
        const categoryId = categoryMap[categoryName];

        setSelectedCategory(category);

        if (categoryId) {
          // Fetch subcategories for this category
          fetchSubcategoryData(categoryId);
        } else {
          console.error('Could not find category ID for:', category.category);
        }
      }
    } else {
      // Reset to show all subcategories when clicking outside a category
      setSelectedCategory(null);
      fetchSubcategoryData();
    }
  };

  // Function to clear category selection
  const clearCategorySelection = () => {
    setSelectedCategory(null);
    fetchSubcategoryData(); // Fetch all subcategories
  };

  // Improved focused data fetching functions with consistent error handling and loading states
  const fetchUserStats = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const statsResponse = await axios.get(backendUrl + '/api/dashboard/stats', {
        headers: { token }
      });
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchProductData = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      // Update product performance
      const response = await axios.get(backendUrl + '/api/dashboard/product-performance', {
        headers: { token }
      });
      if (response.data.success) {
        setProductPerformance(response.data.productPerformance || []);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
    }
  };

  const fetchCategoryData = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      // Get categories from dashboard endpoint
      const categoryRes = await axios.get(backendUrl + '/api/dashboard/category-distribution', {
        headers: { token }
      });

      if (categoryRes.data.success) {
        const categories = categoryRes.data.categoryDistribution || [];
        setCategoryDistribution(categories);

        // After getting category distribution, build our category map
        await buildCategoryMap();

        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    }
  };

  const fetchSalesData = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      // Update sales trends
      const salesRes = await axios.get(backendUrl + '/api/dashboard/sales-trends', {
        headers: { token },
        params: { period: selectedPeriod }
      });
      if (salesRes.data.success) {
        setSalesTrends(salesRes.data.salesData || []);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  // Function to handle period selection change
  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setSelectedPeriod(newPeriod);
    // When period changes, fetch new data
  };

  // Re-fetch sales data when period changes
  useEffect(() => {
    if (!loading) {
      fetchSalesData();
    }
  }, [selectedPeriod]);

  // Event handlers with better logging and improved reliability
  const handleUserChange = () => {
    fetchUserStats();
  };

  const handleProductChange = (data) => {
    // Only fetch product data when needed
    fetchProductData();
    // Product changes can affect stats and categories
    fetchUserStats();
    fetchCategoryData();
  };

  const handleCategoryChange = () => {
    fetchCategoryData();
  };

  const handleOrderChange = (data) => {
    // Order changes affect multiple aspects of the dashboard
    fetchSalesData();
    fetchUserStats();
    fetchProductData();
  };

  // Debounced full refresh for multiple rapid changes
  const debouncedFullRefresh = () => {
    const currentTime = Date.now();
    // Only do a full refresh if it's been more than 10 min since last update
    if (currentTime - lastUpdate > 600000) {
      fetchAllData();
    }
  };

  // WebSocket setup and cleanup with improved error handling
  useEffect(() => {
    const connectAndSetup = () => {
      // First ensure WebSocket is connected before setting up listeners
      if (!WebSocketService.isConnected()) {
        WebSocketService.connect(() => {
          setupWebSocketListeners();
          fetchAllData();
        });
      } else {
        // WebSocket already connected, set up listeners and fetch data
        setupWebSocketListeners();
        fetchAllData();
      }
    };

    // Setup all WebSocket event listeners
    const setupWebSocketListeners = () => {
      // User-related events
      WebSocketService.on('userChange', handleUserChange);
      WebSocketService.on('newUser', handleUserChange);

      // Product-related events
      WebSocketService.on('newProduct', handleProductChange);
      WebSocketService.on('updateProduct', handleProductChange);
      WebSocketService.on('deleteProduct', handleProductChange);

      // Category-related events
      WebSocketService.on('categoryChange', handleCategoryChange);

      // Order-related events
      WebSocketService.on('orderChange', handleOrderChange);
      WebSocketService.on('newOrder', handleOrderChange);
    };

    connectAndSetup();

    // An interval to ensure data is fresh
    const refreshInterval = setInterval(debouncedFullRefresh, 600000);

    // Cleanup function
    return () => {
      WebSocketService.off('userChange', handleUserChange);
      WebSocketService.off('newUser', handleUserChange);
      WebSocketService.off('newProduct', handleProductChange);
      WebSocketService.off('updateProduct', handleProductChange);
      WebSocketService.off('deleteProduct', handleProductChange);
      WebSocketService.off('categoryChange', handleCategoryChange);
      WebSocketService.off('orderChange', handleOrderChange);
      WebSocketService.off('newOrder', handleOrderChange);
      clearInterval(refreshInterval);
    };
  }, []);

  // Prepare chart data
  const salesChartData = {
    labels: salesTrends.map(item => item._id),
    datasets: [
      {
        label: 'Revenue',
        data: salesTrends.map(item => item.revenue),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const ordersChartData = {
    labels: salesTrends.map(item => item._id),
    datasets: [
      {
        label: 'Orders',
        data: salesTrends.map(item => item.orders),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  const paymentMethodsData = {
    labels: ['Cash on Delivery', 'Stripe'],
    datasets: [
      {
        data: stats ? [stats.payments.cash, stats.payments.stripe] : [0, 0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)'
        ],
        borderWidth: 1
      }
    ]
  };

  const categoryData = {
    labels: categoryDistribution.map(item => item.category),
    datasets: [
      {
        label: 'Products',
        data: categoryDistribution.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }
    ]
  };

  const subcategoryData = {
    labels: subcategoryDistribution.map(item => item.name),
    datasets: [
      {
        data: subcategoryDistribution.map(item => item.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(201, 203, 207, 0.5)',
          'rgba(94, 232, 129, 0.5)',
          'rgba(162, 94, 232, 0.5)',
          'rgba(232, 94, 94, 0.5)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(255, 99, 132)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)',
          'rgb(201, 203, 207)',
          'rgb(94, 232, 129)',
          'rgb(162, 94, 232)',
          'rgb(232, 94, 94)'
        ],
        borderWidth: 2
      }
    ]
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
        <p className="mt-4 text-gray-600 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl font-medium text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/financial-sales-report')}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Financial Sales Report
          </button>

          <button
            onClick={() => navigate('/sales')}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Sold Items Count Report
          </button>

          <button
            onClick={() => navigate('/user-activity-report')}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            User Activity Report
          </button>
        </div>
      </div>

      <select
        value={selectedPeriod}
        onChange={handlePeriodChange}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Sales Card */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <FiDollarSign className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-5">
              <div className="text-gray-500 text-sm">Total Sales ({selectedPeriod})</div>
              <div className="text-2xl font-bold text-gray-900">
                Rs.{stats ? stats.revenue[selectedPeriod]?.toFixed(2) || '0.00' : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Card*/}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <FiShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <div className="text-gray-500 text-sm">Orders ({selectedPeriod})</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats ? stats.orders[selectedPeriod] || '0' : '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5">
              <div className="text-gray-500 text-sm">Total Users</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats ? stats.users.total : '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <FiShoppingBag className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5">
              <div className="text-gray-500 text-sm">Top Products</div>
              <div className="text-2xl font-bold text-gray-900">
                {productPerformance.length}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-4">Sales Trends ({selectedPeriod})</h2>
          <div className="h-80">
            <Line
              data={salesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Sales Prediction Section */}
        <div className="mb-6">
          <RevenuePrediction token={token} />
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-4">Order Trends ({selectedPeriod})</h2>
          <div className="h-80">
            <Bar
              data={ordersChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
          <div className="h-80">
            <Pie
              data={paymentMethodsData}
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-4">Category Distribution</h2>
          <div className="h-80">
            <Pie
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                onClick: handleCategoryClick
              }}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 mt-2 text-center font-semibold">Click on a category to view subcategory distribution</p>
          </div>
        </div>

        {/* Subcategory Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedCategory ? `Subcategory distribution in "${selectedCategory.category}" category` : 'All Subcategory Distribution'}
            </h2>
            {selectedCategory && (
              <button
                onClick={clearCategorySelection}
                className="px-2 py-1 text-sm bg-black text-white rounded hover:bg-white hover:text-black border border-gray-800 transition-colors duration-300"
              >
                Show All
              </button>
            )}
          </div>
          <div className="h-80">
            <Bar
              data={subcategoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false 
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Product Count'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productPerformance.slice(0, 5).map((product, index) => (
                <tr key={product.id || `product-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.name || 'Unknown Product'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.quantitySold !== undefined ? product.quantitySold : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rs.{product.revenue !== undefined ? Number(product.revenue).toFixed(2) : '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 text-right">
          <button onClick={() => navigate(`/list`)} className="text-sm text-indigo-600 hover:text-indigo-900">
            View All Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;