import userModel from "../models/userModel.js";
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { broadcast } from '../server.js';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';

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
        const { name, email, password, username, phoneNumber } = req.body;

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

        // Upload profile image to Cloudinary if provided
        let profileImageUrl = 'default-user.png';
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'user_profiles'
                });
                profileImageUrl = result.secure_url;
            } catch (uploadError) {
                console.log("Error uploading to Cloudinary:", uploadError);
            }
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new userModel({
            name,
            email,
            username,
            password: hashedPassword,
            phoneNumber,
            profileImage: profileImageUrl
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
                    <p>This is an automated email. Please do not reply.</p>
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

export { loginUser, registerUser, sendResetCode, verifyResetCode, resetPassword };