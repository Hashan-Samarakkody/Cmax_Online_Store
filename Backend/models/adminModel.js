import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: 'default-admin.png'
    },
    role: {
        type: String,
        enum: ['superadmin', 'manager', 'staff'],
        default: 'staff'
    },
    permissions: {
        manageProducts: { type: Boolean, default: false },
        manageOrders: { type: Boolean, default: true },
        manageUsers: { type: Boolean, default: false },
        manageAdmins: { type: Boolean, default: false },
        viewReports: { type: Boolean, default: false }
    },
    lastLogin: {
        type: Date,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    verificationCode: String,
    verificationCodeExpires: Date,
    isCodeVerified: {
        type: Boolean,
        default: false
    },
});

// Password comparison method
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Pre-save hook to hash password
adminSchema.pre('save', async function (next) {
    // Only hash the password if it's modified or new
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const adminModel = mongoose.models.admin || mongoose.model("admin", adminSchema);

export default adminModel;