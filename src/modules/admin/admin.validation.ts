import { z } from "zod";
import { paginationFields } from "../../validations/common.validation";

const userQuerySchema = z.object({
    query: z.object({
        searchTerm: z.string().trim().optional(),
        role: z.enum(["TENANT", "LANDLORD", "ADMIN"], "Role must be TENANT, LANDLORD or ADMIN").optional(),
        status: z.enum(["ACTIVE", "BANNED"], "Status must be ACTIVE or BANNED").optional(),
        ...paginationFields,
    }),
});

const updateUserStatusSchema = z.object({
    params: z.object({
        id: z.uuid("id must be a valid uuid"),
    }),
    body: z.object({
        status: z.enum(["ACTIVE", "BANNED"], "Status must be ACTIVE or BANNED"),
    }),
});

export type TUserQuery = z.infer<typeof userQuerySchema>["query"];
export type TUpdateUserStatusPayload = z.infer<typeof updateUserStatusSchema>["body"];

export const AdminValidation = {
    userQuerySchema,
    updateUserStatusSchema,
};
