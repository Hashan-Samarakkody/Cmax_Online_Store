import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { backendUrl } from '../App';
import WebSocketService from '../services/WebSocketService';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [subcategoryName, setSubcategoryName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState(""); // "category" or "subcategory"
    const [deleteWithProducts, setDeleteWithProducts] = useState(false);
    const [editMode, setEditMode] = useState(null); // { id, type, currentName } or null
    const [editName, setEditName] = useState("");

    useEffect(() => {
        fetchCategories();

        // Connect to WebSocket and listen for category updates
        const handleNewCategory = (newCategory) => {
            setCategories((prevCategories) => [...prevCategories, newCategory.category]);
        };

        const handleUpdatedCategory = (data) => {
            setCategories((prevCategories) =>
                prevCategories.map(cat =>
                    cat._id === data.categoryId ? { ...cat, name: data.name } : cat
                )
            );
        };

        const handleUpdatedSubcategory = (data) => {
            setCategories((prevCategories) =>
                prevCategories.map(cat => {
                    if (!cat.subcategories) return cat;

                    const updatedSubcategories = cat.subcategories.map(sub =>
                        sub._id === data.subcategoryId ? { ...sub, name: data.name } : sub
                    );

                    return { ...cat, subcategories: updatedSubcategories };
                })
            );
        };

        const handleCategoryVisibility = (data) => {
            setCategories((prevCategories) =>
                prevCategories.map(cat =>
                    cat._id === data.categoryId ? { ...cat, isVisible: data.isVisible } : cat
                )
            );
        };

        const handleSubcategoryVisibility = (data) => {
            setCategories((prevCategories) =>
                prevCategories.map(cat => {
                    if (!cat.subcategories) return cat;

                    const updatedSubcategories = cat.subcategories.map(sub =>
                        sub._id === data.subcategoryId ? { ...sub, isVisible: data.isVisible } : sub
                    );

                    return { ...cat, subcategories: updatedSubcategories };
                })
            );
        };

        WebSocketService.connect(() => {
            WebSocketService.on('newCategory', handleNewCategory);
            WebSocketService.on('updatedCategory', handleUpdatedCategory);
            WebSocketService.on('updatedSubcategory', handleUpdatedSubcategory);
            WebSocketService.on('categoryVisibilityChanged', handleCategoryVisibility);
            WebSocketService.on('subcategoryVisibilityChanged', handleSubcategoryVisibility);
        });

        return () => {
            WebSocketService.disconnect();
            WebSocketService.off('newCategory', handleNewCategory);
            WebSocketService.off('updatedCategory', handleUpdatedCategory);
            WebSocketService.off('updatedSubcategory', handleUpdatedSubcategory);
            WebSocketService.off('categoryVisibilityChanged', handleCategoryVisibility);
            WebSocketService.off('subcategoryVisibilityChanged', handleSubcategoryVisibility);
        };
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
            const response = await axios.post(backendUrl + "/api/categories", { name: sanitizedCategoryName });
            setCategoryName("");
            fetchCategories();
            toast.success("Category added successfully!", { autoClose: 1000 });
            if (response.data) {
                WebSocketService.send({
                    type: 'newCategory',
                    category: response.data
                });
            }
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
            const response = await axios.post(backendUrl + "/api/categories/subcategories", {
                name: sanitizedSubcategoryName,
                categoryId: selectedCategory,
            });
            setSubcategoryName("");
            fetchCategories();
            toast.success("Subcategory added successfully!", { autoClose: 1000 });
            if (response.data) {
                WebSocketService.send({
                    type: 'newSubcategory',
                    subcategory: response.data
                });
            }
        } catch (err) {
            console.error("Error adding subcategory:", err);
            toast.error("Failed to add subcategory.");
        }
    };

    const openDeleteModal = (item, type) => {
        setItemToDelete(item);
        setDeleteType(type);
        setDeleteWithProducts(false);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteType === "category") {
            await deleteCategoryHandler(itemToDelete._id);
        } else if (deleteType === "subcategory") {
            await deleteSubcategoryHandler(itemToDelete._id);
        }
        setShowDeleteModal(false);
        setItemToDelete(null);
        setDeleteWithProducts(false);
    };

    const deleteCategoryHandler = async (id) => {
        try {
            const endpoint = deleteWithProducts ?
                `/api/categories/${id}/with-products` :
                `/api/categories/${id}`;

            await axios.delete(backendUrl + endpoint);
            fetchCategories();
            toast.success(deleteWithProducts ?
                "Category and all its products deleted successfully!" :
                "Category deleted successfully!",
                { autoClose: 1000 });

            WebSocketService.send({
                type: 'deleteCategory',
                categoryId: id,
                withProducts: deleteWithProducts
            });
        } catch (err) {
            console.error("Error deleting category:", err);
            if (err.response && err.response.data && err.response.data.message) {
                const errorMessage = err.response.data.message;
                if (errorMessage.includes("contains products")) {
                    toast.error("This category contains products. Use the 'Delete with products' option to remove it.");
                } else {
                    toast.error(errorMessage);
                }
            } else {
                toast.error("Failed to delete category.");
            }
        }
    };

    const deleteSubcategoryHandler = async (id) => {
        try {
            const endpoint = deleteWithProducts ?
                `/api/categories/subcategories/${id}/with-products` :
                `/api/categories/subcategories/${id}`;

            await axios.delete(backendUrl + endpoint);
            fetchCategories();
            toast.success(deleteWithProducts ?
                "Subcategory and all its products deleted successfully!" :
                "Subcategory deleted successfully!",
                { autoClose: 1000 });

            WebSocketService.send({
                type: 'deleteSubcategory',
                subcategoryId: id,
                withProducts: deleteWithProducts
            });
        } catch (err) {
            console.error("Error deleting subcategory:", err);
            if (err.response && err.response.data && err.response.data.message) {
                const errorMessage = err.response.data.message;
                if (errorMessage.includes("contains products")) {
                    toast.error("This subcategory contains products. Use the 'Delete with products' option to remove it.");
                } else {
                    toast.error(errorMessage);
                }
            } else {
                toast.error("Failed to delete subcategory.");
            }
        }
    };

    const startEdit = (id, type, currentName) => {
        setEditMode({ id, type, currentName });
        setEditName(currentName);
    };

    const cancelEdit = () => {
        setEditMode(null);
        setEditName("");
    };

    const saveEdit = async () => {
        if (!editMode) return;

        const sanitizedName = DOMPurify.sanitize(editName.trim());
        if (!sanitizedName || sanitizedName.length < 3 || sanitizedName.length > 50) {
            toast.error("Name must be between 3 and 50 characters.");
            return;
        }

        try {
            if (editMode.type === "category") {
                await axios.patch(backendUrl + `/api/categories/${editMode.id}`, { name: sanitizedName });
                toast.success("Category name updated successfully!", { autoClose: 1000 });
                WebSocketService.send({
                    type: 'updatedCategory',
                    categoryId: editMode.id,
                    name: sanitizedName
                });
            } else if (editMode.type === "subcategory") {
                await axios.patch(backendUrl + `/api/categories/subcategories/${editMode.id}`, { name: sanitizedName });
                toast.success("Subcategory name updated successfully!", { autoClose: 1000 });
                WebSocketService.send({
                    type: 'updatedSubcategory',
                    subcategoryId: editMode.id,
                    name: sanitizedName
                });
            }
            fetchCategories();
            cancelEdit();
        } catch (err) {
            console.error("Error updating name:", err);
            toast.error("Failed to update name. Please try again.");
        }
    };

    const toggleVisibility = async (item, type) => {
        try {
            const endpoint = type === "category"
                ? `/api/categories/${item._id}/visibility`
                : `/api/categories/subcategories/${item._id}/visibility`;

            const currentVisibility = item.isVisible;

            await axios.patch(backendUrl + endpoint, {
                isVisible: !currentVisibility
            });

            const action = currentVisibility ? "hidden" : "shown";
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} is now ${action}!`);
            fetchCategories();

            WebSocketService.send({
                type: type === "category" ? 'categoryVisibilityChanged' : 'subcategoryVisibilityChanged',
                [type + 'Id']: item._id,
                isVisible: !currentVisibility
            });
        } catch (err) {
            console.error(`Error toggling ${type} visibility:`, err);
            toast.error(err.response?.data?.message || `Failed to update ${type} visibility.`);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">Manage Categories & Subcategories</h2>

            {/* Add Category */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Add New Category</h3>
                <div className="flex">
                    <input
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="New Category Name"
                        className="border p-2 rounded-l mr-0 w-64"
                    />
                    <button
                        onClick={addCategory}
                        className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                    >
                        Add Category
                    </button>
                </div>
            </div>

            {/* Add Subcategory */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Add New Subcategory</h3>
                <div className="flex flex-wrap gap-2">
                    <select
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        value={selectedCategory}
                        className="border p-2 rounded w-64"
                    >
                        <option value="">Select Parent Category</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <div className="flex">
                        <input
                            value={subcategoryName}
                            onChange={(e) => setSubcategoryName(e.target.value)}
                            placeholder="New Subcategory Name"
                            className="border p-2 rounded-l mr-0 w-64"
                        />
                        <button
                            onClick={addSubcategory}
                            disabled={!selectedCategory}
                            className={`px-4 py-2 rounded-r ${selectedCategory
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-gray-300 text-gray-500"
                                }`}
                        >
                            Add Subcategory
                        </button>
                    </div>
                </div>
            </div>

            {/* Display Categories and Subcategories */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Categories and Subcategories</h2>
                {categories.length === 0 ? (
                    <p className="text-gray-500">No categories available. Add a new category to get started.</p>
                ) : (
                    categories.map((cat) => (
                        <div key={cat._id} className="mb-6 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                {editMode && editMode.type === "category" && editMode.id === cat._id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="border p-1 rounded flex-1"
                                            autoFocus
                                        />
                                        <button
                                            onClick={saveEdit}
                                            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        {cat.name}
                                        <span className="text-sm font-normal text-gray-500">({cat.productCount || 0} items)</span>
                                        {cat.isVisible === false && (
                                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Hidden</span>
                                        )}
                                    </h3>
                                )}

                                <div className="flex gap-2">
                                    {!(editMode && editMode.type === "category" && editMode.id === cat._id) && (
                                        <>
                                            <button
                                                onClick={() => startEdit(cat._id, "category", cat.name)}
                                                className="border bg-white text-blue-600 px-2 py-1 rounded hover:bg-blue-600 hover:text-white transition-all text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => toggleVisibility(cat, "category")}
                                                className={`border px-2 py-1 rounded text-sm transition-all ${cat.isVisible === false
                                                        ? "bg-green-500 text-white hover:bg-green-600"
                                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                    }`}
                                            >
                                                {cat.isVisible === false ? "Show" : "Hide"}
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(cat, "category")}
                                                className="border bg-white text-red-600 px-2 py-1 rounded hover:bg-red-600 hover:text-white transition-all text-sm"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Subcategories */}
                            {cat.subcategories && cat.subcategories.length > 0 ? (
                                <div className="ml-6 mt-3">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Subcategories:</h4>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        {cat.subcategories.map((sub) => (
                                            <div key={sub._id} className="flex justify-between items-center py-2 px-3 border-b last:border-b-0">
                                                {editMode && editMode.type === "subcategory" && editMode.id === sub._id ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="border p-1 rounded flex-1"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={saveEdit}
                                                            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        {sub.name}
                                                        <span className="text-xs text-gray-500">({sub.productCount || 0} items)</span>
                                                        {sub.isVisible === false && (
                                                            <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">Hidden</span>
                                                        )}
                                                    </span>
                                                )}

                                                <div className="flex gap-1">
                                                    {!(editMode && editMode.type === "subcategory" && editMode.id === sub._id) && (
                                                        <>
                                                            <button
                                                                onClick={() => startEdit(sub._id, "subcategory", sub.name)}
                                                                className="border bg-white text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-600 hover:text-white transition-all text-xs"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => toggleVisibility(sub, "subcategory")}
                                                                className={`border px-1.5 py-0.5 rounded text-xs transition-all ${sub.isVisible === false
                                                                        ? "bg-green-500 text-white hover:bg-green-600"
                                                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                                    }`}
                                                            >
                                                                {sub.isVisible === false ? "Show" : "Hide"}
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(sub, "subcategory")}
                                                                className="border bg-white text-red-600 px-1.5 py-0.5 rounded hover:bg-red-600 hover:text-white transition-all text-xs"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="ml-6 mt-2 text-gray-400 text-sm italic">No subcategories</p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in-down">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Delete {deleteType === "category" ? "Category" : "Subcategory"}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <span className="font-semibold">{itemToDelete?.name}</span>?
                            {itemToDelete?.productCount > 0 && (
                                <span className="block mt-2 text-red-600">
                                    This {deleteType} contains {itemToDelete.productCount} product{itemToDelete.productCount !== 1 ? 's' : ''}.
                                </span>
                            )}
                        </p>

                        {itemToDelete?.productCount > 0 && (
                            <div className="mb-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={deleteWithProducts}
                                        onChange={() => setDeleteWithProducts(!deleteWithProducts)}
                                        className="form-checkbox h-4 w-4 text-red-600"
                                    />
                                    <span className="text-red-600">Delete all products in this {deleteType}</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                    Warning: This action cannot be undone!
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={itemToDelete?.productCount > 0 && !deleteWithProducts}
                                className={`px-4 py-2 rounded-lg transition-colors ${itemToDelete?.productCount > 0 && !deleteWithProducts
                                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                    }`}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManager;