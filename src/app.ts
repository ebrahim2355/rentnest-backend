import cors from "cors";
import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import saveRawBody from "./middlewares/rawBody";
import router from "./routes";

const app: Application = express();

app.use(cors());
app.use(express.json({ verify: saveRawBody }));

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "RentNest API is running",
        data: {
            docs: "/api/docs",
        },
    });
});

app.use("/api", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
