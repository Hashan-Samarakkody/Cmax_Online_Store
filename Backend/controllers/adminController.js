import adminModel from '../models/adminModel.js';
import jwt from 'jsonwebtoken';
import { broadcast } from '../server.js';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
import 'dotenv/config';

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

        // Upload image to Cloudinary if provided
        let profileImageUrl = 'default-admin.png';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            profileImageUrl = result.secure_url;
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
            profileImage: profileImageUrl,
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
                profileImage: profileImageUrl,
                permissions: admin.permissions
            }
        });

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

        // Check if username or email already exists (if changed)
        if (username || email) {
            const existingAdmin = await adminModel.findOne({
                $or: [
                    { username },
                    { email }
                ],
                _id: { $ne: adminId }
            });

            if (existingAdmin) {
                const message = existingAdmin.username === username
                    ? "Username is already taken"
                    : "Email is already registered";
                return res.json({ success: false, message });
            }
        }


        // Get current admin data
        const currentAdmin = await adminModel.findById(adminId);

        // Update profile image if provided
        const updateData = { name, username, email };
        if (req.file) {
            // Upload new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            updateData.profileImage = result.secure_url;

            // Delete old image from Cloudinary if it's not the default
            if (currentAdmin.profileImage && !currentAdmin.profileImage.includes('default-admin')) {
                // Extract public ID from URL
                const publicId = currentAdmin.profileImage.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
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

        // Check if verification code was validated
        if (!admin.isCodeVerified) {
            return res.json({ success: false, message: "Please verify your email before changing the password" });
        }

        // Verify current password
        const isPasswordValid = await admin.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.json({ success: false, message: "Current password is incorrect" });
        }

        // Password strength check (optional: you can enforce this via regex too)
        if (newPassword.length < 8) {
            return res.json({ success: false, message: "New password must be at least 8 characters" });
        }

        // Update password
        admin.password = newPassword;

        // Clear verification fields
        admin.verificationCode = undefined;
        admin.verificationCodeExpires = undefined;
        admin.isCodeVerified = false;

        await admin.save();

        res.json({ success: true, message: "Password changed successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete admin account 
const deleteAdminAccount = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const admin = await adminModel.findById(adminId);
        if (!admin) {
            return res.json({ success: false, message: "Admin not found" });
        }

        // Delete profile image from Cloudinary if it's not the default
        if (admin.profileImage && !admin.profileImage.includes('default-admin')) {
            // Extract public ID from URL
            const publicId = admin.profileImage.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Delete admin account
        await adminModel.findByIdAndDelete(adminId);
        res.json({ success: true, message: "Admin account deleted successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Send verification code for password change
const sendVerificationCode = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const admin = await adminModel.findById(adminId);

        if (!admin) return res.json({ success: false, message: "Admin not found" });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        admin.verificationCode = code;
        admin.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        admin.isCodeVerified = false;
        await admin.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: admin.email,
            subject: 'Password Change Verification Code',
            html: `
            <div style="font-family: 'Times New Roman', Times, serif; font-size: 14pt;">
                <p>Your verification code is:</p>
                <h2 style="font-weight: bold; font-style: italic;">${code}</h2>
                <p>This code will expire in 15 minutes.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Verification code sent to your email" });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Verify the code sent to the admin's email
const verifyCode = async (req, res) => {
    try {
        const { code } = req.body;

        const admin = await adminModel.findOne({
            verificationCode: code,
            verificationCodeExpires: { $gt: new Date() }
        });

        if (!admin) {
            return res.json({ success: false, message: "Invalid or expired verification code" });
        }

        admin.isCodeVerified = true;
        await admin.save();

        res.json({ success: true, message: "Code verified successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


export {
    adminLogin,
    registerAdmin,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    deleteAdminAccount,
    sendVerificationCode,
    verifyCode
}