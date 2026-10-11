import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReviewService } from "./review.service";

const createReview = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await ReviewService.createReview(user.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Review created successfully",
        data: result,
    });
});

const getLandlordReviews = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await ReviewService.getLandlordReviews(user.id, res.locals.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Reviews retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

export const ReviewController = {
    createReview,
    getLandlordReviews,
};
