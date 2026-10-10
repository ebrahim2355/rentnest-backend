import { StatusCodes } from "http-status-codes";
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

export const AuthController = {
    registerUser,
    loginUser,
};
