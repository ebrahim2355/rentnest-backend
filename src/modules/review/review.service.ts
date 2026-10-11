import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Prisma, RentalStatus } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { getMeta, getPagination } from "../../utils/pagination";
import { TCreateReviewPayload, TReviewQuery } from "./review.validation";

const reviewInclude = {
    property: { select: { id: true, title: true, location: true } },
    tenant: { select: { id: true, name: true } },
} satisfies Prisma.ReviewInclude;

const createReview = async (tenantId: string, payload: TCreateReviewPayload) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { id: payload.rentalRequestId },
        include: { review: true },
    });

    if (!rentalRequest) {
        throw new AppError(StatusCodes.NOT_FOUND, "Rental request not found", `No rental request found with id ${payload.rentalRequestId}`);
    }

    if (rentalRequest.tenantId !== tenantId) {
        throw new AppError(StatusCodes.FORBIDDEN, "Forbidden access", "You can only review your own rental");
    }

    if (rentalRequest.status !== RentalStatus.COMPLETED) {
        throw new AppError(StatusCodes.CONFLICT, "Review is not allowed", "You can leave a review only after the rental is completed");
    }

    if (rentalRequest.review) {
        throw new AppError(StatusCodes.CONFLICT, "Review already exists", "You have already reviewed this rental");
    }

    const review = await prisma.review.create({
        data: {
            rating: payload.rating,
            comment: payload.comment,
            propertyId: rentalRequest.propertyId,
            tenantId,
            rentalRequestId: rentalRequest.id,
        },
        include: reviewInclude,
    });

    return review;
};

const getLandlordReviews = async (landlordId: string, query: TReviewQuery) => {
    const { page, limit, skip, sortOrder } = getPagination(query);
    const where: Prisma.ReviewWhereInput = { property: { landlordId } };

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            include: reviewInclude,
            orderBy: { createdAt: sortOrder },
            skip,
            take: limit,
        }),
        prisma.review.count({ where }),
    ]);

    return {
        meta: getMeta(page, limit, total),
        data: reviews,
    };
};

export const ReviewService = {
    createReview,
    getLandlordReviews,
};
