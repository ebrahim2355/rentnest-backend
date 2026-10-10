import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import config from "../../config";
import AppError from "../../errors/AppError";
import { UserStatus } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { createToken } from "../../utils/jwt";
import { TLoginPayload, TRegisterPayload } from "./auth.validation";

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

const loginUser = async (payload: TLoginPayload) => {
    const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });

    if (!user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials", "Email or password is incorrect");
    }

    const { password, ...userWithoutPassword } = user;
    const isPasswordMatched = await bcrypt.compare(payload.password, password);

    if (!isPasswordMatched) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials", "Email or password is incorrect");
    }

    if (user.status === UserStatus.BANNED) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account is banned", "Please contact the admin");
    }

    const accessToken = createToken({ id: user.id, email: user.email, role: user.role });

    return {
        accessToken,
        user: userWithoutPassword,
    };
};

const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        omit: { password: true },
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found", "No user found for this token");
    }

    return user;
};

export const AuthService = {
    registerUser,
    loginUser,
    getMe,
};
