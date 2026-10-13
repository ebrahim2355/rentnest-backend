import { z } from "zod";
import { paginationFields } from "../../validations/common.validation";

const createPaymentSchema = z.object({
    body: z.object({
        rentalRequestId: z.uuid("rentalRequestId must be a valid uuid"),
    }),
});

const checkoutPaymentSchema = z.object({
    body: z.object({
        rentalRequestId: z.uuid("rentalRequestId must be a valid uuid"),
        clientUrl: z.url("clientUrl must be a valid URL").optional(),
    }),
});

const confirmPaymentSchema = z.object({
    body: z.object({
        transactionId: z.string("transactionId is required").trim().regex(/^(pi|cs)_/, "transactionId must be a Stripe payment intent or checkout session id"),
        paymentMethodId: z.string("paymentMethodId must be a string").trim().startsWith("pm_", "paymentMethodId must be a Stripe payment method id").optional(),
    }),
});

const paymentQuerySchema = z.object({
    query: z.object({
        status: z.enum(["PENDING", "COMPLETED", "FAILED"], "Status must be PENDING, COMPLETED or FAILED").optional(),
        ...paginationFields,
    }),
});

export type TCreatePaymentPayload = z.infer<typeof createPaymentSchema>["body"];
export type TCheckoutPaymentPayload = z.infer<typeof checkoutPaymentSchema>["body"];
export type TConfirmPaymentPayload = z.infer<typeof confirmPaymentSchema>["body"];
export type TPaymentQuery = z.infer<typeof paymentQuerySchema>["query"];

export const PaymentValidation = {
    createPaymentSchema,
    checkoutPaymentSchema,
    confirmPaymentSchema,
    paymentQuerySchema,
};
