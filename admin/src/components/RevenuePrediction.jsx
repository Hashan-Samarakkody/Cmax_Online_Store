import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { Line } from 'react-chartjs-2';
import { FiTrendingUp, FiAlertCircle, FiLoader } from 'react-icons/fi';

const RevenuePrediction = ({ token }) => {
    const [predictionData, setPredictionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                console.error('Error fetching revenue prediction:', error);
                setError('Error fetching revenue prediction data');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPredictionData();
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

        const upperBoundDataset = [
            ...Array(historicalValues.length).fill(null),
            ...predictionData.predictions.map(item => item.revenue * (1 + (100 - item.confidence) / 100))
        ];

        const lowerBoundDataset = [
            ...Array(historicalValues.length).fill(null),
            ...predictionData.predictions.map(item => item.revenue * (1 - (100 - item.confidence) / 100))
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
                    <h3 className="ml-2 font-semibold">Revenue Prediction Error</h3>
                </div>
                <p className="text-gray-700">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Revenue Prediction</h2>
                <div className={`flex items-center ${growthTrend === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    <FiTrendingUp className="h-5 w-5" />
                    <span className="ml-1 font-medium">{growthRateFormatted} monthly growth</span>
                </div>
            </div>

            <div className="mb-4 h-64">
                {chartData && <Line data={chartData} options={{ maintainAspectRatio: false }} />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {predictionData && predictionData.predictions.map((prediction, index) => (
                    <div key={index} className="border rounded-lg p-3">
                        <h4 className="font-medium text-gray-700">{prediction.month} {prediction.year}</h4>
                        <div className="text-xl font-bold text-gray-900">
                            Rs.{prediction.revenue.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Confidence: {prediction.confidence}%
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-xs text-gray-500">
                * Predictions are based on historical data and may vary. The confidence level decreases for predictions further in the future.
            </div>
        </div>
    );
};

export default RevenuePrediction;