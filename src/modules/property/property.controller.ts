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

const getMyProperties = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await PropertyService.getMyProperties(user.id, res.locals.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Your properties retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const updateProperty = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    const result = await PropertyService.updateProperty(req.params.id as string, user.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Property updated successfully",
        data: result,
    });
});

const deleteProperty = catchAsync(async (req, res) => {
    const user = req.user as IAuthUser;
    await PropertyService.deleteProperty(req.params.id as string, user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Property removed successfully",
    });
});

const getAllProperties = catchAsync(async (req, res) => {
    const result = await PropertyService.getAllProperties(res.locals.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Properties retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getPropertyById = catchAsync(async (req, res) => {
    const result = await PropertyService.getPropertyById(req.params.id as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Property retrieved successfully",
        data: result,
    });
});

export const PropertyController = {
    createProperty,
    getMyProperties,
    updateProperty,
    deleteProperty,
    getAllProperties,
    getPropertyById,
};
