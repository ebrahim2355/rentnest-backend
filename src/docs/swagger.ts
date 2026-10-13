type TMethod = "get" | "post" | "put" | "patch" | "delete";

export interface IEndpointDoc {
    method: TMethod;
    path: string;
    tag: string;
    summary: string;
    access: "Public" | "Any logged in user" | "Tenant" | "Landlord" | "Admin" | "Stripe";
    query?: string[];
    body?: Record<string, unknown>;
    successStatus?: number;
}

const uuid = "3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const pagination = ["page", "limit", "sortOrder"];

export const endpoints: IEndpointDoc[] = [
    {
        method: "post",
        path: "/auth/register",
        tag: "Auth",
        summary: "Register a new tenant or landlord",
        access: "Public",
        body: { name: "Rahim Uddin", email: "rahim@example.com", password: "secret123", role: "TENANT", phone: "+8801700000000" },
        successStatus: 201,
    },
    {
        method: "post",
        path: "/auth/login",
        tag: "Auth",
        summary: "Login and get a JWT access token",
        access: "Public",
        body: { email: "rahim@example.com", password: "secret123" },
    },
    { method: "get", path: "/auth/me", tag: "Auth", summary: "Get the logged in user", access: "Any logged in user" },
    {
        method: "patch",
        path: "/auth/me",
        tag: "Auth",
        summary: "Update own profile",
        access: "Any logged in user",
        body: { name: "Rahim Uddin", phone: "+8801711111111" },
    },
    { method: "get", path: "/categories", tag: "Categories", summary: "Get all property categories", access: "Public" },
    {
        method: "get",
        path: "/properties",
        tag: "Properties",
        summary: "Get available properties with search, filters, sorting and pagination",
        access: "Public",
        query: ["searchTerm", "location", "type", "categoryId", "minPrice", "maxPrice", "bedrooms", "amenities", "sortBy", ...pagination],
    },
    { method: "get", path: "/properties/{id}", tag: "Properties", summary: "Get property details with reviews", access: "Public" },
    {
        method: "post",
        path: "/landlord/properties",
        tag: "Landlord",
        summary: "Create a property listing",
        access: "Landlord",
        body: {
            title: "Sunny 2 bedroom apartment in Dhanmondi",
            description: "A bright apartment near the lake with a balcony and lift.",
            location: "Dhanmondi, Dhaka",
            address: "House 12, Road 5, Dhanmondi",
            rent: 450,
            bedrooms: 2,
            bathrooms: 2,
            amenities: ["wifi", "lift", "parking"],
            images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"],
            categoryId: uuid,
        },
        successStatus: 201,
    },
    {
        method: "get",
        path: "/landlord/properties",
        tag: "Landlord",
        summary: "Get own property listings",
        access: "Landlord",
        query: ["status", ...pagination],
    },
    {
        method: "put",
        path: "/landlord/properties/{id}",
        tag: "Landlord",
        summary: "Update own property or its availability status",
        access: "Landlord",
        body: { rent: 480, status: "UNAVAILABLE" },
    },
    { method: "delete", path: "/landlord/properties/{id}", tag: "Landlord", summary: "Remove own property listing", access: "Landlord" },
    {
        method: "get",
        path: "/landlord/requests",
        tag: "Landlord",
        summary: "Get rental requests for own properties",
        access: "Landlord",
        query: ["status", ...pagination],
    },
    {
        method: "patch",
        path: "/landlord/requests/{id}",
        tag: "Landlord",
        summary: "Approve, reject or complete a rental request",
        access: "Landlord",
        body: { status: "APPROVED" },
    },
    {
        method: "get",
        path: "/landlord/reviews",
        tag: "Landlord",
        summary: "Get tenant reviews of own properties",
        access: "Landlord",
        query: pagination,
    },
    { method: "get", path: "/landlord/stats", tag: "Landlord", summary: "Get dashboard numbers for own properties, requests and earnings", access: "Landlord" },
    {
        method: "post",
        path: "/rentals",
        tag: "Rental Requests",
        summary: "Submit a rental request",
        access: "Tenant",
        body: { propertyId: uuid, moveInDate: "2030-01-01", durationMonths: 6, message: "I would like to move in next month." },
        successStatus: 201,
    },
    {
        method: "get",
        path: "/rentals",
        tag: "Rental Requests",
        summary: "Get own rental requests",
        access: "Tenant",
        query: ["status", ...pagination],
    },
    { method: "get", path: "/rentals/stats", tag: "Rental Requests", summary: "Get dashboard numbers for own requests and payments", access: "Tenant" },
    {
        method: "get",
        path: "/rentals/{id}",
        tag: "Rental Requests",
        summary: "Get rental request details (tenant, landlord of the property or admin)",
        access: "Any logged in user",
    },
    { method: "patch", path: "/rentals/{id}/cancel", tag: "Rental Requests", summary: "Cancel a pending or approved request", access: "Tenant" },
    {
        method: "post",
        path: "/payments/create",
        tag: "Payments",
        summary: "Create a Stripe payment intent for an approved rental request",
        access: "Tenant",
        body: { rentalRequestId: uuid },
        successStatus: 201,
    },
    {
        method: "post",
        path: "/payments/checkout",
        tag: "Payments",
        summary: "Create a Stripe Checkout session and get the payment page url",
        access: "Tenant",
        body: { rentalRequestId: uuid, clientUrl: "http://localhost:3000" },
        successStatus: 201,
    },
    {
        method: "post",
        path: "/payments/confirm",
        tag: "Payments",
        summary: "Confirm the payment with Stripe and activate the rental (payment intent id or checkout session id)",
        access: "Tenant",
        body: { transactionId: "pi_3PExample", paymentMethodId: "pm_card_visa" },
    },
    { method: "post", path: "/payments/webhook", tag: "Payments", summary: "Stripe webhook for payment events", access: "Stripe" },
    {
        method: "get",
        path: "/payments",
        tag: "Payments",
        summary: "Get payment history (own for tenant, own properties for landlord, all for admin)",
        access: "Any logged in user",
        query: ["status", ...pagination],
    },
    { method: "get", path: "/payments/{id}", tag: "Payments", summary: "Get payment details", access: "Any logged in user" },
    {
        method: "post",
        path: "/reviews",
        tag: "Reviews",
        summary: "Review a property after a completed rental",
        access: "Tenant",
        body: { rentalRequestId: uuid, rating: 5, comment: "Great place and a very helpful landlord." },
        successStatus: 201,
    },
    {
        method: "get",
        path: "/admin/users",
        tag: "Admin",
        summary: "Get all users",
        access: "Admin",
        query: ["searchTerm", "role", "status", ...pagination],
    },
    { method: "patch", path: "/admin/users/{id}", tag: "Admin", summary: "Ban or unban a user", access: "Admin", body: { status: "BANNED" } },
    {
        method: "get",
        path: "/admin/properties",
        tag: "Admin",
        summary: "Get all properties",
        access: "Admin",
        query: ["status", ...pagination],
    },
    { method: "delete", path: "/admin/properties/{id}", tag: "Admin", summary: "Remove any property listing", access: "Admin" },
    {
        method: "get",
        path: "/admin/rentals",
        tag: "Admin",
        summary: "Get all rental requests",
        access: "Admin",
        query: ["status", ...pagination],
    },
    { method: "get", path: "/admin/stats", tag: "Admin", summary: "Get platform numbers for users, properties, requests and revenue", access: "Admin" },
    {
        method: "post",
        path: "/admin/categories",
        tag: "Admin",
        summary: "Create a property category",
        access: "Admin",
        body: { name: "Penthouse", description: "Top floor luxury units" },
        successStatus: 201,
    },
    {
        method: "patch",
        path: "/admin/categories/{id}",
        tag: "Admin",
        summary: "Update a property category",
        access: "Admin",
        body: { description: "Updated description" },
    },
    { method: "delete", path: "/admin/categories/{id}", tag: "Admin", summary: "Delete a category that has no property", access: "Admin" },
];

