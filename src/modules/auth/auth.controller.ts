import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

const registerUser = catchAsync(async (req, res) => {
    const result = await AuthService.registerUser(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "User registered successfully",
        data: result,
    });
});

const loginUser = catchAsync(async (req, res) => {
    const result = await AuthService.loginUser(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Login successful",
        data: result,
    });
});

const getMe = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await AuthService.getMe(user.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Profile retrieved successfully",
        data: result,
    });
});

const updateProfile = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await AuthService.updateProfile(user.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Profile updated successfully",
        data: result,
    });
});

export const AuthController = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
};
