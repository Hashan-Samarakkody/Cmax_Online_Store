import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import { format } from 'date-fns';
import WebSocketService from '../services/WebSocketService';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-md p-4 sm:p-6 rounded-lg shadow-xl max-w-sm w-full border border-gray-200">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{title}</h2>
        <p className="mb-5 sm:mb-6 text-sm sm:text-base">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded text-sm sm:text-base hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded text-sm sm:text-base hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductReviews = ({ productId }) => {
  const { token, backendUrl } = useContext(ShopContext);
  const [reviews, setReviews] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [userReview, setUserReview] = useState({
    rating: 5,
    content: '',
  });
  const [editingReview, setEditingReview] = useState(null);
  const [replyToReview, setReplyToReview] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  // Function to open confirmation modal
  const openConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Function to close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({
      ...confirmModal,
      isOpen: false,
    });
  };

  // Check if user is logged in
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (token) {
        try {
          const response = await axios.get(`${backendUrl}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success) {
            setCurrentUser(response.data.user);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserInfo();
  }, [token, backendUrl]);

  // Fetch reviews
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/reviews/product/${productId}`);
      if (response.data.success) {
        setReviews(response.data.reviews);
        setReviewCount(response.data.count);
        setAverageRating(response.data.averageRating);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Could not load reviews");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch of reviews
  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, backendUrl]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Handle new review
    const handleNewReview = (data) => {
      if (data && data.review && data.productId === productId) {
        setReviews(prevReviews => [data.review, ...prevReviews]);
        setReviewCount(prevCount => prevCount + 1);
        // Recalculate average rating
        const newTotal = reviews.reduce((sum, review) => sum + review.rating, 0) + data.review.rating;
        setAverageRating(newTotal / (reviews.length + 1));
      }
    };

    // Handle updated review
    const handleUpdateReview = (data) => {
      if (data && data.review && data.productId === productId) {
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === data.review._id ? data.review : review
          )
        );
        // Recalculate average rating
        const newTotal = reviews.reduce((sum, review) =>
          review._id === data.review._id ? sum + data.review.rating : sum + review.rating, 0);
        setAverageRating(newTotal / reviews.length);
      }
    };

    // Handle deleted review
    const handleReviewDeleted = (data) => {
      if (data && data.reviewId && data.productId === productId) {
        setReviews(prevReviews => prevReviews.filter(review => review._id !== data.reviewId));
        setReviewCount(prevCount => prevCount - 1);

        // Recalculate average rating if there are still reviews
        if (reviews.length > 1) {
          const remainingReviews = reviews.filter(review => review._id !== data.reviewId);
          const newTotal = remainingReviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(newTotal / remainingReviews.length);
        } else {
          setAverageRating(0); // No reviews left
        }
      }
    };

    // Handle new reply
    const handleNewReply = (data) => {
      if (data && data.review && data.productId === productId) {
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === data.review._id ? data.review : review
          )
        );
      }
    };

    if (WebSocketService.isConnected()) {
      WebSocketService.on('newReview', handleNewReview);
      WebSocketService.on('updateReview', handleUpdateReview);
      WebSocketService.on('deleteReview', handleReviewDeleted);
      WebSocketService.on('newReply', handleNewReply);
      WebSocketService.on('deleteReply', handleNewReply);
    } else {
      WebSocketService.connect(() => {
        WebSocketService.on('newReview', handleNewReview);
        WebSocketService.on('updateReview', handleUpdateReview);
        WebSocketService.on('deleteReview', handleReviewDeleted);
        WebSocketService.on('newReply', handleNewReply);
        WebSocketService.on('deleteReply', handleNewReply);
      });
    }

    return () => {
      WebSocketService.off('newReview', handleNewReview);
      WebSocketService.off('updateReview', handleUpdateReview);
      WebSocketService.off('deleteReview', handleReviewDeleted);
      WebSocketService.off('newReply', handleNewReply);
      WebSocketService.off('deleteReply', handleNewReply);
    };
  }, [productId, reviews]);

  // Submit a new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.info("Please login to submit a review");
      return;
    }

    if (!userReview.content.trim()) {
      toast.error("Please enter your review");
      return;
    }

    try {
      const response = await axios.post(`${backendUrl}/api/reviews`, {
        productId,
        rating: userReview.rating,
        content: userReview.content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Review submitted successfully");
        setUserReview({ rating: 5, content: '' });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    }
  };

  // Update an existing review
  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    try {
      const response = await axios.put(`${backendUrl}/api/reviews`, {
        reviewId: editingReview._id,
        rating: userReview.rating,
        content: userReview.content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Review updated successfully");
        setEditingReview(null);
        setUserReview({ rating: 5, content: '' });
      }
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error(error.response?.data?.message || "Failed to update review");
    }
  };

  // Delete a review
  const handleDeleteReview = async (reviewId) => {
    if (!token) return;

    openConfirmModal(
      "Delete Review",
      "Are you sure you want to delete this review? This action cannot be undone.",
      async () => {
        try {
          const response = await axios.delete(`${backendUrl}/api/reviews/${reviewId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            toast.success("Review deleted successfully");
          }
        } catch (error) {
          console.error("Error deleting review:", error);
          toast.error(error.response?.data?.message || "Failed to delete review");
        }
      }
    );
  };

  // Start editing a review
  const handleEditReview = (review) => {
    setEditingReview(review);
    setUserReview({
      rating: review.rating,
      content: review.content
    });
  };

  // Submit a reply to a review
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.info("Please login to submit a reply");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Please enter your reply");
      return;
    }

    try {
      const response = await axios.post(`${backendUrl}/api/reviews/reply`, {
        reviewId: replyToReview._id,
        content: replyContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Reply submitted successfully");
        setReplyToReview(null);
        setReplyContent('');
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error(error.response?.data?.message || "Failed to submit reply");
    }
  };

  // Delete a reply
  const handleDeleteReply = async (reviewId, replyId) => {
    if (!token) return;

    openConfirmModal(
      "Delete Reply",
      "Are you sure you want to delete this reply? This action cannot be undone.",
      async () => {
        try {
          const response = await axios.delete(`${backendUrl}/api/reviews/reply/${reviewId}/${replyId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            toast.success("Reply deleted successfully");
          }
        } catch (error) {
          console.error("Error deleting reply:", error);
          toast.error(error.response?.data?.message || "Failed to delete reply");
        }
      }
    );
  };

  // Calculate star rating display
  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <img
          key={i}
          src={i <= rating ? assets.star_icon : assets.star_dull_icon}
          alt={`${i <= rating ? "filled" : "empty"} star`}
          className="w-4 h-4"
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6 sm:py-8">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="mt-2 sm:mt-4">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      {/* Rating Summary */}
      <div className="flex items-center flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center">
          <span className="text-2xl sm:text-3xl font-bold mr-2">{averageRating.toFixed(1)}</span>
          <div className="flex items-center">
            {renderStarRating(Math.round(averageRating))}
          </div>
        </div>
        <div className="text-gray-500 text-sm sm:text-base">
          Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Review Form */}
      {!editingReview && (
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8">
          <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block mb-2 text-sm sm:text-base">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserReview({ ...userReview, rating: star })}
                    className="focus:outline-none"
                  >
                    <img
                      src={star <= userReview.rating ? assets.star_icon : assets.star_dull_icon}
                      alt={`${star} star`}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="reviewContent" className="block mb-2 text-sm sm:text-base">Your Review</label>
              <textarea
                id="reviewContent"
                value={userReview.content}
                onChange={(e) => setUserReview({ ...userReview, content: e.target.value })}
                className="w-full p-2 border rounded-md min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                placeholder={token ? "Share your experience with this product..." : "Please login to write a review"}
                disabled={!token}
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={!token}
              className={`px-4 py-2 rounded-md text-sm sm:text-base ${token
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Submit Review
            </button>
          </form>
        </div>
      )}

      {/* Edit Review Form */}
      {editingReview && (
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8">
          <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Edit Your Review</h3>
          <form onSubmit={handleUpdateReview}>
            <div className="mb-4">
              <label className="block mb-2 text-sm sm:text-base">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserReview({ ...userReview, rating: star })}
                    className="focus:outline-none"
                  >
                    <img
                      src={star <= userReview.rating ? assets.star_icon : assets.star_dull_icon}
                      alt={`${star} star`}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="editReviewContent" className="block mb-2 text-sm sm:text-base">Your Review</label>
              <textarea
                id="editReviewContent"
                value={userReview.content}
                onChange={(e) => setUserReview({ ...userReview, content: e.target.value })}
                className="w-full p-2 border rounded-md min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
              ></textarea>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 text-xs sm:text-sm"
              >
                Update Review
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingReview(null);
                  setUserReview({ rating: 5, content: '' });
                }}
                className="px-3 sm:px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reply Form */}
      {replyToReview && (
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8">
          <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Reply to Review</h3>
          <div className="mb-4 p-3 sm:p-4 bg-white rounded-lg">
            <div className="flex gap-2 mb-2">
              <div className="flex">{renderStarRating(replyToReview.rating)}</div>
            </div>
            <p className="text-gray-700 text-sm sm:text-base">{replyToReview.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              By {replyToReview.userId.name} on {format(new Date(replyToReview.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
          <form onSubmit={handleSubmitReply}>
            <div className="mb-4">
              <label htmlFor="replyContent" className="block mb-2 text-sm sm:text-base">Your Reply</label>
              <textarea
                id="replyContent"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full p-2 border rounded-md min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                placeholder="Write your reply here..."
              ></textarea>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 text-xs sm:text-sm"
              >
                Submit Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyToReview(null);
                  setReplyContent('');
                }}
                className="px-3 sm:px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3 className="font-medium text-base sm:text-lg mb-3 sm:mb-4">Customer Reviews ({reviewCount})</h3>

        {reviews.length === 0 ? (
          <div className="text-gray-500 italic text-sm sm:text-base">No reviews yet. Be the first to review this product!</div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b pb-5 sm:pb-6">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={review.userId.profileImage}
                          alt={review.userId.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg";
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{review.userId.name}</p>
                        <div className="flex">{renderStarRating(review.rating)}</div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                      {review.updatedAt > review.createdAt && ' (Edited)'}
                    </p>
                  </div>

                  {/* Review Actions */}
                  {currentUser && currentUser._id === review.userId._id && (
                    <div className="flex gap-2 text-xs sm:text-sm">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <p className="text-gray-700 text-sm sm:text-base">{review.content}</p>
                </div>

                {/* Reply Button */}
                {token && (
                  <button
                    onClick={() => setReplyToReview(review)}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Reply
                  </button>
                )}

                {/* Replies */}
                {review.replies && review.replies.length > 0 && (
                  <div className="mt-3 sm:mt-4 pl-4 sm:pl-8 space-y-3 sm:space-y-4">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700">Replies</h4>
                    {review.replies.map((reply) => (
                      <div key={reply._id} className="border-l-2 border-gray-200 pl-3 sm:pl-4">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-200">
                              <img
                                src={reply.userId.profileImage}
                                alt={reply.userId.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg";
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-xs sm:text-sm">{reply.userId.name}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(reply.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>

                          {/* Reply Actions */}
                          {currentUser && currentUser._id === reply.userId._id && (
                            <button
                              onClick={() => handleDeleteReply(review._id, reply._id)}
                              className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        <div className="mt-1">
                          <p className="text-gray-700 text-xs sm:text-sm">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;