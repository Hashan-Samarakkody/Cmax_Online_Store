import React, { useState } from 'react';
import axios from 'axios';
import { FiDownload, FiCalendar, FiLoader } from 'react-icons/fi';
import { backendUrl } from '../App';

const SalesReport = () => {
    const [startDate, setStartDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Get today's date in YYYY-MM-DD format for the max date attribute
    const today = new Date().toISOString().split('T')[0];

    const handleGenerateReport = async () => {
        // Validate input
        if (!startDate) {
            setError('Please select a start date');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Make API call to generate report
            const token = localStorage.getItem('adminToken');

            // Use blob response type to handle PDF download
            const response = await axios.get(
                `${backendUrl}/api/reports/sales`,
                {
                    headers: { token },
                    params: { startDate },
                    responseType: 'blob'
                }
            );

            // Check if the response is actually a PDF (has appropriate content type)
            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('application/pdf')) {
                // Create download link for PDF
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;

                // Format dates for filename
                const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
                const formattedEndDate = new Date().toISOString().split('T')[0];

                link.setAttribute('download', `sales_report_${formattedStartDate}_to_${formattedEndDate}.pdf`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url); // Clean up the URL object

                setSuccess('Report generated successfully');
            } else {
                // Handle case where response is not a PDF
                setError('Received invalid response format from server');
            }
        } catch (error) {
            console.error('Error generating report:', error);

            // Include more detailed error information
            let errorMessage = 'Failed to generate report';

            // Handle API error response
            if (error.response) {
                errorMessage += ` (${error.response.status})`;

                if (error.response?.data instanceof Blob) {
                    // Convert blob error to text
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorData = JSON.parse(reader.result);
                            setError(errorData.message || errorMessage);
                        } catch (e) {
                            setError(errorMessage);
                        }
                    };
                    reader.readAsText(error.response.data);
                    return; // Return early as we're setting the error asynchronously
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Sales Report Generator</h1>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-blue-700">
                    Generate a hierarchical sales report showing item quantities sold grouped by category, subcategory, and product variations.
                    The report will include data from your selected start date until today.
                </p>
            </div>

            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiCalendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="date"
                            max={today}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Select the starting date for your report</p>
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiCalendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="date"
                            value={today}
                            disabled
                            className="pl-10 block w-full shadow-sm bg-gray-100 sm:text-sm border-gray-300 rounded-md cursor-not-allowed"
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">End date is fixed to today</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                    <p className="text-green-700">{success}</p>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={handleGenerateReport}
                    disabled={loading || !startDate}
                    className={`
                        inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                        ${loading || !startDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}
                    `}
                >
                    {loading ? (
                        <>
                            <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
                            Generate Report
                        </>
                    )}
                </button>
            </div>

            <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold mb-3">Report Preview</h2>
                <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2">Category</th>
                                <th className="border border-gray-300 px-4 py-2">Subcategory</th>
                                <th className="border border-gray-300 px-4 py-2">Item Name</th>
                                <th className="border border-gray-300 px-4 py-2">Color</th>
                                <th className="border border-gray-300 px-4 py-2">Size</th>
                                <th className="border border-gray-300 px-4 py-2">Quantity</th>
                                <th className="border border-gray-300 px-4 py-2">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2 text-gray-500 text-center" colSpan="7">
                                    Generated report will follow this format
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2">Category-1</td>
                                <td className="border border-gray-300 px-4 py-2">Subcategory-1</td>
                                <td className="border border-gray-300 px-4 py-2">Example Item</td>
                                <td className="border border-gray-300 px-4 py-2">Red</td>
                                <td className="border border-gray-300 px-4 py-2">S</td>
                                <td className="border border-gray-300 px-4 py-2">10</td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2">Blue</td>
                                <td className="border border-gray-300 px-4 py-2">M</td>
                                <td className="border border-gray-300 px-4 py-2">5</td>
                                <td className="border border-gray-300 px-4 py-2">15 (sum of quantity)</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2 font-semibold">Total items sold in subcategory-1</td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2 font-semibold">15 (sum of subcategory)</td>
                            </tr>
                            <tr className="bg-gray-100">
                                <td className="border border-gray-300 px-4 py-2 font-semibold">Total items sold in category-1</td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2 font-semibold">15 (sum of category)</td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td className="border border-gray-300 px-4 py-2 font-bold">Total items sold (overall)</td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2 font-bold">15 (grand total)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesReport;