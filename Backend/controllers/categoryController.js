import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";
import Product from "../models/productModel.js";

// Add Category
const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const existingCategory = await Category.findOne({ name });

        if (existingCategory) return res.status(400).json({ message: "Category already exists" });

        const category = new Category({ name });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add Subcategory
const addSubcategory = async (req, res) => {
    try {
        const { name, categoryId } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });

        const subcategory = new Subcategory({ name, category: categoryId });
        await subcategory.save();

        category.subcategories.push(subcategory._id);
        await category.save();

        res.status(201).json(subcategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Categories with Subcategories and Item Counts
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate({
            path: "subcategories",
            populate: { path: "category" },
        });

        const categoryData = await Promise.all(categories.map(async (cat) => {
            const productCount = await Product.countDocuments({ category: cat._id });
            const subcategories = await Promise.all(cat.subcategories.map(async (sub) => {
                const subProductCount = await Product.countDocuments({ subcategory: sub._id });
                return { ...sub.toObject(), productCount: subProductCount };
            }));
            return { ...cat.toObject(), productCount, subcategories };
        }));

        res.status(200).json(categoryData);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get Subcategories with Product Counts (Optionally filtered by category)
const getSubCategories = async (req, res) => {
    try {
        const { categoryId } = req.query; // Optional query parameter to filter by category

        let subcategories;
        if (categoryId) {
            // If categoryId is provided, find subcategories for this category
            const category = await Category.findById(categoryId);
            if (!category) return res.status(404).json({ message: "Category not found" });

            subcategories = await Subcategory.find({ category: categoryId });
        } else {
            // If no categoryId is provided, return all subcategories
            subcategories = await Subcategory.find();
        }

        // Add product count for each subcategory
        const subcategoryData = await Promise.all(subcategories.map(async (sub) => {
            const subProductCount = await Product.countDocuments({ subcategory: sub._id });
            return { ...sub.toObject(), productCount: subProductCount };
        }));

        res.status(200).json(subcategoryData);
    } catch (err) {
        console.error("Error fetching subcategories:", err);
        res.status(500).json({ error: err.message });
    }
};

// Delete Category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const productCount = await Product.countDocuments({ category: id });
        if (productCount > 0) return res.status(400).json({ message: "Category contains products" });

        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        await Subcategory.deleteMany({ category: id });
        await Category.findByIdAndDelete(id);

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Subcategory
const deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;

        const productCount = await Product.countDocuments({ subcategory: id });
        if (productCount > 0) return res.status(400).json({ message: "Subcategory contains products" });

        const subcategory = await Subcategory.findById(id);
        if (!subcategory) return res.status(404).json({ message: "Subcategory not found" });

        await Category.updateOne({ _id: subcategory.category }, { $pull: { subcategories: id } });
        await Subcategory.findByIdAndDelete(id);

        res.status(200).json({ message: "Subcategory deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export { addCategory, addSubcategory, getCategories, getSubCategories, deleteCategory, deleteSubcategory }