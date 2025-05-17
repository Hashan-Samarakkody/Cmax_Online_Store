import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { Line } from 'react-chartjs-2';
import {
    FiTrendingUp,
    FiTrendingDown,
    FiAlertCircle,
    FiLoader,
    FiInfo
} from 'react-icons/fi';
import WebSocketService from '../services/WebSocketService';


const RevenuePrediction = ({ token }) => {
    const [predictionData, setPredictionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInfoBox, setShowInfoBox] = useState(false);

    useEffect(() => {
        const fetchPredictionData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get(`${backendUrl}/api/dashboard/revenue-prediction`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    setPredictionData(response.data);
                } else {
                    setError('Failed to fetch prediction data');
                }
            } catch (error) {
                console.error('Error fetching sales prediction:', error);
                setError('Error fetching sales prediction data');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPredictionData();

            // Connect to WebSocket if not already connected
            if (!WebSocketService.isConnected()) {
                WebSocketService.connect();
            }

            // Add event listeners for order-related events
            const handleOrderChange = () => {
                console.log('Order change detected, updating prediction data');
                fetchPredictionData();
            };

            WebSocketService.on('orderChange', handleOrderChange);
            WebSocketService.on('newOrder', handleOrderChange);

            // Clean up
            return () => {
                WebSocketService.off('orderChange', handleOrderChange);
                WebSocketService.off('newOrder', handleOrderChange);
            };
        }
    }, [token]);

    // Format chart data
    const prepareChartData = () => {
        if (!predictionData) return null;

        // Combine historical and prediction data
        const labels = [
            ...predictionData.historicalData.map(item => item._id),
            ...predictionData.predictions.map(item => `${item.month} ${item.year}`)
        ];

        const historicalValues = predictionData.historicalData.map(item => item.revenue);
        const predictionValues = predictionData.predictions.map(item => item.revenue);

        // Create empty values for historical data in prediction dataset and vice versa
        const historicalDataset = [
            ...historicalValues,
            ...Array(predictionValues.length).fill(null)
        ];

        const predictionDataset = [
            ...Array(historicalValues.length).fill(null),
            ...predictionValues
        ];

        // Create uncertainty bounds based on confidence levels
        const upperBoundDataset = [
            ...Array(historicalValues.length).fill(null),
            ...predictionData.predictions.map(item =>
                item.revenue * (1 + (100 - item.confidence) / 100)
            )
        ];

        const lowerBoundDataset = [
            ...Array(historicalValues.length).fill(null),
            ...predictionData.predictions.map(item =>
                item.revenue * (1 - (100 - item.confidence) / 100)
            )
        ];

        return {
            labels,
            datasets: [
                {
                    label: 'Historical Revenue',
                    data: historicalDataset,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.1
                },
                {
                    label: 'Predicted Revenue',
                    data: predictionDataset,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderDash: [5, 5],
                    tension: 0.1
                },
                {
                    label: 'Upper Bound',
                    data: upperBoundDataset,
                    fill: '+1',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderColor: 'transparent',
                    pointRadius: 0
                },
                {
                    label: 'Lower Bound',
                    data: lowerBoundDataset,
                    fill: false,
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    pointRadius: 0
                }
            ]
        };
    };

    const chartData = prepareChartData();
    const growthRateFormatted = predictionData ?
        (predictionData.growthRate * 100).toFixed(2) + '%' : '0%';
    const growthTrend = predictionData && predictionData.growthRate >= 0 ? 'positive' : 'negative';

    // Function to get confidence level descriptor
    const getConfidenceDescription = (confidence) => {
        if (confidence >= 80) return "Very High";
        if (confidence >= 60) return "High";
        if (confidence >= 40) return "Moderate";
        return "Low";
    };

    // Function to get confidence color
    const getConfidenceColor = (confidence) => {
        if (confidence >= 80) return "text-green-600";
        if (confidence >= 60) return "text-blue-600";
        if (confidence >= 40) return "text-yellow-600";
        return "text-red-600";
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-5 flex items-center justify-center h-64">
                <FiLoader className="animate-spin text-blue-600 h-8 w-8" />
                <span className="ml-2 text-gray-600">Loading prediction data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center text-red-500 mb-4">
                    <FiAlertCircle className="h-6 w-6" />
                    <h3 className="ml-2 font-semibold">Sales Prediction Error</h3>
                </div>
                <p className="text-gray-700">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <h2 className="text-lg font-bold text-gray-800">Sales Prediction</h2>
                    <button
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowInfoBox(!showInfoBox)}
                    >
                        <FiInfo className="h-5 w-5" />
                    </button>
                </div>
                <div className={`flex items-center ${growthTrend === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {growthTrend === 'positive' ?
                        <FiTrendingUp className="h-5 w-5" /> :
                        <FiTrendingDown className="h-5 w-5" />
                    }
                    <span className="ml-1 font-medium">{growthRateFormatted} monthly growth</span>
                </div>
            </div>

            {showInfoBox && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                    <p className="font-medium mb-1">About this prediction:</p>
                    <p className="mb-1">• Incorporates Sri Lankan seasonal patterns including Avurudu, Poya days, and Christmas</p>
                    <p className="mb-1">• Accounts for school vacation periods which affect shopping behavior</p>
                    <p>• Confidence levels decrease for predictions further in the future</p>
                </div>
            )}

            <div className="mb-4 h-64">
                {chartData && <Line data={chartData} options={{
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += `Rs. ${context.parsed.y.toFixed(2)}`;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'Revenue (Rs)'
                            },
                            ticks: {
                                callback: function (value) {
                                    return 'Rs ' + value;
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Period'
                            }
                        }
                    }
                }} />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {predictionData && predictionData.predictions.map((prediction, index) => {
                    const confidenceDesc = getConfidenceDescription(prediction.confidence);
                    const confidenceColor = getConfidenceColor(prediction.confidence);

                    return (
                        <div key={index} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                            <h4 className="font-medium text-gray-700">{prediction.month} {prediction.year}</h4>
                            <div className="text-xl font-bold text-gray-900">
                                Rs. {prediction.revenue.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </div>
                            <div className={`text-xs ${confidenceColor} mt-1 flex items-center`}>
                                <span className="font-medium">Confidence:</span>
                                <span className="ml-1">{confidenceDesc} ({prediction.confidence}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 bg-gray-50 p-3 rounded-md">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Seasonal Factors Considered</h3>
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Sinhala & Tamil New Year</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Christmas Season</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Poya Days</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">School Vacations</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Weekend Shopping</span>
                </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
                * Predictions are based on historical data and Sri Lankan seasonal patterns. Confidence levels indicate prediction reliability.
            </div>
        </div>
    );
};

export default RevenuePrediction;