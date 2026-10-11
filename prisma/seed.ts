import bcrypt from "bcrypt";
import config from "../src/config";
import { Role } from "../src/generated/prisma/client";
import prisma from "../src/lib/prisma";

const categories = [
    { name: "Apartment", description: "Flats in a multi-unit building" },
    { name: "House", description: "Independent family houses" },
    { name: "Studio", description: "Single room units for one or two people" },
    { name: "Duplex", description: "Two-floor units with more space" },
    { name: "Shared Room", description: "Rooms shared with other tenants" },
];

const demoUsers = [
    { name: "Demo Landlord", email: "landlord@rentnest.com", password: "landlord123", role: Role.LANDLORD, phone: "+8801700000001" },
    { name: "Demo Tenant", email: "tenant@rentnest.com", password: "tenant123", role: Role.TENANT, phone: "+8801700000002" },
];

const demoProperties = [
    {
        title: "Sunny 2 bedroom apartment in Dhanmondi",
        description: "A bright apartment near the lake with a balcony, lift and generator backup.",
        location: "Dhanmondi, Dhaka",
        address: "House 12, Road 5, Dhanmondi",
        rent: 450,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ["wifi", "lift", "parking", "generator"],
        category: "Apartment",
    },
    {
        title: "Family house with garden in Uttara",
        description: "A quiet four bedroom house with a small garden and a garage in sector 7.",
        location: "Uttara, Dhaka",
        address: "House 44, Road 9, Sector 7, Uttara",
        rent: 900,
        bedrooms: 4,
        bathrooms: 3,
        amenities: ["parking", "garden", "security"],
        category: "House",
    },
    {
        title: "Furnished studio near Banani 11",
        description: "A compact furnished studio that is a good fit for a student or a single professional.",
        location: "Banani, Dhaka",
        address: "Flat 3B, House 27, Road 11, Banani",
        rent: 300,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ["wifi", "furnished", "air conditioning"],
        category: "Studio",
    },
    {
        title: "Modern duplex in Gulshan 2",
        description: "A spacious duplex with a rooftop terrace, gym access and round the clock security.",
        location: "Gulshan, Dhaka",
        address: "House 8, Road 71, Gulshan 2",
        rent: 1500,
        bedrooms: 3,
        bathrooms: 4,
        amenities: ["wifi", "gym", "parking", "security", "lift"],
        category: "Duplex",
    },
];

const seedAdmin = async () => {
    const password = await bcrypt.hash(config.admin.password, config.saltRounds);

    await prisma.user.upsert({
        where: { email: config.admin.email },
        update: { password, role: Role.ADMIN },
        create: {
            name: config.admin.name,
            email: config.admin.email,
            password,
            role: Role.ADMIN,
        },
    });

    console.log(`Admin is ready: ${config.admin.email}`);
};

const seedCategories = async () => {
    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: { description: category.description },
            create: category,
        });
    }

    console.log(`${categories.length} categories are ready`);
};

const seedDemoUsers = async () => {
    for (const user of demoUsers) {
        const password = await bcrypt.hash(user.password, config.saltRounds);

        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: { ...user, password },
        });
    }

    console.log(`${demoUsers.length} demo users are ready`);
};

const seedDemoProperties = async () => {
    const landlord = await prisma.user.findUniqueOrThrow({ where: { email: "landlord@rentnest.com" } });
    const existingProperties = await prisma.property.count({ where: { landlordId: landlord.id } });

    if (existingProperties > 0) {
        console.log("Demo properties already exist");
        return;
    }

    for (const property of demoProperties) {
        const { category: categoryName, ...propertyData } = property;
        const category = await prisma.category.findUniqueOrThrow({ where: { name: categoryName } });

        await prisma.property.create({
            data: {
                ...propertyData,
                landlordId: landlord.id,
                categoryId: category.id,
            },
        });
    }

    console.log(`${demoProperties.length} demo properties are ready`);
};

const main = async () => {
    await seedAdmin();
    await seedCategories();
    await seedDemoUsers();
    await seedDemoProperties();
};

main()
    .catch((error) => {
        console.error("Seeding failed", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
