import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PropertyService } from "./property.service";

const createProperty = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await PropertyService.createProperty(user.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Property created successfully",
        data: result,
    });
});

export const PropertyController = {
    createProperty,
};
