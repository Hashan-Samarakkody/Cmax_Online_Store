import userModel from '../models/userModel.js';

// Add item to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { itemId, userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if item already exists in wishlist
    if (user.wishlistItems && user.wishlistItems.includes(itemId)) {
      return res.json({ success: true, message: 'Item already in wishlist' });
    }

    // Add to wishlist
    await userModel.findByIdAndUpdate(
      userId,
      { $push: { wishlistItems: itemId } }
    );

    res.json({ success: true, message: 'Item added to wishlist' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { itemId, userId } = req.body;

    await userModel.findByIdAndUpdate(
      userId,
      { $pull: { wishlistItems: itemId } }
    );

    res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get wishlist items
const getWishlist = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const wishlistItems = user.wishlistItems || [];

    res.json({ success: true, wishlistItems });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { addToWishlist, removeFromWishlist, getWishlist };