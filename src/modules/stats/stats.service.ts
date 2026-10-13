import { PaymentStatus, Prisma, PropertyStatus, RentalStatus, Role, UserStatus } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";

const countRentalsByStatus = async (where: Prisma.RentalRequestWhereInput) => {
    const groups = await prisma.rentalRequest.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
    });

    const counts: Record<RentalStatus, number> = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        ACTIVE: 0,
        COMPLETED: 0,
        CANCELLED: 0,
    };

    groups.forEach((group) => {
        counts[group.status] = group._count._all;
    });

    return counts;
};

const countPropertiesByStatus = async (where: Prisma.PropertyWhereInput) => {
    const groups = await prisma.property.groupBy({
        by: ["status"],
        where: { ...where, isDeleted: false },
        _count: { _all: true },
    });

    const counts: Record<PropertyStatus, number> = {
        AVAILABLE: 0,
        RENTED: 0,
        UNAVAILABLE: 0,
    };

    groups.forEach((group) => {
        counts[group.status] = group._count._all;
    });

    return counts;
};

const sumCompletedPayments = async (where: Prisma.PaymentWhereInput) => {
    const result = await prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
        _count: { _all: true },
    });

    return {
        count: result._count._all,
        amount: Number(result._sum.amount ?? 0),
    };
};

const sumValues = (counts: Record<string, number>) => {
    return Object.values(counts).reduce((total, count) => total + count, 0);
};

const getTenantStats = async (tenantId: string) => {
    const [rentals, payments, reviews] = await Promise.all([
        countRentalsByStatus({ tenantId }),
        sumCompletedPayments({ userId: tenantId }),
        prisma.review.count({ where: { tenantId } }),
    ]);

    return {
        totalRequests: sumValues(rentals),
        pendingRequests: rentals.PENDING,
        approvedRequests: rentals.APPROVED,
        activeRentals: rentals.ACTIVE,
        completedRentals: rentals.COMPLETED,
        completedPayments: payments.count,
        totalPaid: payments.amount,
        totalReviews: reviews,
    };
};

const getLandlordStats = async (landlordId: string) => {
    const [properties, rentals, payments, reviews] = await Promise.all([
        countPropertiesByStatus({ landlordId }),
        countRentalsByStatus({ property: { landlordId } }),
        sumCompletedPayments({ rentalRequest: { property: { landlordId } } }),
        prisma.review.aggregate({
            where: { property: { landlordId } },
            _avg: { rating: true },
            _count: { _all: true },
        }),
    ]);

    return {
        totalProperties: sumValues(properties),
        availableProperties: properties.AVAILABLE,
        rentedProperties: properties.RENTED,
        pendingRequests: rentals.PENDING,
        approvedRequests: rentals.APPROVED,
        activeRentals: rentals.ACTIVE,
        completedRentals: rentals.COMPLETED,
        totalEarnings: payments.amount,
        totalReviews: reviews._count._all,
        averageRating: reviews._avg.rating === null ? null : Number(reviews._avg.rating.toFixed(1)),
    };
};

const getAdminStats = async () => {
    const [users, bannedUsers, properties, rentals, payments] = await Promise.all([
        prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
        prisma.user.count({ where: { status: UserStatus.BANNED } }),
        countPropertiesByStatus({}),
        countRentalsByStatus({}),
        sumCompletedPayments({}),
    ]);

    const countRole = (role: Role) => users.find((group) => group.role === role)?._count._all ?? 0;

    return {
        totalUsers: users.reduce((total, group) => total + group._count._all, 0),
        totalTenants: countRole(Role.TENANT),
        totalLandlords: countRole(Role.LANDLORD),
        bannedUsers,
        totalProperties: sumValues(properties),
        availableProperties: properties.AVAILABLE,
        rentedProperties: properties.RENTED,
        totalRequests: sumValues(rentals),
        pendingRequests: rentals.PENDING,
        activeRentals: rentals.ACTIVE,
        completedPayments: payments.count,
        totalRevenue: payments.amount,
    };
};

export const StatsService = {
    getTenantStats,
    getLandlordStats,
    getAdminStats,
};
