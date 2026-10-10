import cors from "cors";
import express, { Application, Request, Response } from "express";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "RentNest API is running",
        data: {
            docs: "/api/docs",
        },
    });
});

export default app;
