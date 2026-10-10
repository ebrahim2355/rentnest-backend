import { Router } from "express";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { CategoryRoutes } from "../modules/category/category.routes";

const router = Router();

const moduleRoutes = [
    { path: "/auth", route: AuthRoutes },
    { path: "/categories", route: CategoryRoutes },
    { path: "/admin", route: AdminRoutes },
];

moduleRoutes.forEach((moduleRoute) => router.use(moduleRoute.path, moduleRoute.route));

export default router;
