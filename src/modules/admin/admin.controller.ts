import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

const getAllUsers = catchAsync(async (req, res) => {
    const result = await AdminService.getAllUsers(res.locals.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Users retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const updateUserStatus = catchAsync(async (req, res) => {
    const admin = req.user as IAuthUser;
    const result = await AdminService.updateUserStatus(req.params.id as string, admin.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: `User status changed to ${result.status}`,
        data: result,
    });
});

export const AdminController = {
    getAllUsers,
    updateUserStatus,
};
