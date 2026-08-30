# Playwright E2E testing

End-to-end tests for this repo live under `apps/web/e2e/`. Behavior is planned in `apps/web/specs/` and implemented as Playwright specs with page objects and fixtures.

[![E2E](https://github.com/DShresthany/playwright_e2e_project/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/DShresthany/playwright_e2e_project/actions/workflows/e2e.yml)

## CI

The **E2E** workflow (`.github/workflows/e2e.yml`) runs on:

- every **pull request** targeting `main`
- every **push** to `main`

It installs dependencies, seeds local D1 from `apps/web/schema.sql`, installs Chromium, and runs the full suite:

```bash
pnpm run test:e2e
```

(from the repository root — same command as local full runs)

On failure, CI uploads the HTML report and Playwright traces as workflow artifacts.

## Run locally

### Prerequisites

- **Node.js** 20+ (CI uses 24)
- **pnpm** 9 (`packageManager` in root `package.json`)

### One-time setup

From the **repository root**:

```bash
pnpm install
```

#### 1. Test credentials

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env`. For local D1 seed data, use the accounts from [README](../README.md#test-accounts):

```env
STANDARD_USER=standard_user
STANDARD_PASSWORD=standard123
LOCKED_USER=locked_user
LOCKED_PASSWORD=locked123
ADMIN_USER=admin_user
ADMIN_PASSWORD=admin123
BASE_URL=http://localhost:5173
```

`playwright.config.ts` loads this file via `dotenv`. Do not commit `.env`.

#### 2. Worker secret (local API)

Create `apps/web/.dev.vars` (gitignored):

```env
JWT_SECRET=local-dev-secret-change-me
ENVIRONMENT=development
```

Wrangler needs `JWT_SECRET` for login and authenticated API routes.

#### 3. Seed local D1

```bash
cd apps/web
pnpm exec wrangler d1 execute qademo-db --local --file=./schema.sql
cd ../..
```

Re-run this if the local database is reset or product/user data looks wrong.

#### 4. Install Playwright browser

```bash
cd apps/web
pnpm exec playwright install chromium
cd ../..
```

### Run the full suite

From the **repository root**:

```bash
pnpm run test:e2e
```

Turbo runs a **build** first (`turbo.json`), then Playwright. Playwright starts both servers automatically:

| Service | URL | Command (internal) |
| --- | --- | --- |
| Vite (frontend) | `http://localhost:5173` | `pnpm run dev` |
| Wrangler (API) | `http://localhost:8787` | `pnpm run dev:worker` |

The **setup** project logs in once and writes `apps/web/e2e/.auth/standard.json` and `admin.json` (with `session_id` / `cart-storage` stripped so each test gets an isolated cart).

**Output:** HTML report at `apps/web/playwright-report/` (open `index.html` after a run).

### Run a subset

From `apps/web`:

```bash
# Guest tests only
pnpm exec playwright test --project=unauthenticated

# Authenticated tests (setup runs first via project dependency)
pnpm exec playwright test --project=authenticated

# One feature area
pnpm exec playwright test e2e/tests/authenticated/checkout/ --project=authenticated

# Tag filter (e.g. smoke)
pnpm exec playwright test --grep @smoke
```

### Match CI settings locally

```bash
CI=true pnpm run test:e2e
```

Uses `retries: 2` and `workers: 2` from `playwright.config.ts`.

## Layout

```
apps/web/
  e2e/
    setup/auth.setup.ts          # writes .auth/*.json
    tests/
      unauthenticated/           # project: unauthenticated (no storageState)
        auth/
        catalog/
        cart/
        product/
        checkout/
      authenticated/             # project: authenticated (standard.json)
        catalog/
        cart/
        product/
        checkout/
    src/
      fixtures/base.ts           # test + page fixtures
      pages/                     # LoginPage, CatalogPage, CartPage, …
      helpers/                   # credentials, clearCartViaApi, …
  specs/
    ecommerce-login.md
    ecommerce-catalog.md
    ecommerce-cart.md
    ecommerce-product.md
    ecommerce-checkout.md
  playwright.config.ts
```

| Playwright project | Directory | Auth |
| --- | --- | --- |
| `setup` | `e2e/setup/` | UI login → saves storage state |
| `unauthenticated` | `e2e/tests/unauthenticated/` | None |
| `authenticated` | `e2e/tests/authenticated/` | `e2e/.auth/standard.json` |

Specs reference plans with `// spec: specs/ecommerce-….md` at the top of each file.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `STANDARD_USER and STANDARD_PASSWORD must be set` | Fill `apps/web/.env` |
| Login or API 401/500 locally | Add `JWT_SECRET` to `apps/web/.dev.vars`; restart worker if you started it manually |
| Empty catalog or missing products | Re-seed D1 (`schema.sql`) |
| Port 5173 or 8787 already in use | Stop other `pnpm run dev` / `dev:worker` processes before `test:e2e` |
| `pnpm run test:e2e` slow first time | Turbo runs `build` before tests |
| Orders page empty in browser after E2E | Orders live in **local D1** only; log out and back in if the access token expired |
| Place-order tests and parallel runs | Checkout uses high-stock **Webcam** (id 10); see checkout plan for D1 stock notes |

## Related docs

- [README — test accounts](../README.md#test-accounts)
- [REST API](./REST-API-DOCUMENTATION.md) — optional API-level testing
