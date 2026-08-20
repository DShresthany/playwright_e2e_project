# Ecommerce Product Detail (PDP) Test Plan

## Application Overview

`/products/:slug` is a **public** product detail page: name, price, image, description, inventory copy from `product.stock` (D1), and cart controls. Guests can Add from the PDP (local cart persist). Authenticated tests use Playwright project **authenticated** (`storageState: e2e/.auth/standard.json`, `STANDARD_USER` / `STANDARD_PASSWORD` — env **names** only; do not hardcode secrets). Guest scenarios use **unauthenticated** (no storageState).

**Stock vs cart (verified live):** inventory UI is `product.stock`, **not** cart quantity. Add / Remove / cart qty change do **not** change “N in stock” or “Only N left”. Cart qty appears as **In Cart (qty)** on the PDP toggle button and as `navbar-cart-badge`. Assert those for group 2; do not expect stock overlays to drop after Add.

**PDP cart controls** use `product-add-to-cart-button` / `product-remove-from-cart-button` (one button; `data-testid` swaps when `inCart`). Do **not** use catalog `product-add-to-cart-{id}` as the PDP action.

OOS Add disabled is **1.3** only — do not add a second scenario solely for that.

This plan does **not** cover: catalog **card** Add/Remove (`ecommerce-catalog.md`), cart qty/clear/checkout (`ecommerce-cart.md`), invalid slug not-found (catalog **1.7**), checkout form, home, or admin.

## Independence (mandatory)

Scenarios are numbered **for readability only**. Each must be independently executable.

- Do **not** assume another scenario already ran.
- Do **not** write preconditions like “after 2.1” or “cart left by previous test”.
- Shared **auth** via `storageState` is allowed for group 2.
- Shared **cart contents** across scenarios is **not** allowed.
- Each authenticated scenario (2.1–2.5) must start from an empty cart: `clearCartViaApi` in **that** test after origin, then perform its own Add.

### Empty cart (authenticated)

Use `clearCartViaApi` from `e2e/src/helpers/cart.ts`: `DELETE /api/cart` with `X-Session-ID`, reset `cart-storage` in localStorage, reload. Call it after visiting an origin (`/catalog` or `/products/:slug`).

## Seed products observed

| id | Name | Price | Slug | Stock UI (PDP) | Add |
| --- | --- | --- | --- | --- | --- |
| 9 | Power Bank | $59.99 | `/products/power-bank` | **45 in stock**; no image overlay | enabled |
| 7 | Mechanical Keyboard | $149.99 | `/products/mechanical-keyboard` | image **Only 8 left**; detail **8 in stock** | enabled |
| 4 | Bluetooth Speaker | $159.99 | `/products/bluetooth-speaker` | image + detail **Out of Stock** | **disabled** |

Any matching stock class is valid if seed data shifts. Prefer runtime discovery: in-stock ≥ 10 (no low-stock overlay, e.g. Power Bank), low-stock catalog card → PDP, OOS catalog card → PDP.

## Locator notes (`data-testid` vs Badge)

`Badge` does **not** forward `data-testid`. These attributes are in source but **absent in the DOM**:

- `product-detail-stock-badge`
- `product-low-stock-badge` (PDP image overlay)
- `product-out-of-stock-badge` (PDP image overlay)

Assert inventory by **visible text** (same pattern as cart order-summary):

- In stock: `getByText(/\d+ in stock/)`
- Low-stock overlay: `getByText(/Only \d+ left/)`
- OOS: `getByText('Out of Stock')` (two copies on OOS PDP: image + detail)

For 1.1 “image OOS/low-stock badge count 0”: assert `getByText(/Only \d+ left/)` and `getByText('Out of Stock')` have count **0** (do not rely on overlay testids).

## Key locators (`data-testid`)

| Area | `data-testid` |
| --- | --- |
| PDP shell | `product-page`, `product-image-container`, `product-detail-image`, `product-detail-name`, `product-detail-price`, `product-detail-description`, `product-cart-actions`, `product-back-to-catalog` |
| PDP cart | `product-add-to-cart-button`, `product-remove-from-cart-button`, `product-view-cart-button` (only when in cart) |
| Inventory (source; **not in DOM**) | `product-detail-stock-badge`, `product-low-stock-badge`, `product-out-of-stock-badge` |
| Catalog arrange | `product-grid`, `product-card-{id}`, `product-link-{id}`, `product-low-stock-badge-{id}`, `product-out-of-stock-badge-{id}` |
| Catalog In Cart (2.4) | `product-in-cart-actions-{id}`, `product-remove-from-cart-{id}`, `product-go-to-cart-{id}` |
| Navbar | `navbar-cart-link`, `navbar-cart-badge` (only when totalItems &gt; 0) |
| Cart landing (2.3 / 2.5) | `cart-page`, `cart-item-{id}`, `cart-item-name-{id}`, `cart-item-increase-{id}` |

