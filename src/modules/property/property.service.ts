import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Prisma, PropertyStatus, RentalStatus, Role } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { IAuthUser } from "../../middlewares/auth";
import { getMeta, getPagination } from "../../utils/pagination";
import { TCreatePropertyPayload, TManagePropertyQuery, TUpdatePropertyPayload } from "./property.validation";

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

const getMyProperties = async (landlordId: string, query: TManagePropertyQuery) => {
    const { page, limit, skip, sortOrder } = getPagination(query);

    const where: Prisma.PropertyWhereInput = {
        landlordId,
        isDeleted: false,
        ...(query.status ? { status: query.status } : {}),
    };

    const [properties, total] = await Promise.all([
        prisma.property.findMany({
            where,
            include: { category: { select: { id: true, name: true } } },
            orderBy: { createdAt: sortOrder },
            skip,
            take: limit,
        }),
        prisma.property.count({ where }),
    ]);

    return {
        meta: getMeta(page, limit, total),
        data: properties,
    };
};

const updateProperty = async (id: string, landlordId: string, payload: TUpdatePropertyPayload) => {
    const property = await prisma.property.findFirst({ where: { id, isDeleted: false } });

    if (!property) {
        throw new AppError(StatusCodes.NOT_FOUND, "Property not found", `No property found with id ${id}`);
    }

    if (property.landlordId !== landlordId) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You can only update your own property");
    }

    if (payload.status && property.status === PropertyStatus.RENTED) {
        throw new AppError(StatusCodes.CONFLICT, "Property is rented", "Status cannot be changed while the property is rented");
    }

    if (payload.categoryId) {
        await checkCategoryExists(payload.categoryId);
    }

    const updatedProperty = await prisma.property.update({
        where: { id },
        data: payload,
        include: propertyInclude,
    });

    return updatedProperty;
};

const deleteProperty = async (id: string, user: IAuthUser) => {
    const property = await prisma.property.findFirst({ where: { id, isDeleted: false } });

    if (!property) {
        throw new AppError(StatusCodes.NOT_FOUND, "Property not found", `No property found with id ${id}`);
    }

    if (user.role === Role.LANDLORD && property.landlordId !== user.id) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You can only remove your own property");
    }

    const runningRentals = await prisma.rentalRequest.count({
        where: {
            propertyId: id,
            status: { in: [RentalStatus.APPROVED, RentalStatus.ACTIVE] },
        },
    });

    if (runningRentals > 0) {
        throw new AppError(StatusCodes.CONFLICT, "Property cannot be removed", "This property has an approved or active rental");
    }

    await prisma.$transaction([
        prisma.property.update({
            where: { id },
            data: { isDeleted: true, status: PropertyStatus.UNAVAILABLE },
        }),
        prisma.rentalRequest.updateMany({
            where: { propertyId: id, status: RentalStatus.PENDING },
            data: { status: RentalStatus.REJECTED },
        }),
    ]);
};

export const PropertyService = {
    createProperty,
    getMyProperties,
    updateProperty,
    deleteProperty,
};
