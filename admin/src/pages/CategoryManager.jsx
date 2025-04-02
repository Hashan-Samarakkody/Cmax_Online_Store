import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { backendUrl } from '../App';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [subcategoryName, setSubcategoryName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/categories");
            if (Array.isArray(data)) {
                setCategories(data);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            toast.error("Failed to fetch categories.");
            setCategories([]);
        }
    };

    const addCategory = async () => {
        const sanitizedCategoryName = DOMPurify.sanitize(categoryName.trim());

        // Validate category name
        if (!sanitizedCategoryName || sanitizedCategoryName.length < 3 || sanitizedCategoryName.length > 50) {
            toast.error("Category name must be between 3 and 50 characters.");
            return;
        }
        if (/^\d+$/.test(sanitizedCategoryName)) {
            toast.error("Category name cannot be only numbers.");
            return;
        }

        try {
            await axios.post(backendUrl + "/api/categories", { name: sanitizedCategoryName });
            setCategoryName("");
            fetchCategories();
            toast.success("Category added successfully!", { autoClose: 1000 });
        } catch (err) {
            console.error("Error adding category:", err);
            toast.error("Failed to add category.");
        }
    };

    const addSubcategory = async () => {
        const sanitizedSubcategoryName = DOMPurify.sanitize(subcategoryName.trim());

        // Validate subcategory name
        if (!sanitizedSubcategoryName || sanitizedSubcategoryName.length < 3 || sanitizedSubcategoryName.length > 50) {
            toast.error("Subcategory name must be between 3 and 50 characters.");
            return;
        }
        if (/^\d+$/.test(sanitizedSubcategoryName)) {
            toast.error("Subcategory name cannot be only numbers.");
            return;
        }
        if (!selectedCategory) {
            toast.error("Please select a category.");
            return;
        }

        try {
            await axios.post(backendUrl + "/api/categories/subcategories", {
                name: sanitizedSubcategoryName,
                categoryId: selectedCategory,
            });
            setSubcategoryName("");
            fetchCategories();
            toast.success("Subcategory added successfully!", { autoClose: 1000 });
        } catch (err) {
            console.error("Error adding subcategory:", err);
            toast.error("Failed to add subcategory.");
        }
    };

    const deleteCategory = async (id) => {
        try {
            await axios.delete(backendUrl + `/api/categories/${id}`);
            fetchCategories();
            toast.success("Category deleted successfully!", { autoClose: 1000 });
        } catch (err) {
            console.error("Error deleting category:", err);

            // Check if the error response and message are available
            if (err.response && err.response.data && err.response.data.message) {
                const errorMessage = err.response.data.message;

                // Check for specific message
                if (errorMessage.includes("contains products")) {
                    toast.error("Cannot delete category as it contains products.");
                } else {
                    toast.error(errorMessage);
                }
            } else {
                // Fallback error message if no response is available
                toast.error("Failed to delete category.");
            }
        }
    };


    const deleteSubcategory = async (id) => {
        try {
            await axios.delete(backendUrl + `/api/categories/subcategories/${id}`);
            fetchCategories();
            toast.success("Subcategory deleted successfully!", { autoClose: 1000 });
        } catch (err) {
            console.error("Error deleting subcategory:", err);

            // Check if the error response is available
            if (err.response && err.response.data && err.response.data.message) {
                const errorMessage = err.response.data.message;

                // Check for specific message
                if (errorMessage.includes("contains products")) {
                    toast.error("Cannot delete subcategory as it contains products.");
                } else {
                    toast.error(errorMessage);
                }
            } else {
                // Fallback error message
                toast.error("Failed to delete subcategory.");
            }
        }
    };


    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">Manage Categories & Subcategories</h2>

            {/* Add Category */}
            <div className="mb-4">
                <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="New Category"
                    className="border p-2 rounded mr-2"
                />
                <button
                    onClick={addCategory}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Add Category
                </button>
            </div>

            {/* Add Subcategory */}
            <div className="mb-4">
                <select
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    value={selectedCategory}
                    className="border p-2 rounded mr-2"
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                <input
                    value={subcategoryName}
                    onChange={(e) => setSubcategoryName(e.target.value)}
                    placeholder="New Subcategory"
                    className="border p-2 rounded mr-2"
                />
                <button
                    onClick={addSubcategory}
                    disabled={!selectedCategory}
                    className={`px-4 py-2 rounded ${selectedCategory
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-300 text-gray-500"
                        }`}
                >
                    Add Subcategory
                </button>
            </div>

            {/* Display Categories and Subcategories */}
            <div>
                <h1 className="text-2xl font-semibold mb-2">Categories and Subcategories</h1>
                {categories.length === 0 ? (
                    <p className="text-gray-500">No categories available. Add a new category to get started.</p>
                ) : (
                    categories.map((cat) => (
                        <div key={cat._id} className="mb-4 border-b pb-2">
                            <h3 className="font-semibold">
                                {cat.name} ({cat.productCount || 0} items)
                                <button
                                    onClick={() => deleteCategory(cat._id)}
                                    className="border float-right bg-white text-red-600 px-2 rounded hover:bg-red-600 hover:text-white transition-all"
                                >
                                    Delete
                                </button>
                            </h3>
                            <ul className="ml-4">
                                {cat.subcategories.map((sub) => (
                                    <li key={sub._id} className="flex justify-between items-center mt-2">
                                        <span>
                                            {sub.name} ({sub.productCount || 0} items)
                                        </span>
                                        <button
                                            onClick={() => deleteSubcategory(sub._id)}
                                            className="border bg-white text-red-500  mx-18 px-2 rounded hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CategoryManager;