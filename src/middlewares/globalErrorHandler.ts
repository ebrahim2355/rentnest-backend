import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";
import { ZodError } from "zod";
import AppError, { TErrorDetails } from "../errors/AppError";
import { Prisma } from "../generated/prisma/client";

interface IErrorResponse {
    statusCode: number;
    message: string;
    errorDetails: TErrorDetails;
}

const handleZodError = (error: ZodError): IErrorResponse => {
    return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Validation failed",
        errorDetails: error.issues.map((issue) => ({
            field: issue.path.slice(1).join(".") || String(issue.path[0] ?? "request"),
            message: issue.message,
        })),
    };
};

const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): IErrorResponse => {
    if (error.code === "P2002") {
        return {
            statusCode: StatusCodes.CONFLICT,
            message: "Duplicate value",
            errorDetails: "A record with this value already exists",
        };
    }

    if (error.code === "P2025") {
        return {
            statusCode: StatusCodes.NOT_FOUND,
            message: "Record not found",
            errorDetails: "The requested record does not exist",
        };
    }

    if (error.code === "P2003") {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Invalid reference",
            errorDetails: "A related record does not exist",
        };
    }

    return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Database request failed",
        errorDetails: `Database error code ${error.code}`,
    };
};

const handleStripeError = (error: Stripe.errors.StripeError): IErrorResponse => {
    let statusCode: number = StatusCodes.BAD_GATEWAY;

    if (error.type === "StripeCardError") {
        statusCode = StatusCodes.PAYMENT_REQUIRED;
    } else if (error.type === "StripeInvalidRequestError") {
        statusCode = StatusCodes.BAD_REQUEST;
    }

    return {
        statusCode,
        message: "Payment provider error",
        errorDetails: error.message,
    };
};

const globalErrorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    let response: IErrorResponse = {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "Something went wrong",
        errorDetails: "Internal server error",
    };

    if (error instanceof AppError) {
        response = {
            statusCode: error.statusCode,
            message: error.message,
            errorDetails: error.errorDetails,
        };
    } else if (error instanceof ZodError) {
        response = handleZodError(error);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        response = handlePrismaError(error);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        response = {
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Invalid data",
            errorDetails: "The provided data does not match the expected format",
        };
    } else if (error instanceof Stripe.errors.StripeError) {
        response = handleStripeError(error);
    } else if (error instanceof SyntaxError && "status" in error && error.status === StatusCodes.BAD_REQUEST) {
        response = {
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Invalid request body",
            errorDetails: "Request body must be valid JSON",
        };
    } else if (error instanceof Error) {
        console.error(error);
        response.errorDetails = error.message;
    }

    res.status(response.statusCode).json({
        success: false,
        message: response.message,
        errorDetails: response.errorDetails,
    });
};

export default globalErrorHandler;
