# Ecommerce Checkout Test Plan

## Application Overview

`/checkout` is a **protected** route (`ProtectedRoute`). Guests who open `/checkout` are sent to `/login` (return state `{ from: location }`). Authenticated users with an **empty** cart see `checkout-empty-cart` (“Your cart is empty” / “Add items to your cart before checkout.” / Continue Shopping → `/catalog`). Authenticated users with a **filled** cart see `checkout-form` (shipping + payment) and an order summary.

**Generator implements Core only. Deferred scenarios are documented for future coverage; do not generate tests for Deferred until asked.**

Guest proceed-to-checkout from a **filled cart** → `/login` and login-return → `/checkout` are already in `ecommerce-cart.md` (1.3 / 1.4). Do **not** duplicate those. Core **1.1** is a **deep-link** to `/checkout` with an **empty** guest cart (no seed, no place order). **Live:** that deep-link does **not** show the empty-checkout shell; it shows `/login`. The empty-checkout shell + Continue Shopping is Core **2.1** (authenticated).

Place order writes **shared D1 stock** and creates an order for `standard_user`. Core place-order scenarios **must** seed **Webcam** only (`id` 10, slug `webcam`, observed **$69.99**, seed stock **~998**). Do **not** use Power Bank or Mechanical Keyboard for v1 place-order. Do **not** require a buyer pool or admin restock in Core. Do **not** assert “user has exactly N orders” or global order counts. Assert only **this** order (confirmation URL `/orders/:id`, order #, shipping, line).

Auth cart isolation: `storageState` (`e2e/.auth/standard.json`) **strips `session_id`**. Each authenticated scenario that needs cart must `clearCartViaApi` after origin, then seed in **that** scenario.

Test payment: Luhn-valid number; UI placeholder `4242 4242 4242 4242` is fine. Env names only (`STANDARD_USER` / `STANDARD_PASSWORD`) — no hardcoded secrets.

Catalog/PDP Add is **arrangement only**. Do not fill checkout in cart/PDP suites.

## Independence (mandatory)

Scenarios are numbered **for readability only**. Each must be independently executable.

- Do **not** assume another scenario already ran.
- Do **not** write preconditions like “after 2.6” or “order left by previous test”.
- Shared **auth** via `storageState` is allowed for Core group 2.
- Shared **cart contents** across scenarios is **not** allowed.
- Each authenticated scenario that needs an empty cart must **clear in that scenario**. Each that needs Webcam must **add Webcam in that scenario after clearing**.
- Place-order scenarios (2.6, 2.7, and Deferred 3.x) must each **place their own** Webcam (or documented) order. Do not reuse another test’s confirmation URL. Deferred **3.4** additionally re-reads PDP stock after its own place-order.

### Empty cart (authenticated)

Use `clearCartViaApi` from `e2e/src/helpers/cart.ts`: `DELETE /api/cart` with `X-Session-ID`, reset `cart-storage` in localStorage, reload. Call it after visiting an origin (`/catalog`, `/cart`, or `/checkout`).

### Seed Webcam qty 1 (authenticated, Core place-order / filled checkout)

After empty-cart arrange, on `/catalog` click `product-add-to-cart-10` (or PDP Add on `/products/webcam`). Prefer id **10** / slug **webcam** for Core (high stock). Then open `/checkout` (navbar cart → Proceed to Checkout, or `goto /checkout`).

## Place-order stock side effect

`Place Order` creates an order and decrements product stock in D1. Webcam’s high seed (~998) is the Core parallel strategy: several qty-1 orders in CI should not exhaust stock. Core does **not** assert stock dropped. Deferred **3.4** is the roadmap scenario that asserts PDP inventory **N → N−1** after place-order (with restock teardown recommended). Prefer data isolation over `workers: 1` for the whole suite.

## Seed product observed (place-order)

| id | Name | Price | Slug | Stock (observed) | Core use |
| --- | --- | --- | --- | --- | --- |
| 10 | Webcam | $69.99 | `/products/webcam` | **998** | **Required** for Core 2.2–2.7 place-order / filled checkout |
| 9 | Power Bank | $59.99 | `/products/power-bank` | in stock (lower than Webcam) | Deferred 3.2 second line only — **not** Core place-order |

## Locator notes (`data-testid` vs Card / Badge / Input)

`Card` does **not** forward `data-testid`. These are in source but **absent in the DOM**: `shipping-section`, `payment-section`, `order-status-card`, `order-shipping-card`, `order-items-card`. Assert headings / fields / copy instead (`shipping-heading`, `payment-heading`, `order-items-heading`).

`Badge` does **not** forward `data-testid`. `order-confirmation-status` is **not** in the DOM; status copy (e.g. “Pending”) is visible as text.

`Input` **does** forward `data-testid` onto the `<input>`. Field errors are red `<p>` text **without** testids (address uses `role="alert"`). Assert `getByText('First name is required')` etc.

Checkout **order summary** has **no** testids. Assert visible copy: product name, `Qty: N`, line/subtotal/total prices, “Order Summary”, “Shipping” / “Free”.

## Key locators (`data-testid`)

| Area | `data-testid` |
| --- | --- |
| Empty checkout | `checkout-page`, `checkout-empty-cart`, `checkout-continue-shopping-button` |
| Filled checkout | `checkout-page`, `checkout-heading`, `checkout-form`, `back-to-cart-link`, `place-order-button` |
| Shipping fields | `checkout-first-name`, `checkout-last-name`, `checkout-address`; heading `shipping-heading` |
| Payment fields | `checkout-card-number`, `checkout-expiry`, `checkout-cvv`, `checkout-cardholder-name`; heading `payment-heading` |
| Submit error | `checkout-error`, `checkout-error-message` (Luhn / API — **not** empty required fields) |
| Confirmation | `order-confirmation-page`, `order-success-header`, `order-confirmation-heading`, `order-confirmation-number`, `order-confirmation-date`, `order-shipping-name`, `order-shipping-address`, `order-items-heading` |
| Confirmation (source; often **not in DOM**) | `order-status-card`, `order-shipping-card`, `order-items-card`, `order-confirmation-status` |
| Cart after order | `cart-empty-state`, `cart-empty-heading`, `navbar-cart-badge` (absent when 0) |
| Catalog seed | `product-add-to-cart-10`, `product-in-cart-actions-10` |
| Cart qty (Deferred 3.1 arrange) | `cart-item-10`, `cart-item-increase-10`, `cart-item-quantity-10` |
| Orders list (Deferred 3.3) | `orders-page`, `orders-heading`, `orders-list`, `order-item-{id}`, `order-link-{id}`, `order-number-{id}`; navbar `navbar-username-link` → `/orders` |
| Guest redirect (1.1) | `login-page` |
| Proceed to checkout (arrange) | `proceed-to-checkout-button` |

## Tag guidance (Generator)

- Describe: `@checkout`
- Core **2.6** (happy path): `@smoke` `@critical`
- Other Core: `@critical`

---

## Core (v1) — implement now

### 1. Guest checkout deep-link (unauthenticated)

**Project:** `unauthenticated`  
**Auth:** none (do not use storageState).

#### 1.1. guest-checkout-deep-link-empty

**Preconditions:**
- Project `unauthenticated`.
- Fresh context. Do **not** seed a guest cart. Do **not** place an order.

**Steps:**
1. Go to `/checkout`.

**Expected assertions:**
- URL is `/login` (`ProtectedRoute`; observed live).
- `login-page` is visible.
- `checkout-page` / `checkout-empty-cart` are **not** shown.
- Do not fill or submit the login form (cart 1.4 already covers login-return to checkout).

The empty-checkout shell and Continue Shopping → `/catalog` are **2.1**.

---

### 2. Authenticated checkout (standard_user)

**Project:** `authenticated`  
**Auth:** `storageState: e2e/.auth/standard.json` (`STANDARD_USER`). Do not UI-login in these tests.

#### 2.1. auth-empty-checkout-shows-empty-cart-ui

**Preconditions:**
- Project `authenticated`.
- In this scenario: visit origin, `clearCartViaApi`. Do not seed products.

**Steps:**
1. Go to `/checkout`.
2. Click `checkout-continue-shopping-button`.

**Expected assertions:**
- After step 1: URL is `/checkout`; `checkout-page` visible; `checkout-empty-cart` visible; heading/copy “Your cart is empty”; `checkout-continue-shopping-button` visible; `checkout-form` absent; `navbar-cart-badge` absent.
- After step 2: URL is `/catalog`; catalog shell visible.

#### 2.2. filled-checkout-shows-form-and-webcam-summary

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, seed **Webcam** qty **1** (catalog `product-add-to-cart-10` or PDP).

**Steps:**
1. Open `/checkout`.

**Expected assertions:**
- URL is `/checkout`; `checkout-heading` is “Checkout”.
- `checkout-form` visible; `shipping-heading` “Shipping Information”; `payment-heading` “Payment Information”.
- Fields visible: `checkout-first-name`, `checkout-last-name`, `checkout-address`, `checkout-card-number` (placeholder `4242 4242 4242 4242`), `checkout-expiry`, `checkout-cvv`, `checkout-cardholder-name`, `place-order-button`.
- Summary (no testids): “Webcam”, “Qty: 1”, **$69.99** line/subtotal/total; Shipping **Free**; Place Order button includes **$69.99** (observed “Place Order - $69.99”).
- Do not submit.

#### 2.3. filled-checkout-back-to-cart

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, seed Webcam qty 1, open `/checkout`.

**Steps:**
1. Click `back-to-cart-link`.

**Expected assertions:**
- URL is `/cart`.
- `cart-page` visible; Webcam line present (`cart-item-10`). Do not assert qty totals/checkout form.

#### 2.4. empty-form-shows-required-field-validation

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, seed Webcam qty 1, open filled `/checkout`. Leave all fields empty.

**Steps:**
1. Click `place-order-button`.

**Expected assertions:**
- Still `/checkout` (no confirmation).
- `checkout-error` is **absent** (required errors are field-level, not the Luhn banner).
- Visible copy: “First name is required”, “Last name is required”, “Address is required”, “Card number is required”, “Expiry is required”, “CVV is required”, “Name is required”.

#### 2.5. invalid-luhn-card-shows-checkout-error

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, seed Webcam qty 1, open `/checkout`.

**Steps:**
1. Fill shipping + payment with a **16-digit** number that **fails Luhn** but still matches the field pattern (observed: `4242 4242 4242 4241` after formatting). Use any Luhn-invalid 16-digit value; do not use the placeholder valid card.
2. Fill expiry `MM/YY` (e.g. `12/30`), CVV 3–4 digits, name on card, first/last/address.
3. Click `place-order-button`.

**Expected assertions:**
- Still `/checkout`.
- `checkout-error` visible; `checkout-error-message` is “Invalid card number. Please check and try again.”
- No navigation to `/orders/:id`.

#### 2.6. place-webcam-order-shows-confirmation

**Tags (Generator):** `@smoke` `@critical`

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, seed **Webcam qty 1**, open `/checkout`. Do not assert stock change or order-list counts.

**Steps:**
1. Fill valid shipping (any non-empty first/last/address).
2. Fill payment: Luhn-valid card (placeholder `4242 4242 4242 4242` OK), expiry `MM/YY`, CVV, name on card.
3. Click `place-order-button`.

**Expected assertions:**
- URL matches `/orders/\d+`.
- `order-confirmation-page` visible; `order-confirmation-heading` is “Order Confirmed!”.
- `order-confirmation-number` matches `/Order #\d+/` and the id in the URL.
- `order-shipping-name` matches the submitted first + last name; `order-shipping-address` matches the submitted address.
- `order-items-heading` “Order Items”; line copy includes **Webcam**, qty **1**, **$69.99** (observed `$69.99 × 1` and total `$69.99`).
- Do **not** assert D1 stock, “Pending” as the only allowed status, or how many orders the user has.

**Note:** Generator **may** fold 2.7 asserts into this test if cleaner; keep scenario id **2.7** in the plan either way.

#### 2.7. after-place-order-cart-is-empty

**Preconditions:**
- Project `authenticated`.
- Independent arrange: in **this** scenario, `clearCartViaApi`, seed Webcam qty 1, place a valid order (same as 2.6). Do not reuse 2.6’s order.

**Steps:**
1. Place the Webcam order (or, if folded into 2.6, continue after confirmation).
2. Open `/cart` (and/or inspect navbar on the confirmation page).

**Expected assertions:**
- `navbar-cart-badge` is **absent** (observed immediately on confirmation).
- `/cart` shows `cart-empty-state` / “Your cart is empty”.

---

## Deferred (v2+) — roadmap only; do not implement until a later Generator prompt

Each item below is **Deferred**. Full steps are recorded so a later Generator can implement without re-exploration. Reuse Core confirmation locators. Prefer **high-stock** SKUs only. Assert **this order** only.

#### 3.1. checkout-webcam-qty-2-confirmation — Deferred

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, seed Webcam (`product-add-to-cart-10`), open `/cart`, increase to qty **2** (`cart-item-increase-10`). Do not use Keyboard / low-stock SKUs.

**Steps:**
1. Open `/checkout`. Confirm summary “Webcam”, “Qty: 2”, line total **$139.98** (2 × $69.99).
2. Fill valid shipping + Luhn-valid payment.
3. Click `place-order-button`.

**Expected assertions:**
- `/orders/:id`; heading “Order Confirmed!”; order # matches URL.
- Confirmation line: Webcam, quantity **2** (observed pattern `$69.99 × 2`), total **$139.98**.
- Do not assert global order counts or stock remaining.

#### 3.2. checkout-two-high-stock-lines — Deferred

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, seed **two high-stock** products qty 1 each (e.g. Webcam `10` + Power Bank `9`). Prefer high-stock SKUs only.

**Steps:**
1. Open `/checkout`. Summary shows **both** names, each “Qty: 1”, combined total (Webcam $69.99 + Power Bank $59.99 → **$129.98** if those prices hold).
2. Fill valid shipping + payment; Place Order.

**Expected assertions:**
- Confirmation lists **both** line names and qty 1 each; total matches this order.
- Do not assert order-history length.

#### 3.3. order-confirmation-appears-in-orders-list — Deferred (optional)

**Preconditions:**
- Project `authenticated`.
- In this scenario: place a Webcam order (same arrange as 2.6). Capture confirmation id from URL / `order-confirmation-number`.

**Steps:**
1. Open `/orders` via `navbar-username-link` (or `goto /orders`).
2. Find **this** order: `order-item-{id}`, `order-link-{id}` href `/orders/{id}`, `order-number-{id}` “Order #{id}”.

**Expected assertions:**
- `orders-page` / `orders-heading` “My Orders”; `orders-list` visible.
- The row for **this** id is visible (clicking the link may return to the same confirmation).
- Do **not** assert list length or that this is the only/newest order.

#### 3.4. place-order-decrements-pdp-stock — Deferred

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, open Webcam PDP (`/products/webcam` or catalog → Webcam). Capture inventory text **before** Add (e.g. `/\d+ in stock/` → parse **N**). Qty **1** only. Prefer Webcam (high stock).
- Parallel-sensitive: after assert, prefer **admin restock** teardown (Deferred infra) so CI stock does not drift; do not use low-stock Keyboard for this scenario.

**Steps:**
1. On Webcam PDP, record stock copy **N** (detail `/\d+ in stock/`; overlay count if present).
2. Add Webcam qty 1 → open `/checkout` → fill valid shipping + Luhn-valid payment → Place Order.
3. Return to `/products/webcam` (deep-link or catalog link). Re-read inventory.

**Expected assertions:**
- Place order succeeds for **this** order (`/orders/:id` confirmation — may reuse Core 2.6 asserts lightly).
- PDP inventory shows **N − 1** (e.g. “998 in stock” → “997 in stock”).
- Do **not** assert global order counts.
- Do **not** expect stock to change from cart Add alone (PDP Core: Add/Remove leave stock unchanged; only Place Order decrements D1).

### Deferred infra (not UI scenarios)

Do **not** implement these in Core Generator work.

- **Buyer pool:** extra standard users + per-user `storageState` if many place-order tests share order-history risk (especially 3.3).
- **Admin restock:** restock Webcam (or a dedicated SKU) if stock drift appears under CI — especially after **3.4** asserts N−1.
- Prefer isolation over serializing the whole suite (`workers: 1`).

---

## Out of scope (not Core, not Deferred UI)

- Cart qty/clear/guest **Proceed to Checkout** redirect (`ecommerce-cart.md` 1.3 / 1.4).
- Catalog/PDP Add as primary behavior (arrangement only).
- Admin order status changes, real payment gateway, inventory-exhaustion races.
- Login, catalog browse, PDP, home.
- Serializing the entire Playwright suite instead of Webcam isolation.
