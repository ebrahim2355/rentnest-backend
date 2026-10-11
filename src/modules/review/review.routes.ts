import { Router } from "express";
import { Role } from "../../generated/prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ReviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = Router();

router.post("/", auth(Role.TENANT), validateRequest(ReviewValidation.createReviewSchema), ReviewController.createReview);

export const ReviewRoutes = router;
