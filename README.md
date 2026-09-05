# 1Fi EMI Product Store

> SDE1 Full-Stack Assignment — Built with React, Node.js, Express, Prisma and PostgreSQL.

---

## Overview

1Fi EMI Product Store is a full-stack e-commerce application where users can browse premium smartphones, select product variants, view mutual-fund-backed EMI plans, choose a plan, and proceed with a demo confirmation flow.

All product data, variant data, and EMI plan data originate from a PostgreSQL database. The React frontend contains **zero hardcoded product or pricing information** — everything is fetched from the REST API at runtime.

---

## Features

- **Product listing** — hero banner, brand filter chips, responsive 3-column grid
- **Product detail page** — unique URL per product (e.g. `/products/iphone-17-pro`)
- **Variant selection** — colour swatches and storage pills from the database; product image updates on selection
- **Pricing display** — selling price, MRP with strikethrough, discount percentage, savings amount
- **EMI plans** — 6 plans per product (3 / 6 / 9 / 12 / 18 / 24 months); fetched from the database
- **EMI selection** — radio-button style; only one plan selectable at a time
- **Proceed flow** — button disabled until a plan is selected; two-screen confirmation modal (Review → Confirm)
- **Loading states** — spinner and animated skeleton cards during API fetches
- **Error states** — user-friendly messages with retry on every fetch; dedicated not-found page for invalid slugs
- **Responsive** — tested at 375px, 768px, 1024px, 1440px

---

## Tech Stack

### Frontend

| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool and dev server |
| Tailwind CSS | v4 | Utility-first styling |
| React Router | v7 | Client-side routing |

### Backend

| Library | Version | Purpose |
|---|---|---|
| Node.js | 20+ | JavaScript runtime |
| Express | 4 | HTTP server and routing |
| Prisma | 6 | ORM and query builder |
| dotenv | 16 | Environment variable loading |
| cors | 2 | Cross-origin request handling |

### Database

| Technology | Purpose |
|---|---|
| PostgreSQL 15+ | Relational database |
| Prisma Migrate | Schema migrations and version control |

---

## Architecture

```
Browser
  │
  │  React + Vite (dev server :5173)
  │    ├── pages/Home.jsx           — product listing
  │    ├── pages/ProductPage.jsx    — product detail
  │    └── services/api.js          — all fetch() calls (central API layer)
  │
  │  HTTP /api/*
  │  (Vite proxies to :5000 in development; VITE_API_URL used in production)
  │
  ▼
Express API (:5000)
  │
  │  routes/products.js
  │    └── controllers/productController.js   — HTTP layer (req/res)
  │          └── services/productService.js   — Prisma queries + validation
  │                └── lib/prisma.js           — shared PrismaClient instance
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL (emi_store database)
  ├── Product
  ├── ProductVariant
  └── EmiPlan
```

---

## Project Structure

```
1fi-emi-store/
│
├── frontend/                        # React + Vite application
│   ├── vite.config.js               # Tailwind plugin + /api proxy → :5000
│   ├── index.html
│   └── src/
│       ├── main.jsx                 # React root — BrowserRouter + StrictMode
│       ├── App.jsx                  # Route definitions (/, /products/:slug, *)
│       ├── index.css                # Tailwind import + global resets
│       │
│       ├── pages/
│       │   ├── Home.jsx             # Product listing — hero, filters, grid
│       │   ├── ProductPage.jsx      # Product detail — gallery + EMI plans
│       │   └── NotFound.jsx         # 404 fallback page
│       │
│       ├── components/
│       │   ├── Navbar.jsx           # Sticky top navigation bar
│       │   ├── ProductGallery.jsx   # Product image + variant selector
│       │   ├── ProductInfo.jsx      # Selling price, MRP, discount, description
│       │   ├── EmiPlanList.jsx      # Fetches and renders EMI plan list
│       │   ├── EmiPlanCard.jsx      # Single selectable EMI plan row
│       │   ├── ProceedButton.jsx    # CTA — disabled until plan selected
│       │   ├── ProceedModal.jsx     # Two-screen Review → Confirm modal
│       │   ├── Loading.jsx          # Spinner with aria-live
│       │   └── ErrorMessage.jsx     # Error display with retry button
│       │
│       └── services/
│           └── api.js               # Central fetch wrapper — all API calls
│
├── backend/                         # Express REST API
│   ├── .env.example                 # Environment variable template
│   ├── package.json
│   └── src/
│       ├── app.js                   # Express app — CORS, middleware, routes
│       ├── server.js                # Entry point — DB connect, app.listen
│       │
│       ├── routes/
│       │   └── products.js          # /api/products route definitions
│       │
│       ├── controllers/
│       │   └── productController.js # HTTP layer — reads req, calls service
│       │
│       ├── services/
│       │   └── productService.js    # Prisma queries + slug validation
│       │
│       ├── middleware/
│       │   ├── errorHandler.js      # Centralised error classification
│       │   ├── notFound.js          # 404 for unmatched routes
│       │   └── requestLogger.js     # Coloured request / status / ms logging
│       │
│       └── lib/
│           └── prisma.js            # PrismaClient singleton
│
├── prisma/
│   ├── schema.prisma                # Database models and relationships
│   ├── seed.js                      # Seed script — 3 products, 7 variants, 18 plans
│   └── migrations/                  # Auto-generated migration SQL files
│
├── package.json                     # Root monorepo scripts
├── .gitignore
└── README.md
```

