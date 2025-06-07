import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiShoppingCart, FiUsers, FiShoppingBag, FiRefreshCw, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { backendUrl } from '../App';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';
import RevenuePrediction from '../components/RevenuePrediction';
import { toast } from 'react-toastify';

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
  const [categoryMap, setCategoryMap] = useState({});
  const [admin, setAdmin] = useState(null);

  // Fetch admin profile to check role
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
          const response = await axios.get(`${backendUrl}/api/admin/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            setAdmin(response.data.admin);
            // Store role in localStorage for quick access
            localStorage.setItem('adminRole', response.data.admin.role);
          }
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        // Try to use cached role if available
        const cachedRole = localStorage.getItem('adminRole');
        if (cachedRole) {
          setAdmin({ role: cachedRole });
        }
      }
    };

    fetchAdminProfile();

    // Try to use cached role initially for faster rendering
    const cachedRole = localStorage.getItem('adminRole');
    if (cachedRole) {
      setAdmin({ role: cachedRole });
    }
  }, []);

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
      await fetchSubcategoryQuantityData();

      // Update last update timestamp
      setLastUpdate(Date.now());
    } catch (apiError) {
      console.error('API error:', apiError);
      setError(`API error: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate the sales trend
  const calculateTrend = () => {
    if (salesTrends.length < 2) return '0%';

    // Sort data by date if needed
    const sortedData = [...salesTrends].sort((a, b) => {
      if (a._id && b._id) {
        // Try to extract dates for comparison if possible
        return a._id.localeCompare(b._id);
      }
      return 0;
    });

    const firstPeriod = sortedData[0]?.revenue || 0;
    const lastPeriod = sortedData[sortedData.length - 1]?.revenue || 0;

    if (firstPeriod === 0) return '0%';

    const percentChange = ((lastPeriod - firstPeriod) / firstPeriod) * 100;
    return `${percentChange.toFixed(1)}%`;
  };


  // Get appropriate trend icon
  const getTrendIcon = () => {
    const trend = calculateTrend();
    const numericTrend = parseFloat(trend);

    if (numericTrend > 0) {
      return <FiTrendingUp className="h-5 w-5" />;
    } else if (numericTrend < 0) {
      return <FiTrendingDown className="h-5 w-5" />;
    } else {
      return <span>—</span>;
    }
  };

  // Get appropriate color based on trend
  const getTrendColor = () => {
    const trend = calculateTrend();
    const numericTrend = parseFloat(trend);

    if (numericTrend > 0) {
      return 'text-green-600';
    } else if (numericTrend < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
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
        // Add a map of category names to IDs
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

  // Function to fetch subcategories quantity data
  const fetchSubcategoryQuantityData = async (categoryId = null) => {
    const token = localStorage.getItem('adminToken');
    try {
      // Add request options with token
      const options = {
        headers: { token }
      };

      // Only add params if categoryId exists
      if (categoryId) {
        options.params = { categoryId };
      } else {
        toast.info('Fetching all subcategories');
      }

      const response = await axios.get(
        `${backendUrl}/api/product/subcategory-quantities`,
        options
      );

      setSubcategoryDistribution(response.data);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching subcategory quantity data:', error);
    }
  };

  const handleCategoryClick = (_, elements) => {
  if (elements.length > 0) {
    const index = elements[0].index;
    const category = categoryDistribution[index];
    setSelectedCategory(category);

    // First approach: Try to use categoryId directly from the object
    let categoryId = category._id || category.id || category.categoryId;

    // Second approach: If no direct ID is available, use the category name with our map
    if (!categoryId && category.category) {
      categoryId = categoryMap[category.category.toLowerCase()];
    }

    if (categoryId) {
      fetchSubcategoryQuantityData(categoryId);
    } else {
      console.error('Could not find category ID in:', category);
    }
  }
  };

  // And in clearCategorySelection:
  const clearCategorySelection = () => {
    setSelectedCategory(null);
    fetchSubcategoryQuantityData(); // Fetch all subcategories
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

  const generateColor = (index) => {
    // Golden ratio approximation for good color distribution
    const hue = index * 137.508; // use golden angle in degrees
    const saturation = 65 + (index % 20); // vary saturation slightly
    const lightness = 55 + (index % 15); // vary lightness slightly

    // For background colors (with transparency)
    const bgColor = `hsla(${hue % 360}, ${saturation}%, ${lightness}%, 0.5)`;
    // For border colors (same hue, no transparency)
    const borderColor = `hsl(${hue % 360}, ${saturation}%, ${lightness - 10}%)`;

    return { bgColor, borderColor };
  };

  const categoryData = {
    labels: categoryDistribution.map(item => item.category),
    datasets: [
      {
        label: 'Products',
        data: categoryDistribution.map(item => item.count),
        backgroundColor: categoryDistribution.map((_, index) => generateColor(index).bgColor),
        borderColor: categoryDistribution.map((_, index) => generateColor(index).borderColor),
        borderWidth: 1
      }
    ]
  };

  const subcategoryData = {
    labels: subcategoryDistribution.map(item => item.name),
    datasets: [
      {
        data: subcategoryDistribution.map(item => item.totalQuantity),
        backgroundColor: subcategoryDistribution.map((_, index) => generateColor(index + 10).bgColor),
        borderColor: subcategoryDistribution.map((_, index) => generateColor(index + 10).borderColor),
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
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>

        {/* Only show report buttons if user is not staff */}
        {admin && admin.role !== 'staff' && (
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/financial-sales-report')}
              className="flex items-center px-3 sm:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base"
            >
              Financial Sales Report
            </button>

            <button
              onClick={() => navigate('/sales')}
              className="flex items-center px-3 sm:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base"
            >
              Sold Items Count Report
            </button>

            <button
              onClick={() => navigate('/user-activity-report')}
              className="flex items-center px-3 sm:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base"
            >
              User Activity Report
            </button>
          </div>
        )}
      </div>

      {/* Only show period selector if user is not staff */}
      {admin && admin.role !== 'staff' && (
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
      )}

      {/* Stats Cards - keep the same grid but better small screen support */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
        <div className="bg-white rounded-lg shadow p-4 sm:p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 sm:h-12 w-10 sm:w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <FiDollarSign className="h-5 sm:h-6 w-5 sm:w-6 text-indigo-600" />
            </div>
            <div className="ml-3 sm:ml-5">
              <div className="text-gray-500 text-xs sm:text-sm">Total Sales ({selectedPeriod})</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
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

        {/* Returns Card */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <FiRefreshCw className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5">
              <div className="text-gray-500 text-sm">Returns ({selectedPeriod})</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats ? stats.returns?.[selectedPeriod] || '0' : '0'}
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

      {/* Charts - only show if user is not staff */}
      {admin && admin.role !== 'staff' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Sales Chart */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 max-h-[635px]">
            <h2 className="text-xl font-semibold mb-4">Sales Trends ({selectedPeriod})</h2>
            <div className="h-60 sm:h-80">
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

            {/* Sales summary section */}
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase font-medium tracking-wide">Average</p>
                <p className="mt-1 text-sm sm:text-lg font-bold text-gray-800">
                  Rs.{salesTrends.length > 0
                    ? (salesTrends.reduce((sum, item) => sum + item.revenue, 0) / salesTrends.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase font-medium tracking-wide">Peak {selectedPeriod}</p>
                <p className="mt-1 text-lg font-bold text-gray-800">
                  Rs.{salesTrends.length > 0
                    ? Math.max(...salesTrends.map(item => item.revenue)).toFixed(2)
                    : '0.00'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase font-medium tracking-wide">Trend</p>
                <p className={`mt-1 text-lg font-bold flex items-center justify-center ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span className="ml-1">{calculateTrend()}</span>
                </p>
              </div>
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
        </div>
      )}

      {/* Category and Subcategory Charts - visible to all roles */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
        <div className="bg-white rounded-lg shadow p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-semibold">
              {selectedCategory
                ? `Subcategory Quantities in "${selectedCategory.category}"`
                : 'All Subcategory Product Quantities'}
            </h2>
            {selectedCategory && (
              <button
                onClick={clearCategorySelection}
                className="px-2 py-1 text-sm bg-black text-white rounded hover:bg-white hover:text-black border border-gray-800 transition-colors duration-300 w-fit"
              >
                Show All
              </button>
            )}
          </div>
          <div className="h-60 sm:h-80">
            <Pie
              data={subcategoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value} units`;
                      }
                    }
                  },
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 15,
                      font: {
                        size: 10
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Products Table - visible to all roles */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
        <div className="px-4 sm:px-5 py-4 border-t border-gray-200 text-right">
          <button onClick={() => navigate(`/list`)} className="text-sm text-indigo-600 hover:text-indigo-900">
            View All Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;