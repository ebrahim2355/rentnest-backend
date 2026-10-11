import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";
import config from "../config";
import AppError from "../errors/AppError";

let stripeClient: Stripe | null = null;

const getStripe = (): Stripe => {
    if (!config.stripeSecretKey) {
        throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Payment is not configured", "STRIPE_SECRET_KEY is missing on the server");
    }

    if (!stripeClient) {
        stripeClient = new Stripe(config.stripeSecretKey);
    }

    return stripeClient;
};

export default getStripe;
