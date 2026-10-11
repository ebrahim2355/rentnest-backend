import { Router } from "express";
import { swaggerDocument, swaggerHtml } from "./swagger";

const router = Router();

router.get("/", (req, res) => {
    res.type("html").send(swaggerHtml);
});

router.get("/openapi.json", (req, res) => {
    res.json(swaggerDocument);
});

export const DocsRoutes = router;
