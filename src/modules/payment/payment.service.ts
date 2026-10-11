import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";
import config from "../../config";
import AppError from "../../errors/AppError";
import { PaymentStatus, Prisma, PropertyStatus, RentalStatus, Role } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import getStripe from "../../lib/stripe";
import { IAuthUser } from "../../middlewares/auth";
import { getMeta, getPagination } from "../../utils/pagination";
import { TCreatePaymentPayload } from "./payment.validation";

const createPayment = async (tenantId: string, payload: TCreatePaymentPayload) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { id: payload.rentalRequestId },
        include: { property: { select: { title: true } } },
    });

    if (!rentalRequest) {
        throw new AppError(StatusCodes.NOT_FOUND, "Rental request not found", `No rental request found with id ${payload.rentalRequestId}`);
    }

    if (rentalRequest.tenantId !== tenantId) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You can only pay for your own rental request");
    }

    if (rentalRequest.status !== RentalStatus.APPROVED) {
        throw new AppError(StatusCodes.CONFLICT, "Payment is not allowed", `Only an approved rental request can be paid. Current status is ${rentalRequest.status}`);
    }

    const stripe = getStripe();

    const pendingPayment = await prisma.payment.findFirst({
        where: { rentalRequestId: rentalRequest.id, status: PaymentStatus.PENDING },
    });

    if (pendingPayment) {
        const existingIntent = await stripe.paymentIntents.retrieve(pendingPayment.transactionId);

        return {
            payment: pendingPayment,
            clientSecret: existingIntent.client_secret,
        };
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(rentalRequest.totalAmount) * 100),
        currency: config.currency,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        description: `Rent payment for ${rentalRequest.property.title}`,
        metadata: {
            rentalRequestId: rentalRequest.id,
            tenantId,
        },
    });

    const payment = await prisma.payment.create({
        data: {
            transactionId: paymentIntent.id,
            rentalRequestId: rentalRequest.id,
            userId: tenantId,
            amount: rentalRequest.totalAmount,
            currency: config.currency,
        },
    });

    return {
        payment,
        clientSecret: paymentIntent.client_secret,
    };
};

export const PaymentService = {
    createPayment,
};
