import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to model files
const modelPath = path.join(__dirname, '../models/ml/sri_lankan_revenue_model.pkl');
const componentsPath = path.join(__dirname, '../models/ml/model_components.json');
const precomputedForecastPath = path.join(__dirname, '../models/ml/next_3_months_forecast.csv');

// Sri Lankan holidays that affect retail sales
const sriLankanHolidays = {
    "New Year's Day": { month: 1, day: 1, impact: 0.8 },
    "Independence Day": { month: 2, day: 4, impact: 1.2 },
    "Sinhala & Tamil New Year": { month: 4, day: 13, impact: 1.8 },
    "May Day": { month: 5, day: 1, impact: 1.0 },
    "Vesak Full Moon": { month: 5, day: 7, impact: 0.7 },
    "Christmas": { month: 12, day: 25, impact: 1.6 },
    // Add more holidays as needed
};

// School vacation periods
const schoolVacations = [
    { start: { month: 4, day: 5 }, end: { month: 4, day: 20 }, impact: 1.3 },
    { start: { month: 8, day: 1 }, end: { month: 8, day: 20 }, impact: 1.2 },
    { start: { month: 12, day: 10 }, end: { month: 1, day: 10 }, impact: 1.5 },
];

// Service to handle revenue predictions
const predictionService = {
    modelComponents: null,
    precomputedForecast: null,

    // Initialize the prediction service
    initialize() {
        try {
            // Try loading the lightweight model components first
            if (fs.existsSync(componentsPath)) {
                this.modelComponents = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));
            } else {
                console.warn('Model components not found at', componentsPath);
            }

            // Load pre-computed forecast data
            if (fs.existsSync(precomputedForecastPath)) {
                const csvData = fs.readFileSync(precomputedForecastPath, 'utf8');
                const rows = csvData.trim().split('\n');
                const headers = rows[0].split(',');

                this.precomputedForecast = rows.slice(1).map(row => {
                    const values = row.split(',');
                    const rowData = {};
                    headers.forEach((header, i) => {
                        rowData[header] = header === 'ds' ? values[i] : parseFloat(values[i]);
                    });
                    return rowData;
                });

            } else {
                console.warn('Pre-computed forecast not found at', precomputedForecastPath);
            }

            return true;
        } catch (error) {
            console.error('Error initializing prediction service:', error);
            return false;
        }
    },

    // Get revenue predictions for the next 3 months
    async getRevenuePredictions(historicalData) {
        try {
            // If  have precomputed forecasts, use them as the base prediction
            if (this.precomputedForecast) {
                // Start with the precomputed forecast
                const predictions = [];
                const today = new Date();

                // Generate predictions for next 3 months
                for (let i = 1; i <= 3; i++) {
                    const targetMonth = (today.getMonth() + i) % 12;
                    const targetYear = today.getFullYear() + Math.floor((today.getMonth() + i) / 12);

                    // Find appropriate forecast from precomputed data or use adjusted historical data
                    let basePrediction = 0;
                    let confidence = 85 - (i * 5); // Decreasing confidence with prediction distance

                    // Start with precomputed data for the target month if available
                    const targetMonthForecasts = this.precomputedForecast.filter(f => {
                        const forecastDate = new Date(f.ds);
                        return forecastDate.getMonth() === targetMonth && forecastDate.getFullYear() === targetYear;
                    });

                    if (targetMonthForecasts.length > 0) {
                        // Average the predictions for the month
                        basePrediction = targetMonthForecasts.reduce((sum, f) => sum + f.yhat, 0) / targetMonthForecasts.length;
                    } else {
                        // Fall back to historical patterns
                        basePrediction = this.getPredictionFromHistorical(historicalData, targetMonth);
                        confidence -= 10; // Lower confidence for historical-based predictions
                    }

                    // Apply current growth trend from historical data
                    const growthRate = this.calculateGrowthRate(historicalData);
                    const growthAdjustedPrediction = basePrediction * Math.pow(1 + growthRate, i);

                    // Apply seasonal adjustments
                    const seasonalFactor = this.getSeasonalFactor(targetMonth, targetYear);
                    const finalPrediction = growthAdjustedPrediction * seasonalFactor;

                    // Add prediction to result
                    predictions.push({
                        month: this.getMonthName(targetMonth),
                        year: targetYear,
                        revenue: Math.max(10, finalPrediction), // Ensure predictions are positive
                        confidence: Math.max(40, confidence)
                    });
                }

                return {
                    predictions,
                    growthRate: this.calculateGrowthRate(historicalData)
                };
            }

            // If no precomputed data is available, fall back to simplified model
            return this.getFallbackPredictions(historicalData);
        } catch (error) {
            console.error('Error generating revenue predictions:', error);
            return this.getFallbackPredictions(historicalData);
        }
    },

    // Generate predictions using a simplified model when Prophet model isn't available
    getFallbackPredictions(historicalData) {
        try {
            const today = new Date();
            const predictions = [];

            // Calculate average revenue and growth rate from historical data
            const avgRevenue = this.getAverageRevenue(historicalData);
            const growthRate = this.calculateGrowthRate(historicalData);

            // Generate predictions for next 3 months
            for (let i = 1; i <= 3; i++) {
                const targetMonth = (today.getMonth() + i) % 12;
                const targetYear = today.getFullYear() + Math.floor((today.getMonth() + i) / 12);

                // Apply growth trend
                let prediction = avgRevenue * Math.pow(1 + growthRate, i);

                // Apply seasonal factor
                const seasonalFactor = this.getSeasonalFactor(targetMonth, targetYear);
                prediction *= seasonalFactor;

                // Add prediction to result with decreasing confidence
                predictions.push({
                    month: this.getMonthName(targetMonth),
                    year: targetYear,
                    revenue: Math.max(10, prediction), // Ensure predictions are positive
                    confidence: Math.max(40, 80 - (i * 10)) // Decreasing confidence
                });
            }

            return {
                predictions,
                growthRate
            };
        } catch (error) {
            console.error('Error in fallback predictions:', error);
            return {
                predictions: [],
                growthRate: 0
            };
        }
    },

    // Calculate average revenue from historical data
    getAverageRevenue(historicalData) {
        if (!historicalData || historicalData.length === 0) return 1000; // Default value
        return historicalData.reduce((sum, item) => sum + item.revenue, 0) / historicalData.length;
    },

    // Calculate growth rate from historical data
    calculateGrowthRate(historicalData) {
        if (!historicalData || historicalData.length < 2) return 0.05; // Default growth rate

        // Use recent data for growth calculation (last 6 periods if available)
        const recentData = historicalData.slice(-Math.min(6, historicalData.length));

        // Calculate month-over-month growth rates
        let growthSum = 0;
        let growthCount = 0;

        for (let i = 1; i < recentData.length; i++) {
            if (recentData[i - 1].revenue > 0) {
                const monthGrowth = (recentData[i].revenue - recentData[i - 1].revenue) / recentData[i - 1].revenue;
                growthSum += monthGrowth;
                growthCount++;
            }
        }

        // Calculate average growth rate
        const avgGrowth = growthCount > 0 ? growthSum / growthCount : 0.05;

        // Limit growth rate to reasonable bounds
        return Math.max(-0.15, Math.min(0.25, avgGrowth));
    },

    // Get prediction from historical data for a specific month
    getPredictionFromHistorical(historicalData, targetMonth) {
        if (!historicalData || historicalData.length === 0) return 1000; // Default value

        // Find historical data points for the target month
        const monthData = historicalData.filter(item => {
            const itemDate = new Date(item._id);
            return itemDate.getMonth() === targetMonth;
        });

        if (monthData.length > 0) {
            // Average of historical values for this month
            return monthData.reduce((sum, item) => sum + item.revenue, 0) / monthData.length;
        } else {
            // Fallback to overall average
            return this.getAverageRevenue(historicalData);
        }
    },

    // Get seasonal factor for a specific month and year
    getSeasonalFactor(month, year) {
        // Start with basic monthly seasonality from model components or fallback
        let seasonalIndex = this.modelComponents?.seasonal_indices?.monthly?.[month] || 1.0;

        // Check if the month contains holidays
        for (const [holiday, data] of Object.entries(sriLankanHolidays)) {
            if (data.month === month + 1) {
                // Adjust seasonal factor for holiday impact
                seasonalIndex *= data.impact;
            }
        }

        // Check if the month is within school vacation periods
        for (const vacation of schoolVacations) {
            // Handle vacations that span across year boundary (Dec-Jan)
            const isVacationMonth =
                (vacation.start.month === month + 1) ||
                (vacation.end.month === month + 1) ||
                (vacation.start.month > vacation.end.month &&
                    (month + 1 >= vacation.start.month || month + 1 <= vacation.end.month));

            if (isVacationMonth) {
                seasonalIndex *= vacation.impact;
            }
        }

        // Special cases for major Sri Lankan shopping seasons
        if (month === 3) { // April (Avurudu season)
            seasonalIndex *= 1.5;
        } else if (month === 11) { // December (Christmas/Year-end)
            seasonalIndex *= 1.8;
        }

        return seasonalIndex;
    },

    // Helper method to get month name from month index
    getMonthName(monthIndex) {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return months[monthIndex];
    }
};

export default predictionService;