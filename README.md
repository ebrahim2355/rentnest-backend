# RentNest Backend

**"Find & List Rental Properties with Ease"**

RentNest is a backend API for a rental property marketplace. Landlords list their properties and manage rental requests. Tenants browse the listings, send rental requests, pay with Stripe and leave reviews. Admins manage the users, the listings and the property categories.

## Links

| Item | Link |
| --- | --- |
| Live API | https://rentnest-backend-red.vercel.app |
| API Docs (Swagger) | https://rentnest-backend-red.vercel.app/api/docs |
| Postman Collection | [postman/RentNest.postman_collection.json](./postman/RentNest.postman_collection.json) |

## Admin Credentials

| Email | Password |
| --- | --- |
| admin@rentnest.com | admin123 |

The seed script also creates two demo accounts to test quickly.

| Role | Email | Password |
| --- | --- | --- |
| Landlord | landlord@rentnest.com | landlord123 |
| Tenant | tenant@rentnest.com | tenant123 |

## Features

### Public

- Browse all available rental properties
- Search by keyword and filter by location, price range, property type, bedrooms and amenities
- Sort by rent or date, with pagination
- View property details with the landlord, the reviews and the average rating
- View all property categories

### Tenant

- Register and login
- Submit a rental request for a property
- Pay with Stripe after the landlord approves the request
- See the payment history and the payment status
- See the rental request history and cancel a request
- Leave a review after a completed rental
- Manage the profile

### Landlord

- Register and login
- Create, update and remove property listings
- Set the availability status of a property
- Approve or reject rental requests and mark a rental as completed
- See the rental history, the payments and the tenant reviews of own properties

### Admin

- View all users with search and filters
- Ban or unban a user
- View all properties and all rental requests
- Remove any property listing
- Create, update and delete property categories

## Tech Stack

- Node.js and Express
- TypeScript
- PostgreSQL with Prisma ORM
- JWT for authentication and bcrypt for password hashing
- Zod for input validation
- Stripe for payments
- Swagger (OpenAPI) and Postman for API documentation

## Project Structure

```text
prisma
├── migrations
├── schema.prisma
└── seed.ts
src
├── config
├── docs
├── errors
├── lib
├── middlewares
├── modules
│   ├── admin
│   ├── auth
│   ├── category
│   ├── landlord
│   ├── payment
│   ├── property
│   ├── rental
│   └── review
├── routes
├── utils
├── validations
├── app.ts
└── server.ts
```

Every module has its own routes, controller, service and validation file.

## Database Design

| Table | Purpose | Main relations |
| --- | --- | --- |
| users | Account data, role and status | has many properties, rental requests, payments and reviews |
| categories | Property types like Apartment, House and Studio | has many properties |
| properties | Rental listings | belongs to a landlord (user) and a category |
| rental_requests | A tenant's request to rent a property | belongs to a property and a tenant, has many payments, has one review |
| payments | Stripe payment transactions | belongs to a rental request and a user |
| reviews | Tenant reviews of a property | belongs to a property, a tenant and one rental request |

Enums used in the schema:

- `Role`: TENANT, LANDLORD, ADMIN
- `UserStatus`: ACTIVE, BANNED
- `PropertyStatus`: AVAILABLE, RENTED, UNAVAILABLE
- `RentalStatus`: PENDING, APPROVED, REJECTED, ACTIVE, COMPLETED, CANCELLED
- `PaymentStatus`: PENDING, COMPLETED, FAILED
- `PaymentProvider`: STRIPE, SSLCOMMERZ

The full schema is in [prisma/schema.prisma](./prisma/schema.prisma).

## Rental and Payment Flow

```text
PENDING  --landlord approves-->  APPROVED  --tenant pays with Stripe-->  ACTIVE  --landlord completes-->  COMPLETED
   |                                 |
   |--landlord rejects--> REJECTED   |--tenant cancels--> CANCELLED
   |--tenant cancels--> CANCELLED
```

1. The tenant sends a rental request. The total amount is the monthly rent multiplied by the number of months.
2. The landlord approves or rejects the request.
3. For an approved request, the tenant calls `POST /api/payments/create`. The server creates a Stripe payment intent and saves a payment with the status `PENDING`.
4. The tenant calls `POST /api/payments/confirm`. The server checks the payment with Stripe. When Stripe says it succeeded, the payment becomes `COMPLETED`, the rental becomes `ACTIVE` and the property becomes `RENTED`. If the card is declined, the payment becomes `FAILED`.
5. When the stay is over, the landlord marks the rental as `COMPLETED`. The property becomes `AVAILABLE` again and the tenant can leave a review.

There is also a Stripe webhook endpoint, `POST /api/payments/webhook`, which handles the `payment_intent.succeeded` and `payment_intent.payment_failed` events.