---

## Database Schema

### Product

| Column | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | e.g. "iPhone 17 Pro" |
| `slug` | String (unique) | URL key e.g. "iphone-17-pro" |
| `description` | String? | Optional marketing copy |
| `brand` | String? | e.g. "Apple" |
| `category` | String? | e.g. "Smartphones" |
| `mrp` | Decimal(10,2) | Maximum Retail Price |
| `price` | Decimal(10,2) | Selling / offer price |
| `createdAt` | DateTime | Auto-set on insert |
| `updatedAt` | DateTime | Auto-updated on every write |

### ProductVariant

| Column | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `productId` | String | FK → Product.id (cascade delete) |
| `storage` | String | e.g. "256 GB" |
| `color` | String | e.g. "Silver" |
| `imageUrl` | String? | Variant-specific product image URL |
| `inStock` | Boolean | Default `true` |
| `sortOrder` | Int | Display order within the product |
| `createdAt` | DateTime | Auto-set on insert |

### EmiPlan

| Column | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `productId` | String | FK → Product.id (cascade delete) |
| `tenureMonths` | Int | Repayment period: 3, 6, 9, 12, 18, or 24 |
| `interestRate` | Decimal(5,2) | Annual rate in %. `0.00` = no-cost EMI |
| `monthlyPayment` | Decimal(10,2) | Fixed monthly instalment amount |
| `totalPayable` | Decimal(10,2) | `tenureMonths × monthlyPayment` |
| `cashback` | Decimal(10,2)? | Optional instant cashback (nullable) |
| `fundName` | String? | Backing mutual fund name |
| `fundCategory` | String? | e.g. "Large Cap", "Mid Cap", "Index Fund" |
| `isNoCost` | Boolean | `true` when `interestRate = 0` |
| `createdAt` | DateTime | Auto-set on insert |

### Relationships

```
Product  1 ──────< ProductVariant   (onDelete: Cascade)
Product  1 ──────< EmiPlan          (onDelete: Cascade)
```

- Both child tables have a foreign key on `productId` with cascade delete
- Both are indexed on `productId` for fast joins
- `ProductVariant` also has a compound index on `(productId, sortOrder)`
- `EmiPlan` also has a compound index on `(productId, tenureMonths)`

---

## Seed Data

Seed script: `prisma/seed.js` — idempotent (safe to re-run).

| Metric | Count |
|---|---|
| Products | 3 |
| Variants (total) | 7 |
| EMI plans (total) | 18 (6 per product) |

### Products and variants

| Product | Slug | Price | MRP | Variants |
|---|---|---|---|---|
| iPhone 17 Pro | `iphone-17-pro` | ₹1,24,900 | ₹1,34,900 | 3 |
| Samsung Galaxy S24 Ultra | `samsung-galaxy-s24-ultra` | ₹1,24,999 | ₹1,34,999 | 2 |
| OnePlus 13 | `oneplus-13` | ₹69,999 | ₹74,999 | 2 |

**iPhone 17 Pro variants**
- 256 GB / Silver ✓
- 256 GB / Orange ✓
- 512 GB / Silver ✓

**Samsung Galaxy S24 Ultra variants**
- 256 GB / Titanium Black ✓
- 512 GB / Titanium Gray ✓

**OnePlus 13 variants**
- 256 GB / Black ✓
- 512 GB / Blue ✓

### EMI plan tenures (all products)

| Tenure | Rate | Type |
|---|---|---|
| 3 months | 0% | No-cost EMI |
| 6 months | 0% | No-cost EMI |
| 9 months | 10.5% p.a. | Standard |
| 12 months | 10.5% p.a. | Standard |
| 18 months | 12–13.5% p.a. | Extended |
| 24 months | 13.5–14% p.a. | Extended |

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ running locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd 1fi-emi-store
```

### 2. Install dependencies

```bash
# Installs both frontend and backend node_modules in one command
npm run install:all
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your PostgreSQL credentials:

