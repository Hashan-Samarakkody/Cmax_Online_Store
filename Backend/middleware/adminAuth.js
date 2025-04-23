import jwt from 'jsonwebtoken';
import adminModel from '../models/adminModel.js';

const adminAuth = async (req, res, next) => {
    try {
        // Check for token in both places - Authorization header and custom token header
        let token = req.headers.authorization?.split(' ')[1] || req.headers.token;

        if (!token) {
            return res.json({ success: false, message: "Authentication token missing. Please ensure you're logged in." });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the admin exists and is active
        const admin = await adminModel.findById(decoded.id).select('-password');

        if (!admin) {
            return res.json({ success: false, message: "Admin not found" });
        }

        if (!admin.active) {
            return res.json({ success: false, message: "Your account has been deactivated" });
        }

        // Attach admin info to the request
        req.admin = {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        };

        next();
    } catch (error) {
        console.log(error);
        if (error.name === 'TokenExpiredError') {
            return res.json({ success: false, message: "Session expired. Please log in again." });
        }
        res.json({ success: false, message: "Authentication failed" });
    }
};

export default adminAuth;