import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import AppError from "../errors/AppError";
import { Role } from "../generated/prisma/client";

export interface ITokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: Role;
}

export const createToken = (payload: Pick<ITokenPayload, "id" | "email" | "role">): string => {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
};

export const verifyToken = (token: string): ITokenPayload => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret);

        if (typeof decoded === "string") {
            throw new Error("Invalid token payload");
        }

        return decoded as ITokenPayload;
    } catch (error) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized", "Token is invalid or expired");
    }
};
