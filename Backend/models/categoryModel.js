import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],
    isVisible: { type: Boolean, default: true }
});

const categoryModel = mongoose.models.category || mongoose.model("Category", categorySchema);

export default categoryModel;