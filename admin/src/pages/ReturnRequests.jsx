import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { backendUrl } from '../App';
import WebSocketService from '../services/WebSocketService';

const ReturnRequests = ({ token }) => {
	const [returns, setReturns] = useState([]);
	const [expandedReturn, setExpandedReturn] = useState(null);
	const [statusInputs, setStatusInputs] = useState({});
	const [trackingInputs, setTrackingInputs] = useState({});

	useEffect(() => {
		if (token) {
			fetchReturns();

			// WebSocket setup
			const handleNewReturnRequest = (data) => {
				fetchReturns();
				toast.info('New return request received');
			};

			WebSocketService.connect(() => {
				WebSocketService.on('newReturnRequest', handleNewReturnRequest);
			});

			return () => {
				WebSocketService.off('newReturnRequest', handleNewReturnRequest);
			};
		}
	}, [token]);

	const fetchReturns = async () => {
		try {
			const response = await axios.get(`${backendUrl}/api/returns/admin`, {
				headers: { token }
			});

			if (response.data.success) {
				setReturns(response.data.returns);
			}
		} catch (error) {
			console.error('Error fetching returns:', error);
			toast.error('Failed to load return requests');
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
				toast.success(`Return status updated to ${newStatus}`);
				fetchReturns();
			}
		} catch (error) {
			console.error('Error updating return status:', error);
			toast.error(error.response?.data?.message || 'Failed to update status');
		}
	};

	const toggleExpand = (returnId) => {
		setExpandedReturn(expandedReturn === returnId ? null : returnId);
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

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Return Requests</h1>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-500">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Return ID</th>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Date</th>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Customer</th>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Items</th>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Amount</th>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Status</th>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{returns.length === 0 ? (
							<tr>
								<td colSpan="7" className="px-6 py-4 text-center text-gray-500">
									No return requests found
								</td>
							</tr>
						) : (
							returns.map(returnItem => (
								<React.Fragment key={returnItem._id}>
									<tr className="bg-green-100 hover:bg-white hover:cursor-pointer hover:text-black">
										<td className="px-6 py-4 whitespace-nowrap">{returnItem.returnId}</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{format(new Date(returnItem.requestedDate), 'dd MMM yyyy')}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">{returnItem.userName}</td>
										<td className="px-6 py-4 whitespace-nowrap">{returnItem.items.length}</td>
										<td className="px-6 py-4 whitespace-nowrap">Rs. {returnItem.refundAmount}</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClass(returnItem.status)}`}>
												{returnItem.status}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<button
												onClick={() => toggleExpand(returnItem._id)}
												className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
											>
												{expandedReturn === returnItem._id ? 'Hide Details' : 'View Details'}
											</button>
										</td>
									</tr>

									{expandedReturn === returnItem._id && (
										<tr>
											<td colSpan="7" className="px-6 py-4">
												<div className="bg-gray-50 p-4 rounded">
													<h3 className="font-semibold mb-2">Return Items</h3>
													<table className="min-w-full divide-y divide-gray-200 mb-4">
														<thead className="bg-gray-100">
															<tr>
																<th className="px-4 py-2 text-left text-xs font-bold">Product</th>
																<th className="px-4 py-2 text-left text-xs font-bold">Details</th>
																<th className="px-4 py-2 text-left text-xs font-bold">Quantity</th>
																<th className="px-4 py-2 text-left text-xs font-bold">Reason</th>
																<th className="px-4 py-2 text-left text-xs font-bold">Condition</th>
															</tr>
														</thead>
														<tbody>
															{returnItem.items.map((item, index) => (
																<tr key={index} className="bg-white">
																	<td className="px-4 py-2">{item.name}</td>
																	<td className="px-4 py-2">
																		<b>Size:</b> {item.size.split('_')[0]} <b>Color:</b> {item.size.split('_')[1]}
																	</td>
																	<td className="px-4 py-2">{item.quantity}</td>
																	<td className="px-4 py-2">{item.reason}</td>
																	<td className="px-4 py-2">{item.condition}</td>
																</tr>
															))}
														</tbody>
													</table>

													<div className="bg-white p-4 rounded border">
														<h3 className="font-semibold mb-2">Update Status</h3>
														<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
																		Return Tracking ID (Optional):
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
																	className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
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
	);
};

export default ReturnRequests;