## Test Scenarios

### 1. Guest PDP (unauthenticated)

**Project:** `unauthenticated`  
**Auth:** none (do not use storageState).

#### 1.1. pdp-shows-name-price-image-description

**Preconditions:**
- Project `unauthenticated`.
- Open an in-stock PDP with stock ≥ 10 (e.g. Power Bank via `product-link-9` or `/products/power-bank`).

**Steps:**
1. From `/catalog`, open the in-stock product (or deep-link the slug).
2. Read name, price, image, description, inventory text, and Add.

**Expected assertions:**
- `product-page` is visible.
- `product-detail-name`, `product-detail-price`, `product-detail-image`, and `product-detail-description` are visible (Power Bank: “Power Bank”, `$59.99`).
- Inventory matches `/\d+ in stock/` (observed **45 in stock**). Do not require `product-detail-stock-badge` in the DOM.
- `product-add-to-cart-button` is visible and **enabled**.
- Image overlays: `getByText(/Only \d+ left/)` count **0**; `getByText('Out of Stock')` count **0**.

#### 1.2. pdp-low-stock-shows-overlay-and-stock-badge

**Preconditions:**
- Project `unauthenticated`.
- `/catalog` loaded. Use a low-stock card (Mechanical Keyboard `7`: catalog `product-low-stock-badge-7`).

**Steps:**
1. Click `product-link-7` (or the discovered low-stock card link).
2. Read image overlay and detail inventory; confirm Add enabled.

**Expected assertions:**
- URL is `/products/mechanical-keyboard` (or the discovered slug).
- Image overlay matches `/Only \d+ left/` (observed **Only 8 left**). Overlay testid is not in the DOM.
- Detail inventory matches `/\d+ in stock/` (observed **8 in stock**).
- The integer **N** is the same in both strings.
- `product-add-to-cart-button` is **enabled**.

#### 1.3. pdp-out-of-stock-add-disabled

**Preconditions:**
- Project `unauthenticated`.
- Use a real OOS product (Bluetooth Speaker `4` via `product-link-4`).

**Steps:**
1. Open the OOS PDP from the catalog card (or `/products/bluetooth-speaker`).
2. Inspect inventory copy and cart controls.

**Expected assertions:**
- Image and detail both show “Out of Stock” (two visible instances). Overlay/detail testids are not in the DOM.
- `product-add-to-cart-button` is **disabled** (user cannot add).
- `product-view-cart-button` is **absent**.

#### 1.4. pdp-back-to-catalog

**Preconditions:**
- Project `unauthenticated`.
- In-stock PDP open (e.g. Power Bank).

**Steps:**
1. Click `product-back-to-catalog`.

**Expected assertions:**
- URL is `/catalog`.
- Catalog shell is visible (`catalog-page` / `product-grid`).

#### 1.5. pdp-deep-link-by-slug

**Preconditions:**
- Project `unauthenticated`.
- Known in-stock slug (Power Bank).

**Steps:**
1. Go directly to `/products/power-bank` (do not require a prior catalog click).

**Expected assertions:**
- URL is `/products/power-bank`.
- `product-detail-name` is “Power Bank”.
- `product-detail-price` is `$59.99`.

#### 1.6. guest-pdp-checkout-login-returns-to-checkout

**Preconditions:**
- Project `unauthenticated`.
- Arrange independently (do not assume cart **1.4** already ran — this seeds via **PDP** Add, not catalog card Add).
- `STANDARD_USER` / `STANDARD_PASSWORD` available (env names only).

**Steps:**
1. From `/catalog`, open an in-stock PDP; click `product-add-to-cart-button`.
2. Click `product-view-cart-button` (or navbar cart); confirm line on `/cart`.
3. Click `proceed-to-checkout-button`; confirm `/login`.
4. Log in as `STANDARD_USER`.

**Expected assertions:**
- After login: URL is `/checkout`.
- `checkout-page` is visible; `checkout-heading` is “Checkout”.
- Do **not** fill or submit the checkout form.

