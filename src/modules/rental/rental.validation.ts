import { z } from "zod";
import { paginationFields } from "../../validations/common.validation";

const isTodayOrLater = (date: Date) => {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    return date.getTime() >= startOfToday.getTime();
};

const createRentalSchema = z.object({
    body: z.object({
        propertyId: z.uuid("propertyId must be a valid uuid"),
        moveInDate: z.coerce.date("moveInDate must be a valid date").refine(isTodayOrLater, "moveInDate cannot be in the past"),
        durationMonths: z.number("durationMonths must be a number").int("durationMonths must be a whole number").min(1, "durationMonths must be at least 1").max(60, "durationMonths cannot be more than 60"),
        message: z.string("Message must be a string").trim().max(500, "Message cannot be more than 500 characters").optional(),
    }),
});

const rentalQuerySchema = z.object({
    query: z.object({
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "CANCELLED"], "Invalid rental status").optional(),
        ...paginationFields,
    }),
});

export type TCreateRentalPayload = z.infer<typeof createRentalSchema>["body"];
export type TRentalQuery = z.infer<typeof rentalQuerySchema>["query"];

export const RentalValidation = {
    createRentalSchema,
    rentalQuerySchema,
};
