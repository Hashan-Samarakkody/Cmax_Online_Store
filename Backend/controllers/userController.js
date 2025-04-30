import userModel from "../models/userModel.js";
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { broadcast } from '../server.js';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}

// Route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists or not
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found!" });
        }

        // Check if password is correct or not
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials!" });
        } else {
            const token = createToken(user._id);

            // Update last login time
            user.lastLogin = Date.now();
            await user.save();

            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profileImage: user.profileImage
                }
            });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Route for user registration
const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            username,
            phoneNumber,
            firstName,
            lastName,
            street,
            city,
            state,
            postalCode
        } = req.body;

        // Check if user already exists or not
        const userExist = await userModel.findOne({
            $or: [
                { email },
                { username }
            ]
        });

        if (userExist) {
            return res.json({
                success: false,
                message: userExist.email === email
                    ? "Email already in use"
                    : "Username already taken"
            });
        }

        //  Validate email format and password length
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email!" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long!" });
        }

        // Set default placeholder image URL
        let profileImageUrl = 'https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg';

        // Upload profile image to Cloudinary if provided
        if (req.file) {
            try {
                // Create a data URI from the buffer
                const fileBuffer = req.file.buffer;
                const fileType = req.file.mimetype;
                const fileEncoding = 'base64';

                const dataUri = `data:${fileType};${fileEncoding},${fileBuffer.toString('base64')}`;

                // Upload to Cloudinary using the data URI
                const result = await cloudinary.uploader.upload(dataUri, {
                    folder: 'user_profiles',
                    use_filename: true,
                    unique_filename: true
                });

                profileImageUrl = result.secure_url;
            } catch (uploadError) {
                console.log("Error uploading to Cloudinary:", uploadError);
                // Continue with registration using the default image
            }
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with address details
        const newUser = new userModel({
            name,
            email,
            username,
            password: hashedPassword,
            phoneNumber,
            profileImage: profileImageUrl,
            firstName,
            lastName,
            addresses: (street && city && state && postalCode) ? [{
                _id: new mongoose.Types.ObjectId(),
                street,
                city,
                state,
                postalCode,
                isDefault: true
            }] : [],
        });

        // Save user to the database
        const user = await newUser.save();

        // Provide a token to the user
        const token = createToken(user._id);

        // Broadcast the new user
        broadcast({
            type: "newUser",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: profileImageUrl
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Send verification code for password reset
const sendResetCode = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            // For security reasons, don't reveal if email exists
            return res.json({
                success: true,
                message: "If your email exists in our system, a verification code has been sent"
            });
        }

        // Generate random 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiration time (15 minutes from now)
        const resetCodeExpires = Date.now() + 15 * 60 * 1000;

        // Save code and expiration to user document
        user.resetCode = resetCode;
        user.resetCodeExpires = resetCodeExpires;
        await user.save();

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Setup email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Verification Code - Cmax Online Store',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background: linear-gradient(to right, #f5f7fa, #eef2f7);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3366cc;">Cmax Online Store</h1>
                </div>
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <h2 style="color: #333333; margin-bottom: 20px;">Password Reset Request</h2>
                    <p style="font-size: 16px; color: #555555; line-height: 1.5;">Hello ${user.name},</p>
                    <p style="font-size: 16px; color: #555555; line-height: 1.5;">We received a request to reset your password. Please enter the verification code below to continue the password reset process:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #f0f5ff; border-radius: 5px; border: 1px dashed #3366cc;">
                            ${resetCode}
                        </div>
                        <p style="font-size: 14px; color: #777777; margin-top: 10px;">This code will expire in 15 minutes.</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #555555; line-height: 1.5;">If you did not request a password reset, please ignore this email or contact our support team if you have any concerns.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #888888; font-size: 14px;">
                    <p>Cmax Online Store © ${new Date().getFullYear()}</p>
                    <p>This is an automated email. Please do not reply. (Generade on ${new Date().toLocaleString()} at ${new Date().toLocaleTimeString()})</p>
                </div>
            </div>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Return success message (for security, use same response whether user exists or not)
        res.json({
            success: true,
            message: "If your email exists in our system, a verification code has been sent"
        });
    } catch (error) {
        console.log(error);
        // For security reasons, don't reveal specific errors
        res.json({
            success: true,
            message: "If your email exists in our system, a verification code has been sent"
        });
    }
};

