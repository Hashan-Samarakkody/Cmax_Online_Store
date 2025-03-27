import express from 'express';
import { addCategory, addSubcategory, getCategories, getSubCategories, deleteCategory, deleteSubcategory } from '../controllers/categoryController.js';

const categoryRouter = express.Router();

categoryRouter.post("/", addCategory);
categoryRouter.post("/subcategories", addSubcategory);
categoryRouter.get("/subcategories/all", getSubCategories);
categoryRouter.get("/", getCategories);
categoryRouter.delete("/:id", deleteCategory);
categoryRouter.delete("/subcategories/:id", deleteSubcategory);

export default categoryRouter;
