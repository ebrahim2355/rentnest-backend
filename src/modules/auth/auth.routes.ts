import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post("/register", validateRequest(AuthValidation.registerSchema), AuthController.registerUser);
router.post("/login", validateRequest(AuthValidation.loginSchema), AuthController.loginUser);
router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;
