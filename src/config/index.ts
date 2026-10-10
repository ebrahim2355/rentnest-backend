import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env"), quiet: true });

const config = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL as string,
    jwtSecret: process.env.JWT_SECRET as string,
    saltRounds: 10,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    currency: "usd",
    admin: {
        name: "RentNest Admin",
        email: process.env.ADMIN_EMAIL || "admin@rentnest.com",
        password: process.env.ADMIN_PASSWORD || "admin123",
    },
};

export default config;
