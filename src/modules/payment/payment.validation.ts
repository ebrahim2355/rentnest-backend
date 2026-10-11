import { z } from "zod";
import { paginationFields } from "../../validations/common.validation";

const createPaymentSchema = z.object({
    body: z.object({
        rentalRequestId: z.uuid("rentalRequestId must be a valid uuid"),
    }),
});

export type TCreatePaymentPayload = z.infer<typeof createPaymentSchema>["body"];
export const PaymentValidation = {
    createPaymentSchema,
};
