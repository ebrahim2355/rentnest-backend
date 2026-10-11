import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Prisma, Role } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { getMeta, getPagination } from "../../utils/pagination";
import { TUpdateUserStatusPayload, TUserQuery } from "./admin.validation";

const getAllUsers = async (query: TUserQuery) => {
    const { page, limit, skip, sortOrder } = getPagination(query);
    const filters: Prisma.UserWhereInput[] = [];

    if (query.searchTerm) {
        filters.push({
            OR: [
                { name: { contains: query.searchTerm, mode: "insensitive" } },
                { email: { contains: query.searchTerm, mode: "insensitive" } },
            ],
        });
    }

    if (query.role) {
        filters.push({ role: query.role });
    }

    if (query.status) {
        filters.push({ status: query.status });
    }

    const where: Prisma.UserWhereInput = { AND: filters };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            omit: { password: true },
            orderBy: { createdAt: sortOrder },
            skip,
            take: limit,
        }),
        prisma.user.count({ where }),
    ]);

    return {
        meta: getMeta(page, limit, total),
        data: users,
    };
};

const updateUserStatus = async (id: string, adminId: string, payload: TUpdateUserStatusPayload) => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found", `No user found with id ${id}`);
    }

    if (user.id === adminId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid action", "You cannot change your own status");
    }

    if (user.role === Role.ADMIN) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "An admin account cannot be banned");
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { status: payload.status },
        omit: { password: true },
    });

    return updatedUser;
};

export const AdminService = {
    getAllUsers,
    updateUserStatus,
};
