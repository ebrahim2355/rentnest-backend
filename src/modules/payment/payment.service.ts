import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";
import config from "../../config";
import AppError from "../../errors/AppError";
import { PaymentStatus, Prisma, PropertyStatus, RentalStatus, Role } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import getStripe from "../../lib/stripe";
import { IAuthUser } from "../../middlewares/auth";
import { getMeta, getPagination } from "../../utils/pagination";
import { TCheckoutPaymentPayload, TConfirmPaymentPayload, TCreatePaymentPayload, TPaymentQuery } from "./payment.validation";

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

const getPayableRentalRequest = async (tenantId: string, rentalRequestId: string) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { id: rentalRequestId },
        include: { property: { select: { title: true } } },
    });

    if (!rentalRequest) {
        throw new AppError(StatusCodes.NOT_FOUND, "Rental request not found", `No rental request found with id ${rentalRequestId}`);
    }

    if (rentalRequest.tenantId !== tenantId) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You can only pay for your own rental request");
    }

    if (rentalRequest.status !== RentalStatus.APPROVED) {
        throw new AppError(StatusCodes.CONFLICT, "Payment is not allowed", `Only an approved rental request can be paid. Current status is ${rentalRequest.status}`);
    }

    return rentalRequest;
};

const findPendingPayment = async (rentalRequestId: string) => {
    return prisma.payment.findFirst({
        where: { rentalRequestId, status: PaymentStatus.PENDING },
    });
};

const markPaymentFailed = async (transactionId: string) => {
    await prisma.payment.updateMany({
        where: { transactionId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
    });
};

const createPayment = async (tenantId: string, payload: TCreatePaymentPayload) => {
    const rentalRequest = await getPayableRentalRequest(tenantId, payload.rentalRequestId);
    const stripe = getStripe();
    const pendingPayment = await findPendingPayment(rentalRequest.id);

    if (pendingPayment?.transactionId.startsWith("pi_")) {
        const existingIntent = await stripe.paymentIntents.retrieve(pendingPayment.transactionId);

        return {
            payment: pendingPayment,
            clientSecret: existingIntent.client_secret,
        };
    }

    if (pendingPayment) {
        await markPaymentFailed(pendingPayment.transactionId);
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

const getClientUrl = (requestedUrl: string | undefined) => {
    const cleanUrl = requestedUrl?.replace(/\/$/, "");

    if (cleanUrl && config.clientUrls.includes(cleanUrl)) {
        return cleanUrl;
    }

    return config.clientUrls[0] as string;
};

const createCheckoutSession = async (tenantId: string, payload: TCheckoutPaymentPayload) => {
    const rentalRequest = await getPayableRentalRequest(tenantId, payload.rentalRequestId);
    const stripe = getStripe();
    const pendingPayment = await findPendingPayment(rentalRequest.id);

    if (pendingPayment?.transactionId.startsWith("cs_")) {
        const existingSession = await stripe.checkout.sessions.retrieve(pendingPayment.transactionId);

        if (existingSession.status === "open" && existingSession.url) {
            return {
                payment: pendingPayment,
                checkoutUrl: existingSession.url,
            };
        }
    }

    if (pendingPayment) {
        await markPaymentFailed(pendingPayment.transactionId);
    }

    const clientUrl = getClientUrl(payload.clientUrl);
    const metadata = {
        rentalRequestId: rentalRequest.id,
        tenantId,
    };

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: config.currency,
                    unit_amount: Math.round(Number(rentalRequest.totalAmount) * 100),
                    product_data: {
                        name: `Rent for ${rentalRequest.property.title}`,
                        description: `${rentalRequest.durationMonths} month rental`,
                    },
                },
            },
        ],
        metadata,
        payment_intent_data: { metadata },
        success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/payment/cancel?rentalRequestId=${rentalRequest.id}`,
    });

    const payment = await prisma.payment.create({
        data: {
            transactionId: session.id,
            rentalRequestId: rentalRequest.id,
            userId: tenantId,
            amount: rentalRequest.totalAmount,
            currency: config.currency,
        },
    });

    return {
        payment,
        checkoutUrl: session.url,
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

const confirmCheckoutSession = async (transactionId: string) => {
    const session = await getStripe().checkout.sessions.retrieve(transactionId);

    if (session.payment_status === "paid") {
        return markPaymentCompleted(transactionId);
    }

    if (session.status === "expired") {
        await markPaymentFailed(transactionId);
        throw new AppError(StatusCodes.CONFLICT, "Payment session expired", "Start a new payment for this rental request");
    }

    throw new AppError(StatusCodes.BAD_REQUEST, "Payment is not completed", `Stripe checkout status is ${session.status}`);
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

    if (payment.transactionId.startsWith("cs_")) {
        return confirmCheckoutSession(payment.transactionId);
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
        const paymentIntent = event.data.object;
        const payment = await prisma.payment.findUnique({ where: { transactionId: paymentIntent.id } });

        if (payment && event.type === "payment_intent.succeeded") {
            await markPaymentCompleted(payment.transactionId);
        }

        if (payment && event.type === "payment_intent.payment_failed") {
            await markPaymentFailed(payment.transactionId);
        }

        const rentalRequestId = paymentIntent.metadata.rentalRequestId;

        if (!payment && event.type === "payment_intent.succeeded" && rentalRequestId) {
            const checkoutPayment = await prisma.payment.findFirst({
                where: {
                    rentalRequestId,
                    status: PaymentStatus.PENDING,
                    transactionId: { startsWith: "cs_" },
                },
            });

            if (checkoutPayment) {
                await markPaymentCompleted(checkoutPayment.transactionId);
            }
        }
    }

    if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
        const payment = await prisma.payment.findUnique({ where: { transactionId: event.data.object.id } });

        if (payment) {
            await markPaymentCompleted(payment.transactionId);
        }
    }

    return { received: true };
};

const getPaymentAccessFilter = (user: IAuthUser): Prisma.PaymentWhereInput => {
    if (user.role === Role.TENANT) {
        return { userId: user.id };
    }

    if (user.role === Role.LANDLORD) {
        return { rentalRequest: { property: { landlordId: user.id } } };
    }

    return {};
};

const getPayments = async (user: IAuthUser, query: TPaymentQuery) => {
    const { page, limit, skip, sortOrder } = getPagination(query);

    const where: Prisma.PaymentWhereInput = {
        ...getPaymentAccessFilter(user),
        ...(query.status ? { status: query.status } : {}),
    };

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            include: paymentInclude,
            orderBy: { createdAt: sortOrder },
            skip,
            take: limit,
        }),
        prisma.payment.count({ where }),
    ]);

    return {
        meta: getMeta(page, limit, total),
        data: payments,
    };
};

const getPaymentById = async (id: string, user: IAuthUser) => {
    const payment = await prisma.payment.findFirst({
        where: { id, ...getPaymentAccessFilter(user) },
        include: paymentInclude,
    });

    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found", `No payment found with id ${id}`);
    }

    return payment;
};

export const PaymentService = {
    createPayment,
    createCheckoutSession,
    confirmPayment,
    handleWebhook,
    getPayments,
    getPaymentById,
};
