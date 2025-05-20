import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    profileImage: {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg'
    },
    firstName: { type: String },
    lastName: { type: String },
    authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },

    verificationCode: String,
    verificationCodeExpires: Date,
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },

    addresses: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        addressName: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],

    wishlistItems: {
        type: Array,
        default: []
    },

    cartData: { type: Object, default: {} },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    resetCode: String,
    resetCodeExpires: Date,
    isResetCodeVerified: Boolean
}, { minimize: false });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;