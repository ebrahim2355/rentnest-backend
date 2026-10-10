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

const createCategory = catchAsync(async (req, res) => {
    const result = await CategoryService.createCategory(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Category created successfully",
        data: result,
    });
});

const updateCategory = catchAsync(async (req, res) => {
    const result = await CategoryService.updateCategory(req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Category updated successfully",
        data: result,
    });
});

const deleteCategory = catchAsync(async (req, res) => {
    await CategoryService.deleteCategory(req.params.id as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Category deleted successfully",
    });
});

export const CategoryController = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
