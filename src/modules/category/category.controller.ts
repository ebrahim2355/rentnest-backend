import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CategoryService } from "./category.service";

const getAllCategories = catchAsync(async (req, res) => {
    const result = await CategoryService.getAllCategories();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Categories retrieved successfully",
        data: result,
    });
});

export const CategoryController = {
    getAllCategories,
};
