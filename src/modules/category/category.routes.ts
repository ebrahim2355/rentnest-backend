import { Router } from "express";
import { CategoryController } from "./category.controller";

const router = Router();

router.get("/", CategoryController.getAllCategories);

export const CategoryRoutes = router;
