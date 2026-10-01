# Namou Mini Shop

A small full stack shop assessment built with Express, PostgreSQL, React, and TypeScript.

## Local setup

1. Copy `.env.example` to `.env` and keep the development database URL and JWT secret for local use.
2. Start PostgreSQL 16: `docker compose up -d`.
3. Install dependencies: `npm install`.
4. Apply the schema: `npm run migrate`.
5. Load the repeatable demo data: `npm run seed`.
6. Start the API and web app: `npm run dev`.

Open <http://localhost:5173>. The Vite server proxies `/api` requests to the API on port 3000. The API health endpoint is available at <http://localhost:5173/api/health>.

The Docker initialization script creates `shop_test` the first time the database volume is initialized. To reset both local databases, run `docker compose down -v` and then `docker compose up -d`.

## Demo account

- Email: `demo@example.com`
- Password: `namou-demo-2026`

## Root scripts

- `npm run dev` starts the API and web app together.
- `npm run migrate` applies numbered SQL migrations.
- `npm run seed` resets the application tables and inserts the demo user and catalog.
- `npm run test` runs the server and client test suites.
- `npm run lint` checks the repository with ESLint.
- `npm run typecheck` checks the server and client TypeScript projects.

## Assumptions

- The seeded demo user is the only account; there is no registration flow.
- Every variant of a product has the same price.
- Adding items to the cart does not reserve stock; stock is checked and decremented at checkout.
- Checkout simulates order placement and does not process payment.
- This assessment setup does not include deployment.
