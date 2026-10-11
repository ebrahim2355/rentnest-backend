import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { RentalService } from "./rental.service";

const createRentalRequest = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await RentalService.createRentalRequest(user.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Rental request submitted successfully",
        data: result,
    });
});

const getMyRentalRequests = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await RentalService.getMyRentalRequests(user.id, res.locals.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Rental requests retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getRentalRequestById = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await RentalService.getRentalRequestById(req.params.id as string, user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Rental request retrieved successfully",
        data: result,
    });
});

const cancelRentalRequest = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await RentalService.cancelRentalRequest(req.params.id as string, user.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Rental request cancelled successfully",
        data: result,
    });
});

export const RentalController = {
    createRentalRequest,
    getMyRentalRequests,
    getRentalRequestById,
    cancelRentalRequest,
};
