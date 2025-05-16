import express from 'express';
import {
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
} from '../controllers/categoryController.js';

const categoryRouter = express.Router();

categoryRouter.post("/", addCategory);
categoryRouter.post("/subcategories", addSubcategory);
categoryRouter.get("/subcategories/all", getSubCategories);
categoryRouter.get("/", getCategories);
categoryRouter.patch("/:id", updateCategory);
categoryRouter.patch("/subcategories/:id", updateSubcategory);
categoryRouter.patch("/:id/visibility", toggleCategoryVisibility);
categoryRouter.patch("/subcategories/:id/visibility", toggleSubcategoryVisibility);
categoryRouter.delete("/:id/with-products", deleteCategoryWithProducts);
categoryRouter.delete("/subcategories/:id/with-products", deleteSubcategoryWithProducts);

export default categoryRouter;