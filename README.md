# Playwright E2E on QADemo

[![E2E](https://github.com/DShresthany/playwright_e2e_project/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/DShresthany/playwright_e2e_project/actions/workflows/e2e.yml)

Spec-driven **Playwright + TypeScript** end-to-end tests against [QADemo](https://qademo.com) — a practice ecommerce app (React, Hono, Cloudflare Workers / D1 / KV / R2).

## About this repository

This repo is a **portfolio fork** of [QADemo](https://qademo.com) (inspired by [SauceDemo](https://www.saucedemo.com/)).

| | |
|---|---|
| **What I built** | Playwright E2E framework: plans in `apps/web/specs/`, page objects / fixtures / helpers in `apps/web/e2e/`, auth setup with cart isolation for parallel runs, GitHub Actions CI, and branch protection for `main`. Specs and tests were authored with an AI-assisted explore / plan / generate / heal workflow (Cursor + Playwright CLI skills) |
| **What I did not build** | The React / Hono / Cloudflare application (upstream QADemo) |

Full runbook: **[docs/E2E.md](./docs/E2E.md)**.

## E2E framework highlights

- **Coverage (Core):** login, catalog, cart, product detail (PDP), checkout (~53 tests)
- **Projects:** `setup` → `unauthenticated` | `authenticated` (folder-based `testDir`)
- **Auth:** one-time UI login in `auth.setup.ts`; `storageState` for logged-in suites; cart keys stripped so tests do not share a cart session
- **Isolation:** `clearCartViaApi` arrange; high-stock Webcam for parallel place-order
- **CI:** E2E workflow on every PR and push to `main`; required status check before merge

### AI-assisted authoring (how the suite was built)

This project uses an AI-assisted Playwright workflow (**Cursor** + **Playwright CLI** skills):

- **Explore** the live app to validate behavior and locators
- **Plan** scenarios in `apps/web/specs/` (Core vs Deferred scope)
- **Generate** specs with page objects / fixtures; human review for isolation and product quirks
- **Heal** failing tests against the live UI when needed

The committed suite is standard `@playwright/test` — CI runs `pnpm run test:e2e` with no special AI runtime. AI speeds authoring; design decisions (auth setup, cart isolation, parallel place-order strategy) are intentional and documented.

### Layout

```
apps/web/
  specs/                          # Behavior plans (ecommerce-*.md)
  e2e/
    setup/auth.setup.ts           # Writes e2e/.auth/*.json
    tests/
      unauthenticated/            # Guest + login UI
      authenticated/              # Cart, PDP, checkout (storageState)
    src/
      fixtures/                   # Page object fixtures
      pages/                      # POM
      helpers/                    # credentials, clearCartViaApi
  playwright.config.ts
```

## Quick start (E2E)

```bash
pnpm install
cp apps/web/.env.example apps/web/.env   # fill test accounts (see below)
# Create apps/web/.dev.vars with JWT_SECRET (see docs/E2E.md)
cd apps/web && pnpm exec wrangler d1 execute qademo-db --local --file=./schema.sql
pnpm exec playwright install chromium
cd ../..
pnpm run test:e2e
```

Details, troubleshooting, and subset commands: **[docs/E2E.md](./docs/E2E.md)**.

## Live demo (target app)

**URL:** https://qademo.com

### Test accounts

Seeded users used by local D1 and E2E (also set via `apps/web/.env` / CI secrets):

| Username | Password | Role | Notes |
|----------|----------|------|--------|
| `standard_user` | `standard123` | User | Authenticated project + login happy path |
| `locked_user` | `locked123` | User | Login fails (account locked) |
| `admin_user` | `admin123` | Admin | Login shows admin link; `admin.json` prepared in setup |

## Target app (upstream QADemo)

| Layer | Stack |
|-------|--------|
| Frontend | React 18, Vite, TypeScript, Tailwind, Zustand |
| API | Hono on Cloudflare Workers |
| Data | D1 (SQLite), KV (cart/sessions), R2 (images) |

Optional app docs (not part of the E2E framework):

- [REST API documentation](./docs/REST-API-DOCUMENTATION.md)
- [Postman collection](./docs/QADemo-Postman-Collection.json)
- [FRD](./docs/FRD-QADemo.md)

## License

MIT — use freely for learning and portfolio work.

## Acknowledgments

QADemo is a testing playground inspired by [SauceDemo](https://www.saucedemo.com/). This fork focuses on a production-style Playwright E2E program on top of that app.
