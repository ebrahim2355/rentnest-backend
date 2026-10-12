import bcrypt from "bcrypt";
import config from "../src/config";
import { Role } from "../src/generated/prisma/client";
import prisma from "../src/lib/prisma";

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

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
        images: [photo("1522708323590-d24dbb6b0267"), photo("1560448204-e02f11c3d0e2"), photo("1484154218962-a197022b5858")],
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
        images: [photo("1568605114967-8130f3a36994"), photo("1600585154340-be6161a56a0c"), photo("1600566753190-17f0baa2a6c3")],
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
        images: [photo("1502005229762-cf1b2da7c5d6"), photo("1536376072261-38c75010e6c9"), photo("1505691938895-1758d7feb511")],
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
        images: [photo("1600596542815-ffad4c1539a9"), photo("1600607687939-ce8a6c25118c"), photo("1554995207-c18c203602cb")],
        category: "Duplex",
    },
    {
        title: "Lake view apartment in Bashundhara",
        description: "A three bedroom apartment on the ninth floor with an open lake view and two balconies.",
        location: "Bashundhara, Dhaka",
        address: "Block D, Road 3, Bashundhara R/A",
        rent: 650,
        bedrooms: 3,
        bathrooms: 3,
        amenities: ["wifi", "lift", "parking", "security", "generator"],
        images: [photo("1502672260266-1c1ef2d93688"), photo("1493809842364-78817add7ffb"), photo("1586023492125-27b2c045efd7")],
        category: "Apartment",
    },
    {
        title: "Shared room for students near Mirpur 10",
        description: "A clean shared room for two people, five minutes walk from the metro station.",
        location: "Mirpur, Dhaka",
        address: "House 21, Road 4, Mirpur 10",
        rent: 120,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ["wifi", "furnished"],
        images: [photo("1522771739844-6a9f6d5f14af"), photo("1505691938895-1758d7feb511")],
        category: "Shared Room",
    },
    {
        title: "Hillside family house in Sylhet",
        description: "A peaceful three bedroom house beside the tea gardens with a wide front yard.",
        location: "Sylhet",
        address: "Shahi Eidgah Road, Sylhet",
        rent: 700,
        bedrooms: 3,
        bathrooms: 2,
        amenities: ["parking", "garden"],
        images: [photo("1564013799919-ab600027ffc6"), photo("1570129477492-45c003edd2be")],
        category: "House",
    },
    {
        title: "Sea breeze villa in Cox's Bazar",
        description: "A large five bedroom villa close to the beach, with a private pool and a rooftop.",
        location: "Cox's Bazar",
        address: "Marine Drive Road, Kolatoli, Cox's Bazar",
        rent: 1800,
        bedrooms: 5,
        bathrooms: 5,
        amenities: ["wifi", "parking", "pool", "security", "air conditioning"],
        images: [photo("1613490493576-7fde63acd811"), photo("1600047509807-ba8f99d2cdde"), photo("1512917774080-9991f1c4c750")],
        category: "House",
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

    for (const property of demoProperties) {
        const { category: categoryName, ...propertyData } = property;
        const category = await prisma.category.findUniqueOrThrow({ where: { name: categoryName } });
        const existingProperty = await prisma.property.findFirst({
            where: { landlordId: landlord.id, title: property.title },
        });

        if (existingProperty) {
            await prisma.property.update({
                where: { id: existingProperty.id },
                data: { images: property.images },
            });
        } else {
            await prisma.property.create({
                data: {
                    ...propertyData,
                    landlordId: landlord.id,
                    categoryId: category.id,
                },
            });
        }
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
