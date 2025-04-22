import adminModel from '../models/adminModel.js';
import jwt from 'jsonwebtoken';
import { broadcast } from '../server.js';

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the admin
        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // Check if admin is active
        if (!admin.active) {
            return res.json({ success: false, message: "Account is deactivated. Please contact super-admin." });
        }

        // Verify password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // Update last login time
        admin.lastLogin = Date.now();
        await admin.save();

        // Create token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                profileImage: admin.profileImage,
                permissions: admin.permissions
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Register new admin
const registerAdmin = async (req, res) => {
    try {
        const { name, username, email, password, role } = req.body;

        // Validate admin registration key (for security)
        const adminRegistrationKey = req.headers.adminkey;
        if (!adminRegistrationKey || adminRegistrationKey !== process.env.ADMIN_REGISTRATION_KEY) {
            return res.json({ success: false, message: "Unauthorized registration attempt" });
        }

        // Check if admin already exists
        const adminExists = await adminModel.findOne({
            $or: [
                { email },
                { username }
            ]
        });

        if (adminExists) {
            return res.json({
                success: false,
                message: adminExists.email === email ?
                    "Admin with this email already exists" :
                    "Username is already taken"
            });
        }

        // Create new admin with appropriate permissions based on role
        const permissions = {
            manageProducts: role === 'superadmin' || role === 'manager',
            manageOrders: true,
            manageUsers: role === 'superadmin' || role === 'manager',
            manageAdmins: role === 'superadmin',
            viewReports: role === 'superadmin' || role === 'manager'
        };

        const newAdmin = new adminModel({
            name,
            username,
            email,
            password,
            profileImage: req.file ? req.file.path : 'default-admin.png',
            role: role || 'staff',
            permissions
        });

        // Save admin to database
        const admin = await newAdmin.save();

        // Create token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Broadcast the new admin
        broadcast({
            type: "newAdmin", admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                profileImage: admin.profileImage,
                permissions: admin.permissions
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await adminModel.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({ success: true, admins });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const admin = await adminModel.findById(adminId).select('-password');

        if (!admin) {
            return res.json({ success: false, message: "Admin not found" });
        }

        res.json({ success: true, admin });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update admin profile
const updateAdminProfile = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { name, username, email } = req.body;

        // Check if username already exists (if changed)
        if (username) {
            const existingAdmin = await adminModel.findOne({
                username,
                _id: { $ne: adminId }
            });

            if (existingAdmin) {
                return res.json({ success: false, message: "Username is already taken" });
            }
        }

        // Update profile image if provided
        const updateData = { name, username, email };
        if (req.file) {
            updateData.profileImage = req.file.path;
        }

        const updatedAdmin = await adminModel.findByIdAndUpdate(
            adminId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: "Profile updated successfully",
            admin: updatedAdmin
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Change admin password
const changePassword = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { currentPassword, newPassword } = req.body;

        const admin = await adminModel.findById(adminId);
        if (!admin) {
            return res.json({ success: false, message: "Admin not found" });
        }

        // Verify current password
        const isPasswordValid = await admin.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.json({ success: false, message: "Current password is incorrect" });
        }

        // Update password
        admin.password = newPassword;
        await admin.save();

        res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Manage admin status (activate/deactivate)
const updateAdminStatus = async (req, res) => {
    try {
        const { adminId, active } = req.body;
        const requestingAdmin = req.admin;

        // Check if requesting admin has super admin privileges
        const superAdmin = await adminModel.findById(requestingAdmin.id);
        if (!superAdmin || superAdmin.role !== 'superadmin') {
            return res.json({ success: false, message: "You don't have permission to manage admin accounts" });
        }

        // Prevent deactivating your own account
        if (requestingAdmin.id === adminId && active === false) {
            return res.json({ success: false, message: "You cannot deactivate your own account" });
        }

        const updatedAdmin = await adminModel.findByIdAndUpdate(
            adminId,
            { active },
            { new: true }
        ).select('-password');

        if (!updatedAdmin) {
            return res.json({ success: false, message: "Admin not found" });
        }

        res.json({
            success: true,
            message: active ? "Admin account activated" : "Admin account deactivated",
            admin: updatedAdmin
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    adminLogin,
    registerAdmin,
    getAllAdmins,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    updateAdminStatus
};