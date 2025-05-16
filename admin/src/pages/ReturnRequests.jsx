import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import WebSocketService from '../services/WebSocketService';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { FaImage, FaVideo, FaPlayCircle, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReturnRequests = ({ token }) => {
	const [returns, setReturns] = useState([]);
	const navigate = useNavigate();
	const [expandedReturn, setExpandedReturn] = useState(null);
	const [statusInputs, setStatusInputs] = useState({});
	const [trackingInputs, setTrackingInputs] = useState({});
	const [mediaPreview, setMediaPreview] = useState(null);
	const [orderDetails, setOrderDetails] = useState({});
	const [isLoadingOrder, setIsLoadingOrder] = useState(false);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalReturns, setTotalReturns] = useState(0);

	// Add new search state variables
	const [searchType, setSearchType] = useState('id');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchAmount, setSearchAmount] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [dateRange, setDateRange] = useState({
		startDate: null,
		endDate: null
	});
	const [filteredReturns, setFilteredReturns] = useState([]);
	const [isSearchActive, setIsSearchActive] = useState(false);

	useEffect(() => {
		if (isSearchActive) {
			filterReturns();
		} else {
			setFilteredReturns(returns);
		}
	}, [isSearchActive, searchQuery, searchType, searchAmount, dateRange, returns]);

	const fetchReturns = async () => {
		try {
			const response = await axios.get(`${backendUrl}/api/returns/admin`, {
				headers: { token },
				params: {
					page: currentPage,
					limit: itemsPerPage
				}
			});

			if (response.data.success) {
				const fetchedReturns = response.data.returns;
				setReturns(fetchedReturns);
				setFilteredReturns(fetchedReturns); // Initialize filtered with all returns
				setTotalReturns(response.data.total || fetchedReturns.length);
			}
		} catch (error) {
			console.error('Error fetching returns:', error);
			toast.error('Failed to load return requests');
		}
	};

	const filterReturns = () => {
		let results = [...returns];

		if (searchType === 'id' && searchQuery) {
			results = results.filter(item =>
				item.returnId.toLowerCase().includes(searchQuery.toLowerCase())
			);
		} else if (searchType === 'customer' && searchQuery) {
			results = results.filter(item =>
				item.userName.toLowerCase().includes(searchQuery.toLowerCase())
			);
		} else if (searchType === 'amount' && searchAmount) {
			const amount = parseFloat(searchAmount);
			if (!isNaN(amount)) {
				results = results.filter(item =>
					parseFloat(item.refundAmount) === amount
				);
			}
		} else if (searchType === 'date' && (dateRange.startDate || dateRange.endDate)) {
			results = results.filter(item => {
				const returnDate = new Date(item.requestedDate);

				if (dateRange.startDate && dateRange.endDate) {
					return returnDate >= dateRange.startDate && returnDate <= dateRange.endDate;
				} else if (dateRange.startDate) {
					return returnDate >= dateRange.startDate;
				} else if (dateRange.endDate) {
					return returnDate <= dateRange.endDate;
				}
				return true;
			});
		} else if (searchType === 'status') {
			// No need for additional search query, just use the statusFilter value
			if (statusFilter !== 'all') {
				results = results.filter(item => item.status === statusFilter);
			}
		}

		setFilteredReturns(results);
	  };

	// Add search handler function
	const handleSearch = (e) => {
		e.preventDefault();
		setIsSearchActive(true);
		filterReturns();
	};

	// Reset search filters
	const resetSearch = () => {
		setSearchType('id');
		setSearchQuery('');
		setSearchAmount('');
		setStatusFilter('all');
		setDateRange({ startDate: null, endDate: null });
		setIsSearchActive(false);
		setFilteredReturns(returns);
  };

	useEffect(() => {
		if (token) {
			fetchReturns();

			// WebSocket setup
			const handleNewReturnRequest = (data) => {
				fetchReturns();
				toast.info('New return request received');
			};

			//Handler for return status changes
			const handleReturnStatusUpdate = (data) => {
				fetchReturns();
				toast.info(`Return #${data.return.returnId} status updated to ${data.return.status}`);
			};

			WebSocketService.connect(() => {
				WebSocketService.on('newReturnRequest', handleNewReturnRequest);
				WebSocketService.on('returnStatusUpdate', handleReturnStatusUpdate);
			});

			return () => {
				WebSocketService.off('newReturnRequest', handleNewReturnRequest);
				WebSocketService.off('returnStatusUpdate', handleReturnStatusUpdate);
			};
		}
	}, [token, currentPage, itemsPerPage]); 


	// Fetch original order details
	const fetchOrderDetails = async (orderId) => {
		// If we already have fetched this order, don't fetch again
		if (orderDetails[orderId]) return;

		setIsLoadingOrder(true);
		try {
			const response = await axios.get(`${backendUrl}/api/order/details/${orderId}`, {
				headers: { token }
			});

			if (response.data.success) {
				setOrderDetails(prev => ({
					...prev,
					[orderId]: response.data.order
				}));
			} else {
				toast.error('Failed to load order details');
			}
		} catch (error) {
			console.error('Error fetching order details:', error);
			toast.error('Failed to load order details');
		} finally {
			setIsLoadingOrder(false);
		}
	};

	const handleStatusChange = async (returnId) => {
		const newStatus = statusInputs[returnId];
		const trackingId = trackingInputs[returnId];

		if (!newStatus) {
			toast.error('Please select a status');
			return;
		}

		try {
			const response = await axios.post(`${backendUrl}/api/returns/update-status`, {
				returnId,
				status: newStatus,
				trackingId: trackingId || null
			}, {
				headers: { token }
			});

			if (response.data.success) {
				// Improved toast notification with more details
				toast.success(
					<div>
						<strong>Status Updated Successfully</strong>
						<div>Return #{returnId} is now <span className="font-semibold">{newStatus}</span></div>
						{trackingId && <div>Tracking ID: {trackingId}</div>}
					</div>,
					{
						autoClose: 5000, // Give admin more time to read the notification
						position: "top-right"
					}
				);
				fetchReturns();
			}
		} catch (error) {
			console.error('Error updating return status:', error);
			toast.error(error.response?.data?.message || 'Failed to update status');
		}
	};
	const toggleExpand = (returnId, orderId) => {
		if (expandedReturn === returnId) {
			setExpandedReturn(null);
			setMediaPreview(null);
		} else {
			setExpandedReturn(returnId);
			setMediaPreview(null);
			// Fetch the original order details when expanding
			if (orderId) {
				fetchOrderDetails(orderId);
			}
		}
	};

	const openMediaPreview = (media) => {
		setMediaPreview(media);
	};

	const closeMediaPreview = () => {
		setMediaPreview(null);
	};

	const handleStatusInput = (returnId, value) => {
		setStatusInputs(prev => ({ ...prev, [returnId]: value }));
	};

	const handleTrackingInput = (returnId, value) => {
		setTrackingInputs(prev => ({ ...prev, [returnId]: value }));
	};

	const getStatusClass = (status) => {
		switch (status) {
			case 'Requested': return 'bg-yellow-100 text-yellow-800';
			case 'Approved': return 'bg-blue-100 text-blue-800';
			case 'In Transit': return 'bg-purple-100 text-purple-800';
			case 'Received': return 'bg-indigo-100 text-indigo-800';
			case 'Inspected': return 'bg-orange-100 text-orange-800';
			case 'Completed': return 'bg-green-100 text-green-800';
			case 'Rejected': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100';
		}
	};

	// Format date for display
	const formatDate = (timestamp) => {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const totalPages = Math.ceil(totalReturns / itemsPerPage);

	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (e) => {
		const newLimit = parseInt(e.target.value, 10);
		setItemsPerPage(newLimit);
		setCurrentPage(1); // Reset to first page when changing items per page
	};

	// Update the SearchBox component
	const SearchBox = () => {
		return (
			<div className="bg-white p-4 rounded-lg shadow mb-4">
				<form onSubmit={handleSearch} className="space-y-3">
					<div className="flex flex-wrap items-center gap-4 mb-3">
						<h3 className="font-semibold text-lg mr-2">Search by:</h3>

						<div className="flex items-center">
							<input
								type="radio"
								id="searchById"
								name="searchType"
								value="id"
								checked={searchType === 'id'}
								onChange={() => setSearchType('id')}
								className="mr-1"
							/>
							<label htmlFor="searchById" className="mr-3 text-sm">Return ID</label>
						</div>

						<div className="flex items-center">
							<input
								type="radio"
								id="searchByCustomer"
								name="searchType"
								value="customer"
								checked={searchType === 'customer'}
								onChange={() => setSearchType('customer')}
								className="mr-1"
							/>
							<label htmlFor="searchByCustomer" className="mr-3 text-sm">Customer</label>
						</div>

						<div className="flex items-center">
							<input
								type="radio"
								id="searchByAmount"
								name="searchType"
								value="amount"
								checked={searchType === 'amount'}
								onChange={() => setSearchType('amount')}
								className="mr-1"
							/>
							<label htmlFor="searchByAmount" className="mr-3 text-sm">Amount</label>
						</div>

						<div className="flex items-center">
							<input
								type="radio"
								id="searchByDate"
								name="searchType"
								value="date"
								checked={searchType === 'date'}
								onChange={() => setSearchType('date')}
								className="mr-1"
							/>
							<label htmlFor="searchByDate" className="mr-3 text-sm">Date Range</label>
						</div>

						{/* New Status filter radio button */}
						<div className="flex items-center">
							<input
								type="radio"
								id="searchByStatus"
								name="searchType"
								value="status"
								checked={searchType === 'status'}
								onChange={() => setSearchType('status')}
								className="mr-1"
							/>
							<label htmlFor="searchByStatus" className="text-sm">Status</label>
						</div>
					</div>

					<div className="flex flex-wrap gap-4">
						{(searchType === 'id' || searchType === 'customer') && (
							<div className="flex-1">
								<input
									type="text"
									placeholder={searchType === 'id' ? "Enter Return ID..." : "Enter Customer Name..."}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded"
								/>
							</div>
						)}

						{searchType === 'amount' && (
							<div className="flex-1">
								<input
									type="number"
									step="0.01"
									placeholder="Enter Amount..."
									value={searchAmount}
									onChange={(e) => setSearchAmount(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded"
								/>
							</div>
						)}

						{searchType === 'date' && (
							<div className="flex flex-col sm:flex-row gap-2 flex-1">
								<div className="flex items-center flex-1 relative">
									<label className="text-sm mr-2">From:</label>
									<DatePicker
										selected={dateRange.startDate}
										onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
										className="w-full p-2 border border-gray-300 rounded"
										placeholderText="Start Date"
										dateFormat="dd/MM/yyyy"
									/>
									<FaCalendarAlt className="absolute right-2 text-gray-400" />
								</div>
								<div className="flex items-center flex-1 relative">
									<label className="text-sm mr-2">To:</label>
									<DatePicker
										selected={dateRange.endDate}
										onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
										className="w-full p-2 border border-gray-300 rounded"
										placeholderText="End Date"
										dateFormat="dd/MM/yyyy"
										minDate={dateRange.startDate}
									/>
									<FaCalendarAlt className="absolute right-2 text-gray-400" />
								</div>
							</div>
						)}

						{/* New Status dropdown for status filtering */}
						{searchType === 'status' && (
							<div className="flex-1">
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded"
								>
									<option value="all">All Statuses</option>
									<option value="Requested">Requested</option>
									<option value="Approved">Approved</option>
									<option value="In Transit">In Transit</option>
									<option value="Received">Received</option>
									<option value="Inspected">Inspected</option>
									<option value="Completed">Completed</option>
									<option value="Rejected">Rejected</option>
								</select>
							</div>
						)}

						<div className="flex gap-2">
							<button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center">
								<FaSearch className="mr-1" /> Search
							</button>
							{isSearchActive && (
								<button
									type="button"
									onClick={resetSearch}
									className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
								>
									Reset
								</button>
							)}
						</div>
					</div>
				</form>

				{isSearchActive && (
					<div className="mt-3 text-sm text-gray-600">
						Found {filteredReturns.length} results
						{isSearchActive && filteredReturns.length === 0 && (
							<span className="ml-2 text-red-500">No returns match your search criteria</span>
						)}
					</div>
				)}
			</div>
		);
  };

	// Create pagination UI component
	const Pagination = () => {
		const pageNumbers = [];

		// Logic to show only a range of page numbers (max 5) around current page
		let startPage = Math.max(1, currentPage - 2);
		let endPage = Math.min(totalPages, startPage + 4);

		// Adjust if we're near the end
		if (endPage - startPage < 4 && startPage > 1) {
			startPage = Math.max(1, endPage - 4);
		}

		for (let i = startPage; i <= endPage; i++) {
			pageNumbers.push(i);
		}

		return (
			<div className="flex items-center justify-between mt-4 bg-white p-4 rounded-lg shadow">
				<div className="flex items-center">
					<span className="text-sm text-gray-700 mr-2">Show</span>
					<select
						value={itemsPerPage}
						onChange={handleItemsPerPageChange}
						className="p-1 border rounded text-sm"
					>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
						<option value={200}>200</option>
						<option value={300}>300</option>
					</select>
					<span className="text-sm text-gray-700 ml-2">per page</span>
				</div>

				<div className="flex items-center">
					<span className="text-sm text-gray-700 mr-4">
						Showing {returns.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalReturns)} of {totalReturns} returns
					</span>

					<nav className="flex items-center">
						<button
							onClick={() => handlePageChange(1)}
							disabled={currentPage === 1}
							className={`px-2 py-1 text-sm rounded-l-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
						>
							&laquo;
						</button>
						<button
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className={`px-2 py-1 text-sm border-t border-b ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
						>
							&lsaquo;
						</button>

						{startPage > 1 && (
							<>
								<button
									onClick={() => handlePageChange(1)}
									className="px-2 py-1 text-sm border-t border-b hover:bg-gray-50"
								>
									1
								</button>
								{startPage > 2 && <span className="px-2 py-1 border-t border-b">&hellip;</span>}
							</>
						)}

						{pageNumbers.map(number => (
							<button
								key={number}
								onClick={() => handlePageChange(number)}
								className={`px-3 py-1 text-sm border-t border-b ${currentPage === number ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}
							>
								{number}
							</button>
						))}

						{endPage < totalPages && (
							<>
								{endPage < totalPages - 1 && <span className="px-2 py-1 border-t border-b">&hellip;</span>}
								<button
									onClick={() => handlePageChange(totalPages)}
									className="px-2 py-1 text-sm border-t border-b hover:bg-gray-50"
								>
									{totalPages}
								</button>
							</>
						)}

						<button
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className={`px-2 py-1 text-sm border-t border-b ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
						>
							&rsaquo;
						</button>
						<button
							onClick={() => handlePageChange(totalPages)}
							disabled={currentPage === totalPages}
							className={`px-2 py-1 text-sm rounded-r-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
						>
							&raquo;
						</button>
					</nav>
				</div>
			</div>
		);
	};

	// Render the original order details
	const renderOrderDetails = (orderId) => {
		const order = orderDetails[orderId];

		if (!order) {
			return (
				<div className="flex justify-center items-center p-4">
					{isLoadingOrder ? (
						<div className="flex items-center">
							<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span>Loading order details...</span>
						</div>
					) : (
						<span className="text-red-500">Order details not available</span>
					)}
				</div>
			);
		}

		return (
			<div className="bg-green-50 p-4 rounded-lg border border-gray-300 mt-4">
				<h3 className="font-bold text-lg mb-3 text-blue-700 border-b pb-2">
					Original Order Details
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<h4 className="font-semibold text-green-600 mb-2">Basic Information</h4>
						<div className="bg-white p-3 rounded shadow-sm">
							<p><span className="font-semibold">Order ID:</span> {order.orderId}</p>
							<p><span className="font-semibold">Order Date:</span> {formatDate(order.date)}</p>
							<p><span className="font-semibold">Status:</span> {order.status}</p>
							<p><span className="font-semibold">Payment Method:</span> {order.paymentMethod}</p>
							<p><span className="font-semibold">Payment Status:</span> {order.payment ? 'Paid' : 'Pending'}</p>
							{order.trackingId && (
								<p><span className="font-semibold">Tracking ID:</span> {order.trackingId}</p>
							)}
						</div>
					</div>

					<div>
						<h4 className="font-semibold text-green-600 mb-2">Shipping Address</h4>
						<div className="bg-white p-3 rounded shadow-sm">
							<p><span className="font-semibold">Name:</span> {order.address.firstName} {order.address.lastName}</p>
							<p><span className="font-semibold">Address:</span> {order.address.street}, {order.address.city}, {order.address.state} {order.address.postalCode}</p>
							<p><span className="font-semibold">Phone:</span> {order.address.phoneNumber}</p>
						</div>
					</div>
				</div>

				<h4 className="font-bold text-gray-700 mt-4 mb-2">Items Ordered</h4>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-100">
							<tr>
								<th className="px-3 py-2 text-left text-sm font-bold text-gray-500 uppercase">Product</th>
								<th className="px-3 py-2 text-left text-sm font-bold text-gray-500 uppercase">Details</th>
								<th className="px-3 py-2 text-center text-sm font-bold text-gray-500 uppercase">Quantity</th>
								<th className="px-3 py-2 text-right text-sm font-bold text-gray-500 uppercase">Price</th>
								<th className="px-3 py-2 text-right text-sm font-bold text-gray-500 uppercase">Total</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{order.items.map((item, idx) => (
								<tr key={idx} className="hover:bg-gray-50">
									<td className="px-3 py-2 whitespace-nowrap text-xm">{item.name}</td>
									<td className="px-3 py-2 whitespace-nowrap text-xm">
										{item.size && (
											<>
												<i>Size:</i> {item.size.split('_')[0]}{' '}
												{item.size.includes('_') && (
													<><i>Color:</i> {item.size.split('_')[1]}</>
												)}
											</>
										)}
									</td>
									<td className="px-3 py-2 whitespace-nowrap text-xm text-center">{item.quantity}</td>
									<td className="px-3 py-2 whitespace-nowrap text-xm text-right">Rs. {item.price.toFixed(2)}</td>
									<td className="px-3 py-2 whitespace-nowrap text-xm text-right">Rs. {(item.price * item.quantity).toFixed(2)}</td>
								</tr>
							))}
							<tr className="bg-gray-50">
								<td colSpan="4" className="px-3 py-2 whitespace-nowrap text-xm text-right font-medium">Delivery Charge:</td>
								<td className="px-3 py-2 whitespace-nowrap text-xm text-right">Rs. 30.00</td>
							</tr>
							<tr className="bg-gray-50 font-bold">
								<td colSpan="4" className="px-3 py-2 whitespace-nowrap text-right">Total:</td>
								<td className="px-3 py-2 whitespace-nowrap text-right">Rs. {(order.amount).toFixed(2)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	};

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Return Requests</h1>

				{/* Button positioned at the same height as the heading on the right side */}
				<button
					onClick={() => navigate('/return-analysis')}
					className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
				>
					Return Analysis
				</button>
			</div>

			<SearchBox/>

			{/* Table to display return requests */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<Pagination/>
					<table className="min-w-full divide-y divide-gray-500">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Return ID</th>
								<th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Date and Time</th>
								<th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider hidden md:table-cell">Customer</th>
								<th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider hidden sm:table-cell">Items</th>
								<th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider hidden md:table-cell">Amount</th>
								<th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider hidden sm:table-cell">Media</th>
								<th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Status</th>
								<th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{returns.length === 0 ? (
								<tr>
									<td colSpan="8" className="px-4 py-4 text-center text-gray-500">
										No return requests found
									</td>
								</tr>
							) : (
								returns.map(returnItem => (
									<React.Fragment key={returnItem._id}>
										<tr className="bg-pink-50 hover:bg-white hover:cursor-pointer hover:text-black">
											<td className="px-4 py-3 whitespace-nowrap text-sm">{returnItem.returnId}</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm">
												{format(new Date(returnItem.requestedDate), 'dd MMM yyyy hh:mm a')}
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">{returnItem.userName}</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm hidden sm:table-cell">{returnItem.items.length}</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">Rs. {returnItem.refundAmount}</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm hidden sm:table-cell">
												{returnItem.media && returnItem.media.length > 0 ? (
													<div className="flex items-center">
														{returnItem.media.some(m => m.type === 'image') && (
															<FaImage className="text-blue-600 mr-2" />
														)}
														{returnItem.media.some(m => m.type === 'video') && (
															<FaVideo className="text-red-600" />
														)}
													</div>
												) : (
													<span className="text-gray-400">None</span>
												)}
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm">
												<span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClass(returnItem.status)}`}>
													{returnItem.status}
												</span>
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm">
												<button
													onClick={() => toggleExpand(returnItem._id, returnItem.originalOrderId)}
													className="'text-black border border-gray-800 hover:bg-black hover:text-white px-3 py-1 rounded text-xs sm:text-sm "
												>
													{expandedReturn === returnItem._id ? 'Hide' : 'View'}
												</button>
											</td>
										</tr>

										{/* Mobile-only: Additional information row */}
										<tr className="md:hidden">
											<td colSpan="8" className="px-4 py-2 bg-green-50">
												<div className="text-xs">
													<div><span className="font-semibold">Customer:</span> {returnItem.userName}</div>
													<div className="flex justify-between">
														<span><span className="font-semibold">Items:</span> {returnItem.items.length}</span>
														<span><span className="font-semibold">Amount:</span> Rs. {returnItem.refundAmount}</span>
													</div>
												</div>
											</td>
										</tr>

										{expandedReturn === returnItem._id && (
											<tr>
												<td colSpan="8" className="px-4 py-4">

													<div className="mb-6">
														<h3 className="font-semibold text-blue-700 mb-2 border-b pb-2">Return Items</h3>
														<div className="grid grid-cols-1 gap-4">
															{Array.isArray(returnItem.items) && returnItem.items.map((item, idx) => {
																// Find the corresponding item in the original order to get the image
																const originalOrder = orderDetails[returnItem.originalOrderId];
																const originalItem = originalOrder?.items.find(oi =>
																	oi.productId === item.productId &&
																	oi.size === item.size
																);

																return (
																	<div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
																		<div className="flex flex-col md:flex-row">
																			{/* Product image */}
																			<div className="w-30 h-30 mr-4 flex-shrink-0 mb-4 md:mb-0">
																				{originalItem && originalItem.images && originalItem.images.length > 0 ? (
																					<img
																						src={originalItem.images[0]}
																						alt={item.name}
																						className="w-full h-full object-cover rounded-md"
																					/>
																				) : (
																					<div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
																						<span className="text-gray-400 text-xs">No image</span>
																					</div>
																				)}
																			</div>

																			{/* Product details */}
																			<div className="flex-grow">
																				<h4 className="font-semibold text-lg mb-2">{item.name}</h4>

																				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																					<div>
																						<p className="text-sm">
																							<span className="font-medium">Size:</span> {item.size.split('_')[0]}
																						</p>
																						<p className="text-sm">
																							<span className="font-medium">Color:</span> {item.size.split('_')[1]}
																						</p>
																						<p className="text-sm">
																							<span className="font-medium">Quantity:</span> {item.quantity}
																						</p>
																						<p className="text-sm">
																							<span className="font-medium">Price:</span> Rs. {item.price}
																						</p>
																					</div>

																					<div className="bg-gray-50 p-3 rounded-md">
																						<p className="text-sm">
																							<span className="font-medium">Return Reason:</span> {item.reason}
																						</p>
																						<p className="text-sm">
																							<span className="font-medium">Condition:</span> {item.condition}
																						</p>

																						{/* Display custom reason if present */}
																						{item.customReason && (
																							<div className="mt-2">
																								<p className="text-sm font-medium text-red-600">Custom Reason:</p>
																								<div className="bg-yellow-50 p-2 border-l-4 border-red-400 text-sm text-justify mt-1 max-h-32 overflow-y-auto">
																									{item.customReason}
																								</div>
																							</div>
																						)}
																					</div>
																				</div>
																			</div>
																		</div>
																	</div>
																);
															})}
														</div>
													</div>

													<div className="bg-gray-50 p-4 rounded">
														{/* Media Section */}
														{returnItem.media && returnItem.media.length > 0 && (
															<div className="mb-6">
																<h3 className="font-semibold mb-2">Media Attachments</h3>

																{/* Group media by item if they have itemIndex property */}
																{returnItem.items.some(item =>
																	returnItem.media.some(m => m.itemIndex === returnItem.items.indexOf(item))
																) ? (
																	// Display media grouped by item
																	returnItem.items.map((item, itemIdx) => {
																		const itemMedia = returnItem.media.filter(m => m.itemIndex === itemIdx);
																		if (itemMedia.length === 0) return null;

																		return (
																			<div key={itemIdx} className="mb-4">
																				<h4 className="text-sm font-medium mb-2">
																					Media for {item.name} ({item.size.split('_')[0]}, {item.size.split('_')[1]})
																				</h4>
																				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
																					{itemMedia.map((media, index) => (
																						<div
																							key={index}
																							className="relative border rounded-lg overflow-hidden cursor-pointer"
																							onClick={() => openMediaPreview(media)}
																						>
																							{media.type === 'image' ? (
																								<img
																									src={media.url}
																									alt={`Return media ${index}`}
																									className="w-full h-20 sm:h-24 object-cover"
																								/>
																							) : (
																								<div className="w-full h-20 sm:h-24 bg-gray-900 flex items-center justify-center relative">
																									<FaPlayCircle className="text-white text-3xl sm:text-4xl" />
																									<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1">
																										Video
																									</div>
																								</div>
																							)}
																						</div>
																					))}
																				</div>
																			</div>
																		);
																	})
																) : (
																	// Display all media together (legacy format)
																	<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
																		{returnItem.media.map((media, index) => (
																			<div
																				key={index}
																				className="relative border rounded-lg overflow-hidden cursor-pointer"
																				onClick={() => openMediaPreview(media)}
																			>
																				{media.type === 'image' ? (
																					<img
																						src={media.url}
																						alt={`Return media ${index}`}
																						className="w-full h-20 sm:h-24 object-cover"
																					/>
																				) : (
																					<div className="w-full h-20 sm:h-24 bg-gray-900 flex items-center justify-center relative">
																						<FaPlayCircle className="text-white text-3xl sm:text-4xl" />
																						<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1">
																							Video
																						</div>
																					</div>
																				)}
																			</div>
																		))}
																	</div>
																)}
															</div>
														)}

														{/* Original Order Section */}
														{returnItem.originalOrderId && renderOrderDetails(returnItem.originalOrderId)}

														<div className="bg-white p-3 sm:p-4 rounded border mt-4">
															<h3 className="font-semibold mb-2">Update Status</h3>
															<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
																<div>
																	<label className="block text-sm font-medium text-gray-700 mb-1">
																		Status:
																	</label>
																	<select
																		value={statusInputs[returnItem._id] || returnItem.status}
																		onChange={(e) => handleStatusInput(returnItem._id, e.target.value)}
																		className="w-full p-2 border rounded"
																	>
																		<option value="Requested">Requested</option>
																		<option value="Approved">Approved</option>
																		<option value="In Transit">In Transit</option>
																		<option value="Received">Received</option>
																		<option value="Inspected">Inspected</option>
																		<option value="Completed">Completed</option>
																		<option value="Rejected">Rejected</option>
																	</select>
																</div>

																{(statusInputs[returnItem._id] === 'Approved' || returnItem.status === 'Approved') && (
																	<div>
																		<label className="block text-sm font-medium text-gray-700 mb-1">
																			Return Tracking ID:
																		</label>
																		<input
																			type="text"
																			value={trackingInputs[returnItem._id] || returnItem.returnTrackingId || ''}
																			onChange={(e) => handleTrackingInput(returnItem._id, e.target.value)}
																			placeholder="Enter tracking ID"
																			className="w-full p-2 border rounded"
																		/>
																	</div>
																)}

																<div className="flex items-end">
																	<button
																		onClick={() => handleStatusChange(returnItem._id)}
																		className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
																	>
																		Update
																	</button>
																</div>
															</div>
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Media Preview Modal */}
			{mediaPreview && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeMediaPreview}>
					<div className="bg-white p-4 rounded-lg max-w-4xl w-full" onClick={e => e.stopPropagation()}>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold">
								{mediaPreview.type === 'image' ? 'Image Preview' : 'Video Preview'}
							</h3>
							<button
								onClick={closeMediaPreview}
								className="text-gray-500 hover:text-gray-700"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<div className="flex justify-center">
							{mediaPreview.type === 'image' ? (
								<img
									src={mediaPreview.url}
									alt="Return Item"
									className="max-h-[70vh] max-w-full object-contain"
								/>
							) : (
								<video
									src={mediaPreview.url}
									controls
									autoPlay
									className="max-h-[70vh] max-w-full"
								>
									Your browser does not support the video tag.
								</video>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ReturnRequests;