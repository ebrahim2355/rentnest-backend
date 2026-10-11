import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

const createPayment = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await PaymentService.createPayment(user.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Payment created successfully",
        data: result,
    });
});

export const PaymentController = {
    createPayment,
};