```
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/emi_store?schema=public"
FRONTEND_URL=http://localhost:5173
```

> The `FRONTEND_URL` value is added to the Express CORS whitelist. `http://localhost:5173` (the Vite default) is also whitelisted unconditionally in development.

### 4. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE emi_store;"
```

Or use pgAdmin / any PostgreSQL GUI.

### 5. Generate the Prisma client

```bash
cd backend
npm run db:generate
```

### 6. Run database migrations

```bash
# Still in backend/
npm run db:migrate
# When prompted, enter a migration name: init
```

This creates all three tables (`Product`, `ProductVariant`, `EmiPlan`) in the database.

### 7. Seed the database

```bash
# Still in backend/
npm run db:seed
```

Expected output:

```
────────────────────────────────────────────────────────────
  1Fi EMI Store — Database Seed
────────────────────────────────────────────────────────────

  ▸ iPhone 17 Pro  (slug: iphone-17-pro)
    + 3 variant(s)
    + 6 EMI plan(s)

  ▸ Samsung Galaxy S24 Ultra  (slug: samsung-galaxy-s24-ultra)
    + 2 variant(s)
    + 6 EMI plan(s)

  ▸ OnePlus 13  (slug: oneplus-13)
    + 2 variant(s)
    + 6 EMI plan(s)

  products  : 3
  variants  : 7
  emi_plans : 18

  ✓ All minimum counts satisfied.
────────────────────────────────────────────────────────────
```

### 8. Start the backend

Open terminal 1:

```bash
# From the repo root
npm run dev:backend
```

The API starts at `http://localhost:5000`.  
Verify: open `http://localhost:5000/api/health` in a browser.

### 9. Start the frontend

Open terminal 2:

```bash
# From the repo root
npm run dev:frontend
```

The app starts at `http://localhost:5173`.

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port the Express server listens on (default: `5000`) |
| `NODE_ENV` | Yes | `development` or `production` — controls error detail in responses |
| `DATABASE_URL` | Yes | Full PostgreSQL connection string for Prisma |
| `FRONTEND_URL` | Yes | Allowed CORS origin — your deployed frontend URL in production |

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend base URL for production builds. Leave empty in development — Vite proxy handles it. |

> `.env` files are excluded from version control. Only `.env.example` files are committed to the repository.

---

## API Endpoints

All successful responses follow this envelope:

```json
{
  "success": true,
  "data": <payload>,
  "meta": { "count": N }
}
```

All error responses:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "No product found with slug \"xyz\""
  }
}
```

### Interactive API Documentation (Swagger UI)

Start the backend, then open:

```
http://localhost:5000/api-docs
```

The Swagger UI lets you browse all endpoints, read parameter descriptions, and execute requests directly from the browser.

---

### GET /api/health

Returns server and environment status.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-09-03T10:00:00.000Z",
    "env": "development"
  }
}
```

---

### GET /api/products

Returns all products with their variants, ordered alphabetically by name.

```json
{
  "success": true,
  "data": [
    {
      "id": "cmtlbecgx0000v4ok...",
      "name": "iPhone 17 Pro",
      "slug": "iphone-17-pro",
      "brand": "Apple",
      "category": "Smartphones",
      "mrp": "134900",
      "price": "124900",
      "createdAt": "2026-09-03T09:20:32.673Z",
      "updatedAt": "2026-09-03T09:20:32.673Z",
      "variants": [
        {
          "id": "cmtlre8u1000...",
          "productId": "cmtlbecgx0000v4ok...",
          "storage": "256 GB",
          "color": "Silver",
          "imageUrl": "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80",
          "inStock": true,
          "sortOrder": 0,
          "createdAt": "2026-09-03T16:48:21.818Z"
        }
      ]
    }
  ],
  "meta": { "count": 3 }
}
```

---

### GET /api/products/:slug

Returns a single product with all variants and all EMI plans.

**Example:** `GET /api/products/iphone-17-pro`

**404 — slug not found:**

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "No product found with slug \"iphone-17-pro\""
  }
}
```

**400 — invalid slug format (non-alphanumeric characters):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SLUG",
    "message": "Invalid product slug: \"bad slug!\""
  }
}
```

**200 — success:**

