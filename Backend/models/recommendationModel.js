import mongoose from "mongoose";

const userProductInteractionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    // Interaction types: view, cart, purchase, wishlist
    interactionType: {
        type: String,
        required: true,
        enum: ['view', 'cart', 'purchase', 'wishlist']
    },
    // Weight of interaction (purchase > cart > wishlist > view)
    weight: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Define indexes for efficient queries
userProductInteractionSchema.index({ userId: 1, productId: 1, interactionType: 1 }, { unique: true });
userProductInteractionSchema.index({ userId: 1 });
userProductInteractionSchema.index({ productId: 1 });

const userProductInteractionModel = mongoose.models.userProductInteraction ||
    mongoose.model("userProductInteraction", userProductInteractionSchema);

export default userProductInteractionModel;