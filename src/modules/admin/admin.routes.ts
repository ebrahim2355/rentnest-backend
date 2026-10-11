import { Router } from "express";
import { Role } from "../../generated/prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { idParamSchema } from "../../validations/common.validation";
import { CategoryController } from "../category/category.controller";
import { CategoryValidation } from "../category/category.validation";
import { PropertyController } from "../property/property.controller";
import { PropertyValidation } from "../property/property.validation";
import { RentalController } from "../rental/rental.controller";
import { RentalValidation } from "../rental/rental.validation";

const router = Router();

router.use(auth(Role.ADMIN));

router.post("/categories", validateRequest(CategoryValidation.createCategorySchema), CategoryController.createCategory);
router.patch("/categories/:id", validateRequest(CategoryValidation.updateCategorySchema), CategoryController.updateCategory);
router.delete("/categories/:id", validateRequest(idParamSchema), CategoryController.deleteCategory);

router.delete("/properties/:id", validateRequest(idParamSchema), PropertyController.deleteProperty);

export const AdminRoutes = router;
