import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { backendUrl } from '../App';
import WebSocketService from '../services/WebSocketService';
import { FaImage, FaVideo, FaPlayCircle } from 'react-icons/fa';

const ReturnRequests = ({ token }) => {
	const [returns, setReturns] = useState([]);
	const [expandedReturn, setExpandedReturn] = useState(null);
	const [statusInputs, setStatusInputs] = useState({});
	const [trackingInputs, setTrackingInputs] = useState({});
	const [mediaPreview, setMediaPreview] = useState(null);

	useEffect(() => {
		if (token) {
			fetchReturns();

			// WebSocket setup
			const handleNewReturnRequest = (data) => {
				fetchReturns();
				toast.info('New return request received');
			};

			// Add this new handler for return status changes
			const handleReturnStatusUpdate = (data) => {
				fetchReturns();
				toast.info(`Return #${data.return.returnId} status updated to ${data.return.status}`);
			};

			WebSocketService.connect(() => {
				WebSocketService.on('newReturnRequest', handleNewReturnRequest);
				WebSocketService.on('returnStatusUpdate', handleReturnStatusUpdate); // Add this line
			});

			return () => {
				WebSocketService.off('newReturnRequest', handleNewReturnRequest);
				WebSocketService.off('returnStatusUpdate', handleReturnStatusUpdate); // Add this line
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
		// Close media preview if open
		setMediaPreview(null);
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
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Media</th>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Status</th>
							<th className="px-6 py-3 text-left text-lg font-bold text-black uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{returns.length === 0 ? (
							<tr>
								<td colSpan="8" className="px-6 py-4 text-center text-gray-500">
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
											<td colSpan="8" className="px-6 py-4">
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
																		{item.size && (
																			<>
																				<b>Size:</b> {item.size.split('_')[0]}{' '}
																				{item.size.includes('_') && (
																					<><b>Color:</b> {item.size.split('_')[1]}</>
																				)}
																			</>
																		)}
																	</td>
																	<td className="px-4 py-2">{item.quantity}</td>
																	<td className="px-4 py-2">{item.reason}</td>
																	<td className="px-4 py-2">{item.condition}</td>
																</tr>
															))}
														</tbody>
													</table>

													{/* Media Section */}
													{returnItem.media && returnItem.media.length > 0 && (
														<div className="mb-6">
															<h3 className="font-semibold mb-2">Media Attachments</h3>
															<div className="grid grid-cols-6 gap-4">
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
																				className="w-full h-24 object-cover"
																			/>
																		) : (
																			<div className="w-full h-24 bg-gray-900 flex items-center justify-center relative">
																				<FaPlayCircle className="text-white text-4xl" />
																				<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1">
																					Video
																				</div>
																			</div>
																		)}
																	</div>
																))}
															</div>
														</div>
													)}

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