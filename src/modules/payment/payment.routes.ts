import { Router } from "express";
import { Role } from "../../generated/prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { idParamSchema } from "../../validations/common.validation";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

router.post("/create", auth(Role.TENANT), validateRequest(PaymentValidation.createPaymentSchema), PaymentController.createPayment);
router.post("/confirm", auth(Role.TENANT), validateRequest(PaymentValidation.confirmPaymentSchema), PaymentController.confirmPayment);
router.post("/webhook", PaymentController.handleWebhook);

export const PaymentRoutes = router;
