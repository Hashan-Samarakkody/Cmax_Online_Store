import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const userAuth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No valid token provided.' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists
        const user = await userModel.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
        }

        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

const orderAndCartAuth = async (req, res, next) => {

    const { token } = req.headers

    if (!token) {
        return res.joson({ success: false, message: 'Not authorized! Login again' })
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.userId = token_decode.id
        next()

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const wishlistAuth = async (req, res, next) => {
    try {
        const { token } = req.headers;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // For wishlist, we use decoded.userId (if your token stores it as userId)
        // or decoded.id (if your token stores it as id)
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token format' });
        }

        // Get user from database
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Add user ID to request body
        req.body.userId = userId;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};


export { userAuth, orderAndCartAuth, wishlistAuth };