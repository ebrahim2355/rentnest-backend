import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";
import config from "../../config";
import AppError from "../../errors/AppError";
import { PaymentStatus, Prisma, PropertyStatus, RentalStatus, Role } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import getStripe from "../../lib/stripe";
import { IAuthUser } from "../../middlewares/auth";
import { getMeta, getPagination } from "../../utils/pagination";
import { TConfirmPaymentPayload, TCreatePaymentPayload } from "./payment.validation";

const paymentInclude = {
    rentalRequest: {
        select: {
            id: true,
            status: true,
            moveInDate: true,
            durationMonths: true,
            property: { select: { id: true, title: true, location: true, landlordId: true } },
        },
    },
    user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PaymentInclude;

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

const markPaymentCompleted = async (transactionId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: { rentalRequest: { select: { propertyId: true } } },
    });

    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found", `No payment found with transaction id ${transactionId}`);
    }

    if (payment.status === PaymentStatus.COMPLETED) {
        return prisma.payment.findUniqueOrThrow({
            where: { id: payment.id },
            include: paymentInclude,
        });
    }

    const [, , completedPayment] = await prisma.$transaction([
        prisma.rentalRequest.update({
            where: { id: payment.rentalRequestId },
            data: { status: RentalStatus.ACTIVE },
        }),
        prisma.property.update({
            where: { id: payment.rentalRequest.propertyId },
            data: { status: PropertyStatus.RENTED },
        }),
        prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.COMPLETED, paidAt: new Date() },
            include: paymentInclude,
        }),
    ]);

    return completedPayment;
};

const markPaymentFailed = async (transactionId: string) => {
    await prisma.payment.updateMany({
        where: { transactionId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
    });
};

const confirmPayment = async (tenantId: string, payload: TConfirmPaymentPayload) => {
    const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.transactionId },
    });

    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found", `No payment found with transaction id ${payload.transactionId}`);
    }

    if (payment.userId !== tenantId) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You can only confirm your own payment");
    }

    if (payment.status === PaymentStatus.COMPLETED) {
        return markPaymentCompleted(payment.transactionId);
    }

    if (payment.status === PaymentStatus.FAILED) {
        throw new AppError(StatusCodes.CONFLICT, "Payment already failed", "Create a new payment for this rental request");
    }

    const stripe = getStripe();
    let paymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);

    if (paymentIntent.status !== "succeeded" && payload.paymentMethodId) {
        try {
            paymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
                payment_method: payload.paymentMethodId,
            });
        } catch (error) {
            if (error instanceof Stripe.errors.StripeCardError) {
                await markPaymentFailed(payment.transactionId);
                throw new AppError(StatusCodes.PAYMENT_REQUIRED, "Payment failed", error.message);
            }

            throw error;
        }
    }

    if (paymentIntent.status !== "succeeded") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Payment is not completed", `Stripe payment status is ${paymentIntent.status}`);
    }

    return markPaymentCompleted(payment.transactionId);
};

const handleWebhook = async (rawBody: Buffer | undefined, signature: string | undefined) => {
    if (!config.stripeWebhookSecret) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Webhook is not configured", "STRIPE_WEBHOOK_SECRET is missing on the server");
    }

    if (!rawBody || !signature) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid webhook request", "Stripe signature or request body is missing");
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
    } catch (error) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid webhook signature", "The request could not be verified as a Stripe event");
    }

    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
        const transactionId = event.data.object.id;
        const payment = await prisma.payment.findUnique({ where: { transactionId } });

        if (payment && event.type === "payment_intent.succeeded") {
            await markPaymentCompleted(transactionId);
        }

        if (payment && event.type === "payment_intent.payment_failed") {
            await markPaymentFailed(transactionId);
        }
    }

    return { received: true };
};

export const PaymentService = {
    createPayment,
    confirmPayment,
    handleWebhook,
};
