import { z } from "zod";

export const paginationFields = {
    page: z.coerce.number("page must be a number").int().min(1, "page must be at least 1").optional(),
    limit: z.coerce.number("limit must be a number").int().min(1, "limit must be at least 1").max(100, "limit cannot be more than 100").optional(),
    sortOrder: z.enum(["asc", "desc"], "sortOrder must be asc or desc").optional(),
};

export const idParamSchema = z.object({
    params: z.object({
        id: z.uuid("id must be a valid uuid"),
    }),
});