// Verify reset code
const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check if code exists and is valid
        if (!user.resetCode || user.resetCode !== code) {
            return res.json({ success: false, message: "Invalid verification code" });
        }

        // Check if code has expired
        if (Date.now() > user.resetCodeExpires) {
            return res.json({ success: false, message: "Verification code has expired" });
        }

        // Mark code as verified
        user.isResetCodeVerified = true;
        await user.save();

        res.json({ success: true, message: "Code verified successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Reset password
const resetPassword = async (req, res) => {
    try {
        const { email, code, password } = req.body;

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check if code exists and is valid
        if (!user.resetCode || user.resetCode !== code) {
            return res.json({ success: false, message: "Invalid verification code" });
        }

        // Check if code is verified and not expired
        if (!user.isResetCodeVerified || Date.now() > user.resetCodeExpires) {
            return res.json({ success: false, message: "Verification code has expired or is invalid" });
        }

        // Validate password length
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetCode = undefined;
        user.resetCodeExpires = undefined;
        user.isResetCodeVerified = undefined;
        await user.save();

        res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user by ID but exclude the password field
        const user = await userModel.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            phoneNumber,
            firstName,
            lastName,
            street,
            city,
            state,
            postalCode
        } = req.body;

        // Get current user data
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update basic information
        const updateData = {};
        if (name) updateData.name = name;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

        // Update personal information
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (street !== undefined) updateData.street = street;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (postalCode !== undefined) updateData.postalCode = postalCode;

        // Handle profile image upload if file is provided
        if (req.file) {
            try {
                // Create a data URI from the buffer
                const fileBuffer = req.file.buffer;
                const fileType = req.file.mimetype;
                const fileEncoding = 'base64';

                const dataUri = `data:${fileType};${fileEncoding},${fileBuffer.toString('base64')}`;

                // Upload to Cloudinary using the data URI
                const result = await cloudinary.uploader.upload(dataUri, {
                    folder: 'user_profiles',
                    use_filename: true,
                    unique_filename: true,
                    transformation: [{ width: 500, height: 500, crop: "fill" }]
                });

                // Add profile image URL to update data
                updateData.profileImage = result.secure_url;
            } catch (uploadError) {
                console.error("Error uploading to Cloudinary:", uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Error uploading profile image"
                });
            }
        }

        // Update user in database
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Change user password with verification
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword, code } = req.body;

        // Find user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify current password
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        // Check if code was verified
        if (!user.isResetCodeVerified) {
            return res.status(400).json({ success: false, message: "Please verify your email first" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear verification fields
        user.password = hashedPassword;
        user.resetCode = undefined;
        user.resetCodeExpires = undefined;
        user.isResetCodeVerified = false;

        await user.save();

        res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete user account
const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        // Validate password is provided
        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required to delete account" });
        }

        // Find user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Incorrect password" });
        }

        // Delete profile image from Cloudinary if it's not the default
        if (user.profileImage && !user.profileImage.includes('default-user')) {
            try {
                // Extract public ID from URL or filename
                const publicId = user.profileImage.includes('cloudinary')
                    ? user.profileImage.split('/').pop().split('.')[0]
                    : `user_profiles/${user.profileImage.split('/').pop().split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError) {
                console.error('Error deleting profile image:', cloudinaryError);
                // Continue with account deletion even if image deletion fails
            }
        }

        // Delete user account
        await userModel.findByIdAndDelete(userId);

        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user addresses
const getUserAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Return empty array if no addresses yet
        const addresses = user.addresses || [];
        res.json({
            success: true,
            addresses
        });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add new address
const addUserAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressName, street, city, state, postalCode, isDefault } = req.body;

        // Validate required fields
        if (!addressName || !street || !city || !state || !postalCode) {
            return res.status(400).json({ success: false, message: "All address fields are required" });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Initialize addresses array if it doesn't exist
        if (!user.addresses) {
            user.addresses = [];
        }

        // Create new address with MongoDB ObjectId
        const newAddress = {
            _id: new mongoose.Types.ObjectId(),
            addressName,
            street,
            city,
            state,
            postalCode,
            isDefault: isDefault || false
        };

        // If this is the first address or marked as default
        if (isDefault || user.addresses.length === 0) {
            // If this is marked as default, unmark any previous default
            if (user.addresses.length > 0) {
                user.addresses.forEach(addr => {
                    addr.isDefault = false;
                });
            }
            newAddress.isDefault = true;
        }

        user.addresses.push(newAddress);
        await user.save();

        res.json({
            success: true,
            message: "Address added successfully",
            address: newAddress
        });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update address
const updateUserAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.addressId;
        const { addressName, street, city, state, postalCode, isDefault } = req.body;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Find address index
        const addressIndex = user.addresses?.findIndex(addr => addr._id.toString() === addressId);

        if (addressIndex === -1 || addressIndex === undefined) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Update fields
        if (addressName) user.addresses[addressIndex].addressName = addressName;
        if (street) user.addresses[addressIndex].street = street;
        if (city) user.addresses[addressIndex].city = city;
        if (state) user.addresses[addressIndex].state = state;
        if (postalCode) user.addresses[addressIndex].postalCode = postalCode;

        // Handle default address update
        if (isDefault) {
            user.addresses.forEach((addr, index) => {
                addr.isDefault = index === addressIndex;
            });
        }

        await user.save();

        res.json({
            success: true,
            message: "Address updated successfully"
        });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete address
const deleteUserAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.addressId;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Find address index
        const addressIndex = user.addresses?.findIndex(addr => addr._id.toString() === addressId);

        if (addressIndex === -1 || addressIndex === undefined) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Check if we're removing a default address
        const isRemovingDefault = user.addresses[addressIndex].isDefault;

        // Remove the address
        user.addresses.splice(addressIndex, 1);

        // If we removed the default address and have remaining addresses, set a new default
        if (isRemovingDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.json({
            success: true,
            message: "Address deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Set default address
const setDefaultAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.addressId;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update default status for all addresses
        let addressExists = false;
        user.addresses?.forEach(addr => {
            if (addr._id.toString() === addressId) {
                addr.isDefault = true;
                addressExists = true;
            } else {
                addr.isDefault = false;
            }
        });

        if (!addressExists) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        await user.save();

        res.json({
            success: true,
            message: "Default address updated successfully"
        });
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const verifyPassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        return res.json({ success: isPasswordValid });
    } catch (error) {
        console.error('Error verifying password:', error);
        res.json({ success: false, message: error.message });
    }
};

const sendChangePasswordCode = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user by ID
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate random 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiration time (15 minutes from now)
        const resetCodeExpires = Date.now() + 15 * 60 * 1000;

        // Save code and expiration to user document
        user.resetCode = resetCode;
        user.resetCodeExpires = resetCodeExpires;
        await user.save();

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Setup email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Change Verification Code - Cmax Online Store',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background: linear-gradient(to right, #f5f7fa, #eef2f7);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3366cc;">Cmax Online Store</h1>
                </div>
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <h2 style="color: #333333; margin-bottom: 20px;">Password Change Request</h2>
                    <p style="font-size: 16px; color: #555555; line-height: 1.5;">Hello ${user.firstName || user.username},</p>
                    <p style="font-size: 16px; color: #555555; line-height: 1.5;">You requested to change your password. Please enter the verification code below to continue:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #f0f5ff; border-radius: 5px; border: 1px dashed #3366cc;">
                            ${resetCode}
                        </div>
                        <p style="font-size: 14px; color: #777777; margin-top: 10px;">This code will expire in 15 minutes.</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #555555; line-height: 1.5;">If you did not request this change, please contact our support team immediately.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #888888; font-size: 14px;">
                    <p>Cmax Online Store © ${new Date().getFullYear()}</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Return success message
        res.json({
            success: true,
            message: "Verification code sent to your email"
        });
    } catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const verifyChangePasswordCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        // Find user by ID
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if code exists and is valid
        if (!user.resetCode || user.resetCode !== code) {
            return res.json({ success: false, message: "Invalid verification code" });
        }

        // Check if code has expired
        if (Date.now() > user.resetCodeExpires) {
            return res.json({ success: false, message: "Verification code has expired" });
        }

        // Mark code as verified
        user.isResetCodeVerified = true;
        await user.save();

        res.json({ success: true, message: "Code verified successfully" });
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    loginUser,
    registerUser,
    sendResetCode,
    verifyResetCode,
    resetPassword,
    getUserProfile,
    updateUserProfile,
    changePassword,
    deleteUserAccount,
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    verifyPassword,
    sendChangePasswordCode,
    verifyChangePasswordCode
};