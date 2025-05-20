import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { backendUrl } from '../App';
import WebSocketService from '../services/WebSocketService';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [subcategoryName, setSubcategoryName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState("");
    const [deleteWithProducts, setDeleteWithProducts] = useState(false);
    const [editMode, setEditMode] = useState(null);
    const [editName, setEditName] = useState("");

    // Pagination and search states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCategories();

        // Connect to WebSocket and listen for category updates
        const handleNewCategory = (newCategory) => {
            setAllCategories((prevCategories) => [...prevCategories, newCategory.category]);
            applyFiltersAndPagination([...allCategories, newCategory.category]);
        };

        const handleUpdatedCategory = (data) => {
            const updatedCategories = allCategories.map(cat =>
                cat._id === data.categoryId ? { ...cat, name: data.name } : cat
            );
            setAllCategories(updatedCategories);
            applyFiltersAndPagination(updatedCategories);
        };

        const handleUpdatedSubcategory = (data) => {
            const updatedCategories = allCategories.map(cat => {
                if (!cat.subcategories) return cat;

                const updatedSubcategories = cat.subcategories.map(sub =>
                    sub._id === data.subcategoryId ? { ...sub, name: data.name } : sub
                );

                return { ...cat, subcategories: updatedSubcategories };
            });

            setAllCategories(updatedCategories);
            applyFiltersAndPagination(updatedCategories);
        };

        const handleCategoryVisibility = (data) => {
            const updatedCategories = allCategories.map(cat =>
                cat._id === data.categoryId ? { ...cat, isVisible: data.isVisible } : cat
            );
            setAllCategories(updatedCategories);
            applyFiltersAndPagination(updatedCategories);
        };

        const handleSubcategoryVisibility = (data) => {
            const updatedCategories = allCategories.map(cat => {
                if (!cat.subcategories) return cat;

                const updatedSubcategories = cat.subcategories.map(sub =>
                    sub._id === data.subcategoryId ? { ...sub, isVisible: data.isVisible } : sub
                );

                return { ...cat, subcategories: updatedSubcategories };
            });

            setAllCategories(updatedCategories);
            applyFiltersAndPagination(updatedCategories);
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

    // Apply filters and pagination whenever search term, page, or items per page changes
    useEffect(() => {
        applyFiltersAndPagination(allCategories);
    }, [searchTerm, currentPage, itemsPerPage, allCategories]);

    // Function to filter and paginate categories
    const applyFiltersAndPagination = (categoriesArray) => {
        if (!categoriesArray || categoriesArray.length === 0) {
            setCategories([]);
            setTotalPages(1);
            return;
        }

        // Filter categories based on search term
        let filteredCategories = categoriesArray;

        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            filteredCategories = categoriesArray.filter(cat => {
                const nameMatch = cat.name.toLowerCase().includes(term);
                const hasMatchingSubcategory = cat.subcategories &&
                    cat.subcategories.some(sub => sub.name.toLowerCase().includes(term));

                return nameMatch || hasMatchingSubcategory;
            });
        }

        // Calculate pagination
        setTotalPages(Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage)));

        // Adjust current page if it exceeds the new total
        if (currentPage > Math.ceil(filteredCategories.length / itemsPerPage)) {
            setCurrentPage(1);
        }

        // Get current page items
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

        setCategories(currentItems);
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
    const fetchCategories = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/categories");
            if (Array.isArray(data)) {
                setAllCategories(data);
                applyFiltersAndPagination(data);
            } else {
                setAllCategories([]);
                setCategories([]);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            toast.error("Failed to fetch categories.");
            setAllCategories([]);
            setCategories([]);
        }
    };

    const addSubcategory = async () => {
        const sanitizedSubcategoryName = DOMPurify.sanitize(subcategoryName.trim());

        // Validate subcategory name
        if (!sanitizedSubcategoryName || sanitizedSubcategoryName.length < 2 || sanitizedSubcategoryName.length > 50) {
            toast.error("Subcategory name must be between 2 and 50 characters.");
            return;
        }

        if (/^\d+$/.test(sanitizedSubcategoryName)) {
            toast.error("Subcategory name cannot be only numbers.");
            return;
        }

        if (!selectedCategory) {
            toast.error("Please select a parent category.");
            return;
        }

        try {
            // Try the alternative endpoint structure if your API is set up differently
            const response = await axios.post(
                `${backendUrl}/api/categories/subcategories`,
                {
                    name: sanitizedSubcategoryName,
                    categoryId: selectedCategory
                }
            );

            setSubcategoryName("");
            fetchCategories();
            toast.success("Subcategory added successfully!", { autoClose: 1000 });

            // Update via WebSocket if available
            if (response.data) {
                const category = allCategories.find(cat => cat._id === selectedCategory);
                if (category) {
                    WebSocketService.send({
                        type: 'newSubcategory',
                        categoryId: selectedCategory,
                        subcategory: response.data
                    });
                }
            }
        } catch (err) {
            console.error("Error adding subcategory:", err);
            toast.error(`Failed to add subcategory: ${err.response?.data?.message || 'Server error'}`);
        }
    };

    const startEdit = (id, type, currentName) => {
        setEditMode({ id, type });
        setEditName(currentName);
    };

    const cancelEdit = () => {
        setEditMode(null);
        setEditName("");
    };

    const saveEdit = async () => {
        const sanitizedName = DOMPurify.sanitize(editName.trim());

        if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 50) {
            toast.error(`${editMode.type === "category" ? "Category" : "Subcategory"} name must be between 2 and 50 characters.`);
            return;
        }

        if (/^\d+$/.test(sanitizedName)) {
            toast.error(`${editMode.type === "category" ? "Category" : "Subcategory"} name cannot be only numbers.`);
            return;
        }

        try {
            if (editMode.type === "category") {
                await axios.put(`${backendUrl}/api/categories/${editMode.id}`, { name: sanitizedName });

                // Send WebSocket notification
                WebSocketService.send({
                    type: 'updateCategory',
                    categoryId: editMode.id,
                    name: sanitizedName
                });

            } else if (editMode.type === "subcategory") {
                // Find parent category for this subcategory
                let parentCategoryId;
                for (const cat of allCategories) {
                    if (cat.subcategories && cat.subcategories.some(sub => sub._id === editMode.id)) {
                        parentCategoryId = cat._id;
                        break;
                    }
                }

                if (parentCategoryId) {
                    await axios.put(
                        `${backendUrl}/api/categories/${parentCategoryId}/subcategories/${editMode.id}`,
                        { name: sanitizedName }
                    );

                    // Send WebSocket notification
                    WebSocketService.send({
                        type: 'updateSubcategory',
                        subcategoryId: editMode.id,
                        name: sanitizedName
                    });
                }
            }

            fetchCategories();
            toast.success(`${editMode.type === "category" ? "Category" : "Subcategory"} updated successfully!`);
            setEditMode(null);
            setEditName("");
        } catch (err) {
            console.error(`Error updating ${editMode.type}:`, err);
            toast.error(`Failed to update ${editMode.type}.`);
        }
    };

    const toggleVisibility = async (item, type) => {
        try {
            const newVisibility = !(item.isVisible === false); // false => true, undefined/true => false

            if (type === "category") {
                await axios.patch(`${backendUrl}/api/categories/${item._id}/visibility`, {
                    isVisible: !newVisibility
                });

                // Send WebSocket notification
                WebSocketService.send({
                    type: 'categoryVisibilityChange',
                    categoryId: item._id,
                    isVisible: !newVisibility
                });

            } else if (type === "subcategory") {
                await axios.patch(`${backendUrl}/api/categories/subcategories/${item._id}/visibility`, {
                    isVisible: !newVisibility
                });

                // Send WebSocket notification
                WebSocketService.send({
                    type: 'subcategoryVisibilityChange',
                    subcategoryId: item._id,
                    isVisible: !newVisibility
                });
            }

            fetchCategories();
            toast.success(`${type === "category" ? "Category" : "Subcategory"} ${newVisibility ? "hidden" : "visible"} successfully!`);
        } catch (err) {
            console.error(`Error updating ${type} visibility:`, err);
            toast.error(`Failed to update ${type} visibility: ${err.response?.data?.message || 'Server error'}`);
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

    // Pagination controls
    const goToPage = (pageNumber) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    // Handle items per page change
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(parseInt(e.target.value));
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Manage Categories & Subcategories</h2>

            {/* Add Category - more responsive layout */}
            <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Add New Category</h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                    <input
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="New Category Name"
                        className="border p-2 rounded sm:rounded-l sm:mr-1 w-full sm:w-64"
                    />
                    <button
                        onClick={addCategory}
                        className="bg-blue-500 text-white px-4 py-2 rounded sm:rounded-r hover:bg-blue-600"
                    >
                        Add Category
                    </button>
                </div>
            </div>

            {/* Add Subcategory - more responsive layout */}
            <div className="mb-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Add New Subcategory</h3>
                <div className="flex flex-col sm:flex-wrap gap-2">
                    <select
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        value={selectedCategory}
                        className="border p-2 rounded w-full sm:w-64"
                    >
                        <option value="">Select Parent Category</option>
                        {allCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                        <input
                            value={subcategoryName}
                            onChange={(e) => setSubcategoryName(e.target.value)}
                            placeholder="New Subcategory Name"
                            className="border p-2 rounded sm:rounded-l sm:mr-1 w-full sm:w-64"
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
                </div>
            </div>

            {/* Search and Pagination Controls - mobile friendly adjustments */}
            <div className="mt-8 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold pb-2">Categories and Subcategories</h2>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:space-x-4">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search categories..."
                                className="border p-2 pl-8 rounded w-full sm:w-64"
                            />
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Items Per Page Selector */}
                        <div className="flex items-center">
                            <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-600">Show:</label>
                            <select
                                id="itemsPerPage"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="border rounded p-1"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="300">300</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results count display */}
                <div className="text-sm text-gray-500 mb-2">
                    Showing {categories.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, allCategories.filter(cat =>
                        searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (cat.subcategories && cat.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))) : true
                    ).length)} of {allCategories.filter(cat =>
                        searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (cat.subcategories && cat.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))) : true
                    ).length} categories
                </div>
            </div>

            {/* Display Categories and Subcategories - improve for mobile */}
            <div>
                {categories.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500">
                            {searchTerm ? "No categories found matching your search." : "No categories available. Add a new category to get started."}
                        </p>
                    </div>
                ) : (
                    categories.map((cat) => (
                        <div key={cat._id} className="mb-6 p-3 sm:p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            {/* Category header - better stacking on mobile */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
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
                                    <h3 className="text-lg sm:text-xl font-semibold flex flex-wrap items-center gap-2">
                                        {cat.name}
                                        <span className="text-sm font-normal text-gray-500">({cat.productCount || 0} items)</span>
                                        {cat.isVisible === false && (
                                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Hidden</span>
                                        )}
                                    </h3>
                                )}

                                <div className="flex flex-wrap gap-2">
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

                            {/* Subcategories - adjust padding for mobile */}
                            {cat.subcategories && cat.subcategories.length > 0 ? (
                                <div className="ml-4 sm:ml-6 mt-3">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Subcategories:</h4>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        {cat.subcategories.map((sub) => (
                                            <div key={sub._id} className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 px-2 sm:px-3 border-b last:border-b-0 gap-2">
                                                {/* Subcategory with responsive layout */}
                                                {editMode && editMode.type === "subcategory" && editMode.id === sub._id ? (
                                                    <div className="flex items-center gap-2 flex-1 w-full">
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

                                                <div className="flex gap-1 ml-0 sm:ml-2">
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
                                <p className="ml-4 sm:ml-6 mt-2 text-gray-400 text-sm italic">No subcategories</p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls - make touch-friendly */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6 overflow-x-auto py-2">
                    <nav className="flex items-center gap-1">
                        <button
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1.5 rounded ${currentPage === 1 ? 'text-gray-400' : 'hover:bg-gray-100'}`}
                        >
                            &laquo;
                        </button>

                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1.5 rounded ${currentPage === 1 ? 'text-gray-400' : 'hover:bg-gray-100'}`}
                        >
                            &lsaquo;
                        </button>

                        {/* Page numbers with improved touch targets */}
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNum = index + 1;

                            // Display limited page numbers with ellipsis for large number of pages
                            if (totalPages <= 5 ||
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => goToPage(pageNum)}
                                        className={`px-3 py-1.5 rounded ${currentPage === pageNum
                                            ? 'bg-blue-500 text-white'
                                            : 'hover:bg-gray-100'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            } else if (
                                (pageNum === currentPage - 2 && pageNum > 1) ||
                                (pageNum === currentPage + 2 && pageNum < totalPages)
                            ) {
                                return <span key={pageNum} className="px-1">...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1.5 rounded ${currentPage === totalPages ? 'text-gray-400' : 'hover:bg-gray-100'}`}
                        >
                            &rsaquo;
                        </button>

                        <button
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1.5 rounded ${currentPage === totalPages ? 'text-gray-400' : 'hover:bg-gray-100'}`}
                        >
                            &raquo;
                        </button>
                    </nav>
                </div>
            )}

            {/* Delete Confirmation Modal - same as before */}
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