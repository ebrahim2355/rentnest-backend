import { Router } from "express";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { CategoryRoutes } from "../modules/category/category.routes";
import { LandlordRoutes } from "../modules/landlord/landlord.routes";
import { PropertyRoutes } from "../modules/property/property.routes";

const router = Router();

const moduleRoutes = [
    { path: "/auth", route: AuthRoutes },
    { path: "/categories", route: CategoryRoutes },
    { path: "/properties", route: PropertyRoutes },
    { path: "/landlord", route: LandlordRoutes },
    { path: "/admin", route: AdminRoutes },
];

moduleRoutes.forEach((moduleRoute) => router.use(moduleRoute.path, moduleRoute.route));

export default router;
