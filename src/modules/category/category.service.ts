import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";

const getAllCategories = async () => {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { properties: { where: { isDeleted: false } } },
            },
        },
    });

    return categories;
};

export const CategoryService = {
    getAllCategories,
};
