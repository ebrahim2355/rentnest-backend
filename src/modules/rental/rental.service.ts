import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Prisma, PropertyStatus, RentalStatus, Role } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { IAuthUser } from "../../middlewares/auth";
import { getMeta, getPagination } from "../../utils/pagination";
import { TCreateRentalPayload, TRentalQuery, TUpdateRentalStatusPayload } from "./rental.validation";

const rentalInclude = {
    property: {
        select: { id: true, title: true, location: true, address: true, rent: true, images: true, status: true, landlordId: true },
    },
    tenant: { select: { id: true, name: true, email: true, phone: true } },
    review: { select: { id: true, rating: true, comment: true } },
} satisfies Prisma.RentalRequestInclude;

const getRentalList = async (where: Prisma.RentalRequestWhereInput, query: TRentalQuery) => {
    const { page, limit, skip, sortOrder } = getPagination(query);
    const filters: Prisma.RentalRequestWhereInput = query.status ? { ...where, status: query.status } : where;

    const [rentalRequests, total] = await Promise.all([
        prisma.rentalRequest.findMany({
            where: filters,
            include: rentalInclude,
            orderBy: { createdAt: sortOrder },
            skip,
            take: limit,
        }),
        prisma.rentalRequest.count({ where: filters }),
    ]);

    return {
        meta: getMeta(page, limit, total),
        data: rentalRequests,
    };
};

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

const getMyRentalRequests = async (tenantId: string, query: TRentalQuery) => {
    return getRentalList({ tenantId }, query);
};

const getRentalRequestById = async (id: string, user: IAuthUser) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { id },
        include: {
            ...rentalInclude,
            payments: {
                orderBy: { createdAt: "desc" },
                select: { id: true, transactionId: true, amount: true, status: true, paidAt: true },
            },
        },
    });

    if (!rentalRequest) {
        throw new AppError(StatusCodes.NOT_FOUND, "Rental request not found", `No rental request found with id ${id}`);
    }

    const isTenant = rentalRequest.tenantId === user.id;
    const isLandlord = rentalRequest.property.landlordId === user.id;

    if (user.role !== Role.ADMIN && !isTenant && !isLandlord) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You cannot view this rental request");
    }

    return rentalRequest;
};

const cancelRentalRequest = async (id: string, tenantId: string) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({ where: { id } });

    if (!rentalRequest) {
        throw new AppError(StatusCodes.NOT_FOUND, "Rental request not found", `No rental request found with id ${id}`);
    }

    if (rentalRequest.tenantId !== tenantId) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You can only cancel your own rental request");
    }

    if (rentalRequest.status !== RentalStatus.PENDING && rentalRequest.status !== RentalStatus.APPROVED) {
        throw new AppError(StatusCodes.CONFLICT, "Rental request cannot be cancelled", `A ${rentalRequest.status} request cannot be cancelled`);
    }

    const cancelledRequest = await prisma.rentalRequest.update({
        where: { id },
        data: { status: RentalStatus.CANCELLED },
        include: rentalInclude,
    });

    return cancelledRequest;
};

const getLandlordRequests = async (landlordId: string, query: TRentalQuery) => {
    return getRentalList({ property: { landlordId } }, query);
};

const allowedStatusChanges: Partial<Record<RentalStatus, RentalStatus[]>> = {
    PENDING: [RentalStatus.APPROVED, RentalStatus.REJECTED],
    ACTIVE: [RentalStatus.COMPLETED],
};

const updateRequestStatus = async (id: string, landlordId: string, payload: TUpdateRentalStatusPayload) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { id },
        include: { property: true },
    });

    if (!rentalRequest) {
        throw new AppError(StatusCodes.NOT_FOUND, "Rental request not found", `No rental request found with id ${id}`);
    }

    if (rentalRequest.property.landlordId !== landlordId) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You can only manage requests of your own properties");
    }

    const allowedStatuses = allowedStatusChanges[rentalRequest.status] ?? [];

    if (!allowedStatuses.includes(payload.status)) {
        throw new AppError(StatusCodes.CONFLICT, "Invalid status change", `A ${rentalRequest.status} request cannot be changed to ${payload.status}`);
    }

    if (payload.status === RentalStatus.APPROVED && rentalRequest.property.status !== PropertyStatus.AVAILABLE) {
        throw new AppError(StatusCodes.CONFLICT, "Property is not available", `This property is currently ${rentalRequest.property.status}`);
    }

    if (payload.status === RentalStatus.COMPLETED) {
        const [, completedRequest] = await prisma.$transaction([
            prisma.property.update({
                where: { id: rentalRequest.propertyId },
                data: { status: PropertyStatus.AVAILABLE },
            }),
            prisma.rentalRequest.update({
                where: { id },
                data: { status: RentalStatus.COMPLETED },
                include: rentalInclude,
            }),
        ]);

        return completedRequest;
    }

    const updatedRequest = await prisma.rentalRequest.update({
        where: { id },
        data: { status: payload.status },
        include: rentalInclude,
    });

    return updatedRequest;
};

const getAllRentalRequests = async (query: TRentalQuery) => {
    return getRentalList({}, query);
};

export const RentalService = {
    createRentalRequest,
    getMyRentalRequests,
    getRentalRequestById,
    cancelRentalRequest,
    getLandlordRequests,
    updateRequestStatus,
    getAllRentalRequests,
};
