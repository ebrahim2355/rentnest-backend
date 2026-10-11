import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { idParamSchema } from "../../validations/common.validation";
import { PropertyController } from "./property.controller";
import { PropertyValidation } from "./property.validation";

const router = Router();

router.get("/", validateRequest(PropertyValidation.propertyQuerySchema), PropertyController.getAllProperties);

export const PropertyRoutes = router;