const errorResponse = (description: string) => {
    return {
        description,
        content: {
            "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
        },
    };
};

const buildPaths = () => {
    const paths: Record<string, Record<string, unknown>> = {};

    endpoints.forEach((endpoint) => {
        const isSecured = endpoint.access !== "Public" && endpoint.access !== "Stripe";
        const pathParams = [...endpoint.path.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);

        const parameters = [
            ...pathParams.map((name) => ({ name, in: "path", required: true, schema: { type: "string", format: "uuid" } })),
            ...(endpoint.query ?? []).map((name) => ({ name, in: "query", required: false, schema: { type: "string" } })),
        ];

        paths[endpoint.path] = {
            ...paths[endpoint.path],
            [endpoint.method]: {
                tags: [endpoint.tag],
                summary: endpoint.summary,
                description: `Access: ${endpoint.access}`,
                ...(isSecured ? { security: [{ bearerAuth: [] }] } : {}),
                parameters,
                ...(endpoint.body
                    ? { requestBody: { required: true, content: { "application/json": { example: endpoint.body } } } }
                    : {}),
                responses: {
                    [endpoint.successStatus ?? 200]: {
                        description: "Success",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/SuccessResponse" },
                            },
                        },
                    },
                    400: errorResponse("Validation error or invalid request"),
                    ...(isSecured ? { 401: errorResponse("Missing or invalid token"), 403: errorResponse("No permission") } : {}),
                    404: errorResponse("Resource not found"),
                },
            },
        };
    });

    return paths;
};

export const swaggerDocument = {
    openapi: "3.0.3",
    info: {
        title: "RentNest API",
        version: "1.0.0",
        description:
            "Backend API for a rental property marketplace. Login first, then press Authorize and paste the accessToken to use the protected endpoints.",
    },
    servers: [{ url: "/api" }],
    tags: [
        { name: "Auth" },
        { name: "Categories" },
        { name: "Properties" },
        { name: "Landlord" },
        { name: "Rental Requests" },
        { name: "Payments" },
        { name: "Reviews" },
        { name: "Admin" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
        schemas: {
            SuccessResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Operation successful" },
                    meta: {
                        type: "object",
                        properties: {
                            page: { type: "integer", example: 1 },
                            limit: { type: "integer", example: 10 },
                            total: { type: "integer", example: 25 },
                            totalPages: { type: "integer", example: 3 },
                        },
                    },
                    data: {},
                },
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Validation failed" },
                    errorDetails: {
                        oneOf: [
                            { type: "string", example: "No property found with this id" },
                            {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        field: { type: "string", example: "email" },
                                        message: { type: "string", example: "A valid email is required" },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
    },
    paths: buildPaths(),
};

export const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RentNest API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: "/api/docs/openapi.json",
                dom_id: "#swagger-ui",
                persistAuthorization: true,
            });
        };
    </script>
</body>
</html>`;
