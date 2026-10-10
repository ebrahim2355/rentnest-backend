import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Prisma, PropertyStatus, RentalStatus, Role } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { IAuthUser } from "../../middlewares/auth";
import { TCreatePropertyPayload } from "./property.validation";

const propertyInclude = {
    category: { select: { id: true, name: true } },
    landlord: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.PropertyInclude;

const checkCategoryExists = async (categoryId: string) => {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!category) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category not found", `No category found with id ${categoryId}`);
    }
};

const createProperty = async (landlordId: string, payload: TCreatePropertyPayload) => {
    await checkCategoryExists(payload.categoryId);

    const property = await prisma.property.create({
        data: {
            ...payload,
            landlordId,
        },
        include: propertyInclude,
    });

    return property;
};

export const PropertyService = {
    createProperty,
};
