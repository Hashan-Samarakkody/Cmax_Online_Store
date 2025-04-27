import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema({
    returnId: { type: String, required: true },
    originalOrderId: { type: String, required: true },
    userId: { type: String, required: true },
    items: [{
        productId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
        size: { type: String },
        color: { type: String },
        reason: { type: String, required: true },
        customReason: { type: String },
        condition: { type: String, required: true }
    }],
    media: [{
        url: { type: String, required: true },
        type: { type: String, required: true, enum: ['image', 'video'] },
        publicId: { type: String, required: true },
        itemIndex: { type: Number }, 
        description: { type: String } 
    }],
    status: {
        type: String,
        required: true,
        enum: ['Requested', 'Approved', 'In Transit', 'Received', 'Inspected', 'Completed', 'Rejected'],
        default: 'Requested'
    },
    refundAmount: { type: Number, required: true },
    refundMethod: { type: String, required: true },
    returnTrackingId: { type: String },
    requestedDate: { type: Number, required: true },
    completedDate: { type: Number },
    notes: { type: String }
});

const returnModel = mongoose.models.return || mongoose.model('return', returnSchema);

export default returnModel;