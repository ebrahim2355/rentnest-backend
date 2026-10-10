import { z } from "zod";
import { paginationFields } from "../../validations/common.validation";

const propertyFields = {
    title: z.string("Title is required").trim().min(5, "Title must be at least 5 characters").max(150, "Title cannot be more than 150 characters"),
    description: z.string("Description is required").trim().min(20, "Description must be at least 20 characters"),
    location: z.string("Location is required").trim().min(2, "Location must be at least 2 characters").max(100, "Location is too long"),
    address: z.string("Address is required").trim().min(5, "Address must be at least 5 characters").max(255, "Address is too long"),
    rent: z.number("Rent must be a number").positive("Rent must be greater than 0").max(99999999, "Rent is too high"),
    bedrooms: z.number("Bedrooms must be a number").int("Bedrooms must be a whole number").min(0, "Bedrooms cannot be negative").max(50, "Bedrooms is too high"),
    bathrooms: z.number("Bathrooms must be a number").int("Bathrooms must be a whole number").min(0, "Bathrooms cannot be negative").max(50, "Bathrooms is too high"),
    amenities: z.array(z.string("Amenity must be a string").trim().min(1, "Amenity cannot be empty"), "Amenities must be a list").max(30, "Too many amenities"),
    categoryId: z.uuid("categoryId must be a valid uuid"),
};

const createPropertySchema = z.object({
    body: z.object({
        ...propertyFields,
        amenities: propertyFields.amenities.default([]),
    }),
});

const updatePropertySchema = z.object({
    params: z.object({
        id: z.uuid("id must be a valid uuid"),
    }),
    body: z
        .object({
            title: propertyFields.title.optional(),
            description: propertyFields.description.optional(),
            location: propertyFields.location.optional(),
            address: propertyFields.address.optional(),
            rent: propertyFields.rent.optional(),
            bedrooms: propertyFields.bedrooms.optional(),
            bathrooms: propertyFields.bathrooms.optional(),
            amenities: propertyFields.amenities.optional(),
            categoryId: propertyFields.categoryId.optional(),
            status: z.enum(["AVAILABLE", "UNAVAILABLE"], "Status must be AVAILABLE or UNAVAILABLE").optional(),
        })
        .refine((data) => Object.values(data).some((value) => value !== undefined), "Provide at least one field to update"),
});

const managePropertyQuerySchema = z.object({
    query: z.object({
        status: z.enum(["AVAILABLE", "RENTED", "UNAVAILABLE"], "Status must be AVAILABLE, RENTED or UNAVAILABLE").optional(),
        ...paginationFields,
    }),
});

export type TCreatePropertyPayload = z.infer<typeof createPropertySchema>["body"];
export type TUpdatePropertyPayload = z.infer<typeof updatePropertySchema>["body"];
export type TManagePropertyQuery = z.infer<typeof managePropertyQuerySchema>["query"];

export const PropertyValidation = {
    createPropertySchema,
    updatePropertySchema,
    managePropertyQuerySchema,
};
