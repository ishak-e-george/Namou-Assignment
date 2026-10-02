# Namou Mini Shop

A small full stack shop assessment built with Express, SQLite, React, and TypeScript.

## Local setup

Requires Node.js 22 or newer.

1. Copy `.env.example` to `.env` and set a private JWT secret for local use.
2. Install dependencies: `npm install`.
3. Apply the schema: `npm run migrate`.
4. Load the repeatable demo data: `npm run seed`.
5. Start the API and web app: `npm run dev`.

Open <http://localhost:5173>. The Vite server proxies `/api` requests to the API on port 3000. The API health endpoint is available at <http://localhost:5173/api/health>.

The SQLite database file defaults to `server/data/shop.db`. The containing folder is created automatically. To reset the local database, delete that file and run the migration and seed commands again.

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
- `npm run build -w client` creates the production client build.

## Automated E2E tests

Run `npm run test:e2e`. Playwright starts the API and Vite app with a dedicated seeded SQLite database; install its Chromium browser once with `npx playwright install chromium`.

## Assumptions

- The seeded demo user is the only account; there is no registration flow.
- Every variant of a product has the same price.
- Prices are displayed in USD.
- Adding items to the cart does not reserve stock; stock is checked and decremented at checkout.
- Checkout simulates order placement and does not process payment.
- This assessment setup does not include deployment.