### 2. Authenticated PDP cart (standard user)

**Project:** `authenticated`  
**Auth:** `storageState` for `STANDARD_USER`. Each scenario: origin, then `clearCartViaApi`, then its own Add.

Do **not** assert catalog card Add as the behavior under test (2.4 only **reads** the card after PDP Add). Do **not** assert cart qty controls/totals except 2.5’s increase as arrangement for PDP qty text.

#### 2.1. pdp-add-shows-in-cart-and-view-cart

**Preconditions:**
- Project `authenticated`.
- In this scenario: visit origin, `clearCartViaApi`, open in-stock PDP (Power Bank). Capture inventory text **before** Add.

**Steps:**
1. Click `product-add-to-cart-button`.
2. Re-read inventory text, cart button, View Cart, navbar badge.

**Expected assertions:**
- `product-add-to-cart-button` is gone; `product-remove-from-cart-button` is visible with text `/In Cart \(1\)/`.
- `product-view-cart-button` is visible.
- `navbar-cart-badge` is `1`.
- Stock copy is **unchanged** (still `/\d+ in stock/` with the same N; no new “Only N left” if none existed).

#### 2.2. pdp-remove-restores-add

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, open in-stock or low-stock PDP, Add once. Capture inventory before Add.

**Steps:**
1. Click `product-add-to-cart-button`.
2. Click `product-remove-from-cart-button`.
3. Re-read inventory.

**Expected assertions:**
- `product-add-to-cart-button` is visible and **enabled** (“Add to Cart”).
- `product-view-cart-button` is **absent**.
- `navbar-cart-badge` is **absent**.
- Stock copy unchanged (low-stock example: still **Only 8 left** and **8 in stock**).

#### 2.3. pdp-view-cart-navigates-to-cart

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, open in-stock PDP, Add.

**Steps:**
1. Click `product-add-to-cart-button`.
2. Click `product-view-cart-button`.

**Expected assertions:**
- URL is `/cart`; `cart-page` is visible.
- Line for that product is present (`cart-item-{id}`, name matches).
- Do **not** assert qty steppers, line subtotals, or order totals.

#### 2.4. pdp-add-reflects-on-catalog-card

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, open in-stock PDP (note `id` / name), Add.

**Steps:**
1. Click `product-add-to-cart-button` on the PDP.
2. Go to `/catalog`.
3. Inspect the same `product-card-{id}`.

**Expected assertions:**
- `product-in-cart-actions-{id}` is visible.
- `product-remove-from-cart-{id}` and `product-go-to-cart-{id}` are visible.
- `product-add-to-cart-{id}` is **absent**.

#### 2.5. pdp-in-cart-qty-matches-cart-increase

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add on in-stock PDP, then use `/cart` only to set qty to 2.

**Steps:**
1. Add on PDP (`/In Cart \(1\)/`).
2. Open `/cart` (`product-view-cart-button` or navbar).
3. Click `cart-item-increase-{id}` once (qty 2). Do not assert totals.
4. Return to the same PDP (`/products/:slug` or cart image/name link).

**Expected assertions:**
- `product-remove-from-cart-button` matches `/In Cart \(2\)/`.
- `navbar-cart-badge` is `2`.
- Stock copy still unchanged (e.g. **45 in stock**).

### 3. Guest PDP persist (optional)

**Project:** `unauthenticated`

#### 3.1. guest-pdp-add-persists

**Preconditions:**
- Project `unauthenticated`.
- Fresh context (empty cart-storage). In-stock PDP (Power Bank).

**Steps:**
1. Click `product-add-to-cart-button`.
2. Confirm In Cart (1).
3. Reload the PDP.

**Expected assertions:**
- After Add and after reload: `product-remove-from-cart-button` with `/In Cart \(1\)/`; `product-view-cart-button` visible; `navbar-cart-badge` is `1`.
- Stock copy unchanged.

## Out of scope

- Catalog card Add/Remove as primary tests (`ecommerce-catalog.md`).
- Cart qty/clear/checkout beyond 2.3 landing, 2.5 increase-as-arrange, and **1.6** checkout landing after login (`ecommerce-cart.md`).
- Invalid slug / `product-not-found` (catalog **1.7** — do not duplicate).
- Expecting “N in stock” / “Only N left” to decrease after Add/Remove.
- Checkout form fill/submit, home, admin.
