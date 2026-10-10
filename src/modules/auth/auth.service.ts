import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import config from "../../config";
import AppError from "../../errors/AppError";
import { UserStatus } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { TRegisterPayload } from "./auth.validation";

const registerUser = async (payload: TRegisterPayload) => {
    const email = payload.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        throw new AppError(StatusCodes.CONFLICT, "User already exists", "This email is already registered");
    }

    const hashedPassword = await bcrypt.hash(payload.password, config.saltRounds);

    const user = await prisma.user.create({
        data: {
            name: payload.name,
            email,
            password: hashedPassword,
            role: payload.role,
            phone: payload.phone ?? null,
        },
        omit: { password: true },
    });

    return user;
};

export const AuthService = {
    registerUser,
};
