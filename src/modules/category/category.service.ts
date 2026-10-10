import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";
import { TCreateCategoryPayload, TUpdateCategoryPayload } from "./category.validation";

const findCategoryByName = async (name: string) => {
    return prisma.category.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
    });
};

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

const createCategory = async (payload: TCreateCategoryPayload) => {
    const existingCategory = await findCategoryByName(payload.name);

    if (existingCategory) {
        throw new AppError(StatusCodes.CONFLICT, "Category already exists", `A category named ${existingCategory.name} already exists`);
    }

    const category = await prisma.category.create({
        data: {
            name: payload.name,
            description: payload.description ?? null,
        },
    });

    return category;
};

const updateCategory = async (id: string, payload: TUpdateCategoryPayload) => {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category not found", `No category found with id ${id}`);
    }

    if (payload.name) {
        const existingCategory = await findCategoryByName(payload.name);

        if (existingCategory && existingCategory.id !== id) {
            throw new AppError(StatusCodes.CONFLICT, "Category already exists", `A category named ${existingCategory.name} already exists`);
        }
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data: payload,
    });

    return updatedCategory;
};

const deleteCategory = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { properties: true } } },
    });

    if (!category) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category not found", `No category found with id ${id}`);
    }

    if (category._count.properties > 0) {
        throw new AppError(StatusCodes.CONFLICT, "Category is in use", "This category has properties, so it cannot be deleted");
    }

    await prisma.category.delete({ where: { id } });
};

export const CategoryService = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
