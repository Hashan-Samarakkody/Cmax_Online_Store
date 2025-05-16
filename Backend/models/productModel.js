import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', required: true },
    price: { type: Number, required: true },
    bestseller: { type: Boolean, default: false },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    images: { type: [String], default: [] },
    hasSizes: { type: Boolean, default: false },
    hasColors: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true }
});

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
