export interface IErrorDetail {
    field: string;
    message: string;
}

export type TErrorDetails = string | IErrorDetail[];

class AppError extends Error {
    statusCode: number;
    errorDetails: TErrorDetails;

    constructor(statusCode: number, message: string, errorDetails?: TErrorDetails) {
        super(message);
        this.statusCode = statusCode;
        this.errorDetails = errorDetails ?? message;
    }
}

export default AppError;