```json
{
  "success": true,
  "data": {
    "id": "cmtlbecgx0000v4ok...",
    "name": "iPhone 17 Pro",
    "slug": "iphone-17-pro",
    "brand": "Apple",
    "category": "Smartphones",
    "mrp": "134900",
    "price": "124900",
    "variants": [
      { "storage": "256 GB", "color": "Silver",  "inStock": true,  "sortOrder": 0 },
      { "storage": "256 GB", "color": "Orange",  "inStock": true,  "sortOrder": 1 },
      { "storage": "512 GB", "color": "Silver",  "inStock": true,  "sortOrder": 2 }
    ],
    "emiPlans": [
      {
        "tenureMonths": 3,
        "interestRate": "0",
        "monthlyPayment": "41634",
        "totalPayable": "124902",
        "cashback": "500",
        "fundName": "Mirae Asset Large Cap Fund",
        "fundCategory": "Large Cap",
        "isNoCost": true
      },
      {
        "tenureMonths": 12,
        "interestRate": "10.5",
        "monthlyPayment": "11010",
        "totalPayable": "132120",
        "cashback": "7500",
        "fundName": "SBI Magnum Midcap Fund",
        "fundCategory": "Mid Cap",
        "isNoCost": false
      }
    ]
  }
}
```

---

### GET /api/products/:slug/variants

Returns only the variants for a product, ordered by `sortOrder`.

**Example:** `GET /api/products/samsung-galaxy-s24-ultra/variants`

```json
{
  "success": true,
  "data": [
    { "storage": "256 GB", "color": "Titanium Black", "inStock": true, "sortOrder": 0 },
    { "storage": "512 GB", "color": "Titanium Gray",  "inStock": true, "sortOrder": 1 }
  ],
  "meta": { "count": 2 }
}
```

---

### GET /api/products/:slug/emi-plans

Returns all EMI plans for a product, ordered by tenure (shortest first).

**Example:** `GET /api/products/oneplus-13/emi-plans`

```json
{
  "success": true,
  "data": [
    {
      "tenureMonths": 3,
      "interestRate": "0",
      "monthlyPayment": "23333",
      "totalPayable": "69999",
      "cashback": "300",
      "fundName": "UTI Nifty 50 Index Fund",
      "fundCategory": "Index Fund",
      "isNoCost": true
    },
    {
      "tenureMonths": 6,
      "interestRate": "0",
      "monthlyPayment": "11667",
      "totalPayable": "70002",
      "cashback": null,
      "fundName": "ICICI Prudential Bluechip Fund",
      "fundCategory": "Large Cap",
      "isNoCost": true
    },
    {
      "tenureMonths": 12,
      "interestRate": "10.5",
      "monthlyPayment": "6171",
      "totalPayable": "74052",
      "cashback": "7500",
      "fundName": "Motilal Oswal Midcap Fund",
      "fundCategory": "Mid Cap",
      "isNoCost": false
    }
  ],
  "meta": { "count": 6 }
}
```

---

## Product URLs

All product pages use unique, human-readable URL slugs:

| Product | URL |
|---|---|
| iPhone 17 Pro | `/products/iphone-17-pro` |
| Samsung Galaxy S24 Ultra | `/products/samsung-galaxy-s24-ultra` |
| OnePlus 13 | `/products/oneplus-13` |

Navigating to an unknown slug (e.g. `/products/pixel-9`) shows a dedicated "Product not found" page with a link back to the product listing.

---

## Available Scripts

### From the repo root

| Script | Command | Description |
|---|---|---|
| Install all | `npm run install:all` | Install frontend and backend dependencies |
| Start frontend | `npm run dev:frontend` | Vite dev server → `http://localhost:5173` |
| Start backend | `npm run dev:backend` | Express with `--watch` → `http://localhost:5000` |

### From `backend/`

| Script | Command | Description |
|---|---|---|
| Generate client | `npm run db:generate` | Regenerate Prisma client from schema |
| Migrate | `npm run db:migrate` | Apply schema migrations to the database |
| Seed | `npm run db:seed` | Load 3 products, 7 variants, 18 EMI plans |
| Reset | `npm run db:reset` | Drop and re-migrate (development only) |
| Studio | `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| Start (prod) | `npm start` | Start without hot-reload |

---

## Deployment

### Frontend

```bash
cd frontend
npm run build
# Production output → frontend/dist/
```

Deploy `frontend/dist/` to Vercel, Netlify, AWS S3, or any static host.

Set `VITE_API_URL` to your deployed backend URL before building:

```bash
VITE_API_URL=https://your-backend.example.com/api npm run build
```

### Backend

Deploy to Railway, Render, Fly.io, or any Node.js host.

Required environment variables:

```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/emi_store
FRONTEND_URL=https://your-frontend.example.com
```

---


## Assignment

This project was created for the **1Fi SDE1 Full-Stack Assignment**.

It demonstrates a complete full-stack application with:
- A React frontend that fetches all data from a REST API
- An Express backend with proper error handling and layered architecture
- A PostgreSQL database managed through Prisma ORM
- Database-backed dynamic product pages, variant selection, and EMI plan selection
- Zero hardcoded product or pricing data in the frontend

---

## License

MIT
