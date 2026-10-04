# Namou Mini Shop

A full-stack mini e-commerce take-home with an authenticated customer flow and a 15-product home and lifestyle catalog. Customers can view product details, choose variants, manage a cart and wishlist, place a mocked order, and view its confirmation.

## Features

- Customer login and protected shopping pages
- Product listing and detail pages with size and color variants, color-specific local imagery, and stock availability
- Cart quantity updates, item removal, and variant changes
- Wishlist with a separate page
- Mock checkout and order confirmation; no payment is processed
- Responsive layouts, loading/error/empty states, and keyboard-friendly controls
- Local images with no runtime remote-image dependency

## Tech stack

- **Backend:** Node.js, Express 5, TypeScript, Zod, SQLite with better-sqlite3, plain SQL, JWT, and bcrypt
- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query, and CSS Modules
- **Testing:** Vitest, Supertest, Testing Library, and Playwright
- **Quality and CI:** ESLint, TypeScript, and GitHub Actions

## Project structure

```text
client/             React application
server/             Express API, SQLite migrations, and seed data
e2e/                Playwright browser journeys
docs/               Assessment architecture and AI-use documentation
scripts/            Local setup helper
.github/workflows/  Continuous integration
```

## Requirements

- Node.js 22 or newer
- npm

No external database installation is required.

## Local setup

### Quick start

```sh
npm run setup
npm run dev
```

Open <http://localhost:5173> and sign in with the demo account:

- Email: `demo@example.com`
- Password: `namou-demo-2026`

The setup command installs dependencies, creates `.env` from `.env.example` only when `.env` is missing, then runs migrations and the demo seed. An existing `.env` is preserved.

### Manual setup

1. Copy `.env.example` to `.env` and set `JWT_SECRET` to a private value of at least 32 characters.
2. Install dependencies with `npm install`.
3. Apply database migrations with `npm run migrate`.
4. Load the demo account and catalog with `npm run seed`.
5. Start the API and web app with `npm run dev`.

Open <http://localhost:5173>. The Vite server proxies `/api` requests to the API on port 3000. The health endpoint is available at <http://localhost:5173/api/health>. The SQLite database defaults to `server/data/shop.db`; its directory is created automatically. The seed resets application tables and inserts the demo data.

In PowerShell on Windows, use `npm.cmd` if the shell blocks the `npm.ps1` script.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run setup` | Install dependencies, create local environment if needed, migrate, and seed |
| `npm run dev` | Start API and frontend development servers |
| `npm run migrate` | Apply numbered SQLite migrations |
| `npm run seed` | Reset application tables and load demo data |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check server and client |
| `npm test` | Run server and client test suites |
| `npm run build -w client` | Build the production client bundle |
| `npm run test:e2e` | Run Playwright browser journeys |

## Testing

`npm test` runs 66 server integration tests and 36 focused client tests. The repository also includes two Playwright browser journeys covering authentication/session behavior and a shopping-to-order flow. Playwright uses a dedicated SQLite database and Chromium; install the browser with `npx playwright install chromium` when needed.

On Windows, the Playwright browser assertions can pass while its managed development-server child remains alive. In that environment the command may require interruption and return a non-zero shell exit during teardown.

## Architecture

The React client calls the Express API. Backend routes apply middleware and validation, controllers handle HTTP concerns, services implement business rules, and repositories issue parameterized SQL against SQLite. Authentication uses a JWT in an HTTP-only cookie. The server reads authoritative prices and stock; cart items do not reserve inventory, and checkout revalidates stock and creates the order in a transaction. TanStack Query manages client-side server state.

## Security and data integrity

- Passwords are hashed with bcrypt; login failures use a generic credential message and login attempts are rate limited.
- The JWT is stored in an HTTP-only cookie, and protected records are queried within the authenticated user's ownership scope.
- Request data is validated with Zod and SQL values are parameterized.
- Checkout reads current prices and stock on the server and applies inventory and order changes atomically.

## Responsive design

Responsive behavior was reviewed at widths of 360, 390, 768, 1366, 1440, 1536, and 1920 pixels across mobile, tablet, and desktop layouts.

## Documentation

- [Database design](docs/database.md)
- [Backend architecture](docs/backend.md)
- [Frontend architecture](docs/frontend.md)
- [AI use](docs/ai-usage.md)

## CI

GitHub Actions runs dependency installation, lint, typecheck, tests, and the client production build for pushes and pull requests.

## Assumptions

- The seeded demo user is the only account; registration is not included.
- Every variant of a product has the same price.
- Prices are displayed in USD.
- Checkout simulates order placement and does not process payment.
- This assessment setup does not include deployment.
