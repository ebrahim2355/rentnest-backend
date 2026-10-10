import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post("/register", validateRequest(AuthValidation.registerSchema), AuthController.registerUser);
router.post("/login", validateRequest(AuthValidation.loginSchema), AuthController.loginUser);

export const AuthRoutes = router;
