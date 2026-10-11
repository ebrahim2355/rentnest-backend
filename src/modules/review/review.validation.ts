import { z } from "zod";
import { paginationFields } from "../../validations/common.validation";

const createReviewSchema = z.object({
    body: z.object({
        rentalRequestId: z.uuid("rentalRequestId must be a valid uuid"),
        rating: z.number("Rating must be a number").int("Rating must be a whole number").min(1, "Rating must be at least 1").max(5, "Rating cannot be more than 5"),
        comment: z.string("Comment is required").trim().min(5, "Comment must be at least 5 characters").max(1000, "Comment cannot be more than 1000 characters"),
    }),
});

const reviewQuerySchema = z.object({
    query: z.object({
        ...paginationFields,
    }),
});

export type TCreateReviewPayload = z.infer<typeof createReviewSchema>["body"];
export type TReviewQuery = z.infer<typeof reviewQuerySchema>["query"];

export const ReviewValidation = {
    createReviewSchema,
    reviewQuerySchema,
};
