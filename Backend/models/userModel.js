import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    profileImage: { type: String, default: 'default-user.png' },
    cartData: { type: Object, default: {} },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    // For password reset
    resetCode: String,
    resetCodeExpires: Date,
    isResetCodeVerified: Boolean
}, { minimize: false });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;