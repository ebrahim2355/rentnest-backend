import { Router } from "express";
import { Role } from "../../generated/prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { idParamSchema } from "../../validations/common.validation";
import { RentalController } from "./rental.controller";
import { RentalValidation } from "./rental.validation";

const router = Router();

router.post("/", auth(Role.TENANT), validateRequest(RentalValidation.createRentalSchema), RentalController.createRentalRequest);

export const RentalRoutes = router;
