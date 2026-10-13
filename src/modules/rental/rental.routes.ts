import { Router } from "express";
import { Role } from "../../generated/prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { idParamSchema } from "../../validations/common.validation";
import { StatsController } from "../stats/stats.controller";
import { RentalController } from "./rental.controller";
import { RentalValidation } from "./rental.validation";

const router = Router();

router.post("/", auth(Role.TENANT), validateRequest(RentalValidation.createRentalSchema), RentalController.createRentalRequest);
router.get("/", auth(Role.TENANT), validateRequest(RentalValidation.rentalQuerySchema), RentalController.getMyRentalRequests);
router.get("/stats", auth(Role.TENANT), StatsController.getTenantStats);
router.get("/:id", auth(), validateRequest(idParamSchema), RentalController.getRentalRequestById);
router.patch("/:id/cancel", auth(Role.TENANT), validateRequest(idParamSchema), RentalController.cancelRentalRequest);

export const RentalRoutes = router;
