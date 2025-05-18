import userModel from '../models/userModel.js'

//  Add products to cart
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, size, color } = req.body

        const userData = await userModel.findById(userId)
        let cartData = userData.cartData || {}

        // Add composite key with both size and color
        const cartKey = `${size || 'undefined'}_${color || 'undefined'}`;

        if (cartData[itemId]) {
            if (cartData[itemId][cartKey]) {
                cartData[itemId][cartKey] += 1
            } else {
                cartData[itemId][cartKey] = 1
            }
        } else {
            cartData[itemId] = {}
            cartData[itemId][cartKey] = 1
        }

        await userModel.findByIdAndUpdate(userId, { cartData })

        res.json({ success: true, message: 'Product added to cart!' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Update cart
const updateCart = async (req, res) => {
    try {
        const { userId, itemId, size, color, quantity } = req.body;
        // Now also extract color from request

        const userData = await userModel.findById(userId);
        let cartData = userData.cartData || {};

        // Use both size and color to create the cart key
        const cartKey = `${size || 'undefined'}_${color || 'undefined'}`;

        if (quantity === 0) {
            // Remove the item completely if quantity is zero
            if (cartData[itemId] && cartData[itemId][cartKey]) {
                delete cartData[itemId][cartKey];

                // If no more items with this ID, remove the entire product
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }
            }
        } else {
            // Otherwise update the quantity
            if (!cartData[itemId]) cartData[itemId] = {};
            cartData[itemId][cartKey] = quantity;
        }

        await userModel.findByIdAndUpdate(userId, { cartData });

        res.json({ success: true, message: 'Cart updated!' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get cart data
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body;

        const userData = await userModel.findById(userId)
            .select('cartData')
            .lean();

        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const cartData = userData.cartData || {};

        res.json({ success: true, cartData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, getUserCart }