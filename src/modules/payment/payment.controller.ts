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

const createCheckoutSession = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await PaymentService.createCheckoutSession(user.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Checkout session created successfully",
        data: result,
    });
});

const confirmPayment = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await PaymentService.confirmPayment(user.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Payment completed successfully",
        data: result,
    });
});

const handleWebhook = catchAsync(async (req, res) => {
    const signature = req.headers["stripe-signature"];
    const result = await PaymentService.handleWebhook(req.rawBody, typeof signature === "string" ? signature : undefined);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Webhook received successfully",
        data: result,
    });
});

const getPayments = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await PaymentService.getPayments(user, res.locals.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Payments retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getPaymentById = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await PaymentService.getPaymentById(req.params.id as string, user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Payment retrieved successfully",
        data: result,
    });
});

export const PaymentController = {
    createPayment,
    createCheckoutSession,
    confirmPayment,
    handleWebhook,
    getPayments,
    getPaymentById,
};
