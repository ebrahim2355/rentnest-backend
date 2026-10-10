import { Router } from "express";
import { Role } from "../../generated/prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { idParamSchema } from "../../validations/common.validation";
import { PropertyController } from "../property/property.controller";
import { PropertyValidation } from "../property/property.validation";

const router = Router();

router.use(auth(Role.LANDLORD));

router.post("/properties", validateRequest(PropertyValidation.createPropertySchema), PropertyController.createProperty);

export const LandlordRoutes = router;
