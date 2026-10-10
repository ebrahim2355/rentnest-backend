import { z } from "zod";

const createCategorySchema = z.object({
    body: z.object({
        name: z.string("Category name is required").trim().min(2, "Category name must be at least 2 characters").max(50, "Category name is too long"),
        description: z.string("Description must be a string").trim().max(255, "Description is too long").optional(),
    }),
});

const updateCategorySchema = z.object({
    params: z.object({
        id: z.uuid("id must be a valid uuid"),
    }),
    body: z
        .object({
            name: z.string("Category name must be a string").trim().min(2, "Category name must be at least 2 characters").max(50, "Category name is too long").optional(),
            description: z.string("Description must be a string").trim().max(255, "Description is too long").optional(),
        })
        .refine((data) => data.name !== undefined || data.description !== undefined, "Provide name or description to update"),
});

export type TCreateCategoryPayload = z.infer<typeof createCategorySchema>["body"];
export type TUpdateCategoryPayload = z.infer<typeof updateCategorySchema>["body"];

export const CategoryValidation = {
    createCategorySchema,
    updateCategorySchema,
};
