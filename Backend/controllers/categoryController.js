import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";

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
        const { categoryId } = req.query;

        let subcategories;
        if (categoryId) {
            // Check if categoryId is valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({ message: "Invalid category ID format" });
            }

            // If categoryId is provided, find subcategories for this category
            subcategories = await Subcategory.find({ category: categoryId });
        } else {
            // If no categoryId is provided, return all subcategories
            subcategories = await Subcategory.find();
        }

        // Add product count for each subcategory
        const subcategoryData = await Promise.all(subcategories.map(async (sub) => {
            const subProductCount = await Product.countDocuments({ subcategory: sub._id });
            return {
                ...sub.toObject(),
                productCount: subProductCount
            };
        }));

        res.status(200).json(subcategoryData);
    } catch (err) {
        console.error("Error fetching subcategories:", err);
        res.status(500).json({ error: err.message });
    }
};



// Update Category Name
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Check if name already exists
        const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
        if (existingCategory) return res.status(400).json({ message: "Category name already exists" });

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );

        if (!updatedCategory) return res.status(404).json({ message: "Category not found" });

        res.status(200).json(updatedCategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Subcategory Name
const updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const updatedSubcategory = await Subcategory.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );

        if (!updatedSubcategory) return res.status(404).json({ message: "Subcategory not found" });

        res.status(200).json(updatedSubcategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Toggle Category Visibility
const toggleCategoryVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVisible } = req.body;

        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        category.isVisible = isVisible;
        await category.save();

        res.status(200).json({ message: "Category visibility updated successfully", isVisible });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Toggle Subcategory Visibility
const toggleSubcategoryVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVisible } = req.body;

        const subcategory = await Subcategory.findById(id);
        if (!subcategory) return res.status(404).json({ message: "Subcategory not found" });

        subcategory.isVisible = isVisible;
        await subcategory.save();

        res.status(200).json({ message: "Subcategory visibility updated successfully", isVisible });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Category with Products
const deleteCategoryWithProducts = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        // Delete all products in this category
        await Product.deleteMany({ category: id });

        // Delete all subcategories
        await Subcategory.deleteMany({ category: id });

        // Delete the category
        await Category.findByIdAndDelete(id);

        res.status(200).json({ message: "Category and all related products deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Subcategory with Products
const deleteSubcategoryWithProducts = async (req, res) => {
    try {
        const { id } = req.params;

        const subcategory = await Subcategory.findById(id);
        if (!subcategory) return res.status(404).json({ message: "Subcategory not found" });

        // Delete all products in this subcategory
        await Product.deleteMany({ subcategory: id });

        // Update parent category
        await Category.updateOne(
            { _id: subcategory.category },
            { $pull: { subcategories: id } }
        );

        // Delete the subcategory
        await Subcategory.findByIdAndDelete(id);

        res.status(200).json({ message: "Subcategory and all related products deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update exports
export {
    addCategory,
    addSubcategory,
    getCategories,
    getSubCategories,
    updateCategory,
    updateSubcategory,
    toggleCategoryVisibility,
    toggleSubcategoryVisibility,
    deleteCategoryWithProducts,
    deleteSubcategoryWithProducts
}