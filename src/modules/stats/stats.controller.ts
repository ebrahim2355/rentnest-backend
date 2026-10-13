import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatsService } from "./stats.service";

const getTenantStats = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await StatsService.getTenantStats(user.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Tenant stats retrieved successfully",
        data: result,
    });
});

const getLandlordStats = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await StatsService.getLandlordStats(user.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Landlord stats retrieved successfully",
        data: result,
    });
});

const getAdminStats = catchAsync(async (req, res) => {
    const result = await StatsService.getAdminStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Platform stats retrieved successfully",
        data: result,
    });
});

export const StatsController = {
    getTenantStats,
    getLandlordStats,
    getAdminStats,
};
