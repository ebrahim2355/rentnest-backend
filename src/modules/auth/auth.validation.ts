import { z } from "zod";

const registerSchema = z.object({
    body: z.object({
        name: z.string("Name is required").trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
        email: z.email("A valid email is required"),
        password: z.string("Password is required").min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
        role: z.enum(["TENANT", "LANDLORD"], "Role must be TENANT or LANDLORD").default("TENANT"),
        phone: z.string("Phone must be a string").trim().min(6, "Phone number is too short").max(20, "Phone number is too long").optional(),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.email("A valid email is required"),
        password: z.string("Password is required").min(1, "Password is required"),
    }),
});

const updateProfileSchema = z.object({
    body: z
        .object({
            name: z.string("Name must be a string").trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long").optional(),
            phone: z.string("Phone must be a string").trim().min(6, "Phone number is too short").max(20, "Phone number is too long").optional(),
        })
        .refine((data) => data.name !== undefined || data.phone !== undefined, "Provide name or phone to update"),
});

export type TRegisterPayload = z.infer<typeof registerSchema>["body"];
export type TLoginPayload = z.infer<typeof loginSchema>["body"];
export type TUpdateProfilePayload = z.infer<typeof updateProfileSchema>["body"];

export const AuthValidation = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
};