### Testing a payment

There is no frontend, so the card is confirmed from the API with a Stripe test payment method.

| paymentMethodId | Result |
| --- | --- |
| `pm_card_visa` | Payment succeeds |
| `pm_card_chargeDeclined` | Card is declined |

```json
{
  "transactionId": "pi_...",
  "paymentMethodId": "pm_card_visa"
}
```

## API Endpoints

All the endpoints start with `/api`. Protected endpoints need the token in the header.

```text
Authorization: Bearer <accessToken>
```

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register as a tenant or a landlord |
| POST | `/auth/login` | Public | Login and get the access token |
| GET | `/auth/me` | Logged in user | Get own profile |
| PATCH | `/auth/me` | Logged in user | Update own profile |

### Properties and Categories

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/properties` | Public | Get available properties with search, filters and pagination |
| GET | `/properties/:id` | Public | Get property details with reviews |
| GET | `/categories` | Public | Get all categories |

Query options of `GET /properties`: `searchTerm`, `location`, `type`, `categoryId`, `minPrice`, `maxPrice`, `bedrooms`, `amenities` (comma separated), `sortBy` (`rent` or `createdAt`), `sortOrder`, `page`, `limit`.

### Landlord

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/landlord/properties` | Landlord | Create a property |
| GET | `/landlord/properties` | Landlord | Get own properties |
| PUT | `/landlord/properties/:id` | Landlord | Update own property or its status |
| DELETE | `/landlord/properties/:id` | Landlord | Remove own property |
| GET | `/landlord/requests` | Landlord | Get rental requests of own properties |
| PATCH | `/landlord/requests/:id` | Landlord | Approve, reject or complete a request |
| GET | `/landlord/reviews` | Landlord | Get reviews of own properties |

### Rental Requests

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/rentals` | Tenant | Submit a rental request |
| GET | `/rentals` | Tenant | Get own rental requests |
| GET | `/rentals/:id` | Tenant, Landlord, Admin | Get rental request details |
| PATCH | `/rentals/:id/cancel` | Tenant | Cancel a pending or approved request |

### Payments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/payments/create` | Tenant | Create a Stripe payment intent for an approved request |
| POST | `/payments/confirm` | Tenant | Confirm the payment and activate the rental |
| POST | `/payments/webhook` | Stripe | Webhook for Stripe payment events |
| GET | `/payments` | Logged in user | Get the payment history |
| GET | `/payments/:id` | Logged in user | Get payment details |

### Reviews

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/reviews` | Tenant | Review a property after a completed rental |

### Admin

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/admin/users` | Admin | Get all users |
| PATCH | `/admin/users/:id` | Admin | Ban or unban a user |
| GET | `/admin/properties` | Admin | Get all properties |
| DELETE | `/admin/properties/:id` | Admin | Remove any property |
| GET | `/admin/rentals` | Admin | Get all rental requests |
| POST | `/admin/categories` | Admin | Create a category |
| PATCH | `/admin/categories/:id` | Admin | Update a category |
| DELETE | `/admin/categories/:id` | Admin | Delete a category that has no property |

## Response Format

Success response

```json
{
  "success": true,
  "message": "Properties retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "data": []
}
```

Error response

```json
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": [
    {
      "field": "email",
      "message": "A valid email is required"
    }
  ]
}
```

Every error uses the same structure. For validation errors `errorDetails` is a list of fields, and for other errors it is a short text.

| Code | Used for |
| --- | --- |
| 400 | Validation error or invalid request |
| 401 | Missing, invalid or expired token, wrong email or password |
| 402 | Card declined by Stripe |
| 403 | No permission, or banned account |
| 404 | Resource or route not found |
| 409 | Conflict, for example a duplicate email or an invalid status change |
| 500 | Unexpected server error |

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/ebrahim2355/rentnest-backend.git
cd rentnest-backend
```

2. Install the dependencies

```bash
npm install
```

3. Create a `.env` file from `.env.example`

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/rentnest
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
ADMIN_EMAIL=admin@rentnest.com
ADMIN_PASSWORD=admin123
```

4. Run the migrations and the seed script

```bash
npx prisma migrate deploy
npm run seed
```

5. Start the server

```bash
npm run dev
```

The API runs on `http://localhost:5000` and the Swagger docs are on `http://localhost:5000/api/docs`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the server in watch mode |
| `npm run build` | Generate the Prisma client and compile TypeScript |
| `npm start` | Run the compiled server |
| `npm run migrate` | Create and apply a migration in development |
| `npm run migrate:deploy` | Apply the migrations in production |
| `npm run seed` | Create the admin, the categories and the demo data |
