import { z } from "zod";
import { paginationFields } from "../../validations/common.validation";

const createPaymentSchema = z.object({
    body: z.object({
        rentalRequestId: z.uuid("rentalRequestId must be a valid uuid"),
    }),
});

const confirmPaymentSchema = z.object({
    body: z.object({
        transactionId: z.string("transactionId is required").trim().startsWith("pi_", "transactionId must be a Stripe payment intent id"),
        paymentMethodId: z.string("paymentMethodId must be a string").trim().startsWith("pm_", "paymentMethodId must be a Stripe payment method id").optional(),
    }),
});

export type TCreatePaymentPayload = z.infer<typeof createPaymentSchema>["body"];
export type TConfirmPaymentPayload = z.infer<typeof confirmPaymentSchema>["body"];
export const PaymentValidation = {
    createPaymentSchema,
    confirmPaymentSchema,
};
