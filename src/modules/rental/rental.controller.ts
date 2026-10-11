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

export const RentalController = {
    createRentalRequest,
};
