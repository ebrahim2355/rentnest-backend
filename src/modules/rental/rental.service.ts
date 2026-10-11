import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Prisma, PropertyStatus, RentalStatus, Role } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { IAuthUser } from "../../middlewares/auth";
import { getMeta, getPagination } from "../../utils/pagination";
import { TCreateRentalPayload } from "./rental.validation";

const rentalInclude = {
    property: {
        select: { id: true, title: true, location: true, address: true, rent: true, status: true, landlordId: true },
    },
    tenant: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.RentalRequestInclude;

const createRentalRequest = async (tenantId: string, payload: TCreateRentalPayload) => {
    const property = await prisma.property.findFirst({
        where: { id: payload.propertyId, isDeleted: false },
    });

    if (!property) {
        throw new AppError(StatusCodes.NOT_FOUND, "Property not found", `No property found with id ${payload.propertyId}`);
    }

    if (property.status !== PropertyStatus.AVAILABLE) {
        throw new AppError(StatusCodes.CONFLICT, "Property is not available", `This property is currently ${property.status}`);
    }

    const existingRequest = await prisma.rentalRequest.findFirst({
        where: {
            tenantId,
            propertyId: property.id,
            status: { in: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.ACTIVE] },
        },
    });

    if (existingRequest) {
        throw new AppError(StatusCodes.CONFLICT, "Rental request already exists", `You already have a ${existingRequest.status} request for this property`);
    }

    const rentalRequest = await prisma.rentalRequest.create({
        data: {
            propertyId: property.id,
            tenantId,
            moveInDate: payload.moveInDate,
            durationMonths: payload.durationMonths,
            totalAmount: property.rent.mul(payload.durationMonths),
            message: payload.message ?? null,
        },
        include: rentalInclude,
    });

    return rentalRequest;
};

export const RentalService = {
    createRentalRequest,
};
