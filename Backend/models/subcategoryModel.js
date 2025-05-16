import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    isVisible: { type: Boolean, default: true }
});

const subcategoryModel = mongoose.models.subcategory || mongoose.model("Subcategory", subcategorySchema);

export default subcategoryModel;