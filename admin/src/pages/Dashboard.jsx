import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiShoppingCart, FiUsers, FiShoppingBag } from 'react-icons/fi';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { backendUrl } from '../App';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('adminToken');

        if (!token) {
          setError('Authentication token missing. Please log in again.');
          setLoading(false);
          return;
        }

        try {
          // Fetch dashboard stats - fixed header format to match adminAuth.js expectations
          const statsResponse = await axios.get(backendUrl + '/api/dashboard/stats', {
            headers: { token: token }
          });

          if (!statsResponse.data.success) {
            throw new Error(statsResponse.data.message || "Failed to load dashboard stats");
          }

          setStats(statsResponse.data.stats);

          // Continue with other API calls with the same header format
          const salesTrendsResponse = await axios.get(backendUrl + '/api/dashboard/sales-trends', {
            headers: { token: token },
            params: { period: 'monthly' }
          });

          if (salesTrendsResponse.data.success) {
            setSalesTrends(salesTrendsResponse.data.salesData || []);
          }

          const productPerformanceResponse = await axios.get(backendUrl + '/api/dashboard/product-performance', {
            headers: { token: token }
          });

          if (productPerformanceResponse.data.success) {
            setProductPerformance(productPerformanceResponse.data.productPerformance || []);
          }

          const categoryDistributionResponse = await axios.get(backendUrl + '/api/dashboard/category-distribution', {
            headers: { token: token }
          });

          if (categoryDistributionResponse.data.success) {
            setCategoryDistribution(categoryDistributionResponse.data.categoryDistribution || []);
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          setError(`API error: ${apiError.message}`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error details:', err);
        setError(`Failed to load dashboard data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <FiDollarSign className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-5">
              <div className="text-gray-500 text-sm">Total Revenue (Monthly)</div>
              <div className="text-2xl font-bold text-gray-900">
                ${stats ? stats.revenue.monthly.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <FiShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <div className="text-gray-500 text-sm">Orders (Monthly)</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats ? stats.orders.monthly : '0'}
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
                {stats ? stats.users.total : '10'}
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
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-4">Revenue Trends</h2>
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

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-4">Order Trends</h2>
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
                maintainAspectRatio: false
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
                    ${product.revenue !== undefined ? Number(product.revenue).toFixed(2) : '0.00'}
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