# Ecommerce Cart Test Plan

## Application Overview

`/cart` is a **public** route. Empty cart shows `cart-empty-state`; a filled cart shows line items, quantity controls, order summary, Clear Cart, Continue Shopping, and Proceed to Checkout. **Checkout** is protected: guests who click Proceed to Checkout go to `/login` with return intent `{ from: { pathname: '/checkout' } }`; authenticated users land on `/checkout` (`checkout-page`). Do not fill or submit the checkout form.

Catalog **card Add** is arrangement only (not the behavior under test). Login and catalog browse/stock-badge suites are out of scope.

Authenticated tests use Playwright project **authenticated** (`storageState: e2e/.auth/standard.json`, `STANDARD_USER`). Guest scenarios use **unauthenticated**.

## Independence (mandatory)

Scenarios are numbered **for readability only**. Each must be independently executable.

- Do **not** assume another scenario already ran.
- Do **not** write preconditions like “after 2.2” or “cart left by previous test”.
- Shared **auth** via `storageState` is allowed for group 2.
- Shared **cart contents** across scenarios is **not** allowed.
- Each authenticated scenario that needs an empty cart must **clear in that scenario**. Each that needs items must **add in that scenario after clearing**.

### Empty cart (authenticated)

Use `clearCartViaApi` from `e2e/src/helpers/cart.ts`: `DELETE /api/cart` with `X-Session-ID`, reset `cart-storage` in localStorage, reload. Call it after visiting an origin (`/catalog` or `/cart`).

### Seed one or more in-stock items (authenticated)

After empty-cart arrange, go to `/catalog` and click enabled `product-add-to-cart-{id}` (card Add). Prefer runtime discovery of enabled Add buttons; do not hard-require a single id. Then open `/cart` via `navbar-cart-link` (or `product-go-to-cart-{id}` as navigation only).

## Quantity vs line remove vs badge vs line count

| Control | Effect |
| --- | --- |
| `cart-item-increase-{id}` / `cart-item-decrease-{id}` | Change **quantity on that line**. Decrease is **disabled at qty 1**. Increase is **disabled when qty ≥ product.stock**. |
| `cart-item-remove-{id}` | Removes the **entire line** at any qty (does not decrement by 1). |
| `navbar-cart-badge` | `totalItems` = **sum of quantities**. **Absent** when totalItems is 0. |
| `cart-item-count` | `items.length` = **number of lines** (e.g. one line at qty 2 still reads “1 items in your cart”). |

## Seed products observed

| id | Name | Price | Stock (observed) | Notes |
| --- | --- | --- | --- | --- |
| 9 | Power Bank | $59.99 | 45 (schema; in stock) | Typical single-line seed |
| 1 | Wireless Headphones | $199.99 | 99 | Second distinct in-stock line |
| 7 | Mechanical Keyboard | $149.99 | **8** (PDP: “8 in stock”, “Only 8 left”) | Low stock; increase disabled at qty 8 |

Also in stock (enabled Add): Smart Watch `2`, Webcam `10`. OOS cards must not be used to seed.

## Key locators (`data-testid`)

| Area | `data-testid` |
| --- | --- |
| Empty cart | `cart-page`, `cart-empty-state`, `cart-empty-heading`, `continue-shopping-button` |
| Filled cart | `cart-heading`, `cart-item-count`, `clear-cart-button`, `cart-items-list` |
| Line | `cart-item-{id}`, `cart-item-name-{id}`, `cart-item-image-link-{id}`, `cart-item-price-{id}`, `cart-item-quantity-{id}`, `cart-item-subtotal-{id}`, `cart-item-quantity-controls-{id}`, `cart-item-increase-{id}`, `cart-item-decrease-{id}`, `cart-item-remove-{id}` |
| Summary | `cart-order-summary`, `order-summary-heading`, `order-subtotal`, `order-shipping`, `order-total`, `proceed-to-checkout-button`, `continue-shopping-link-button` |
| Navbar | `navbar-cart-link`, `navbar-cart-badge` |
| Catalog arrange | `product-add-to-cart-{id}` |
| Checkout landing (2.9 only) | `checkout-page`, `checkout-heading` |
| Guest checkout redirect (1.3) | `login-page` |

## Test Scenarios

### 1. Guest cart (unauthenticated)

**Project:** `unauthenticated`  
**Auth:** none.

#### 1.1. guest-empty-cart-page

**Preconditions:**
- Project `unauthenticated`.
- Fresh context (no cart-storage). Open `/cart`.

**Steps:**
1. Go to `/cart`.

**Expected assertions:**
- URL is `/cart`.
- `cart-page` is visible.
- `cart-empty-state` is visible.
- `cart-empty-heading` is “Your cart is empty”.
- `navbar-cart-badge` is not present.

#### 1.2. guest-empty-cart-continue-shopping

**Preconditions:**
- Project `unauthenticated`.
- `/cart` shows empty state (fresh context or empty cart).

**Steps:**
1. Go to `/cart`.
2. Click `continue-shopping-button`.

**Expected assertions:**
- URL is `/catalog`.
- Catalog is visible (`catalog-page` or heading “Product Catalog”).

#### 1.3. guest-proceed-to-checkout-redirects-to-login

**Preconditions:**
- Project `unauthenticated`.
- Guest **can** seed a cart: catalog card Add persists in client `cart-storage` (observed: Add on Power Bank `9` → `product-in-cart-actions-9`, badge `1`, `/cart` filled). **Not BLOCKED.**

**Steps:**
1. Go to `/catalog`; click enabled `product-add-to-cart-{id}`.
2. Open `/cart`.
3. Click `proceed-to-checkout-button`.

**Expected assertions:**
- URL is `/login`; `login-page` is visible.

#### 1.4. guest-checkout-login-returns-to-checkout

**Preconditions:**
- Project `unauthenticated`.
- Arrange independently (do not assume 1.3 already ran).
- `STANDARD_USER` / `STANDARD_PASSWORD` available.

**Steps:**
1. Go to `/catalog`; click enabled `product-add-to-cart-{id}`.
2. Open `/cart`; click `proceed-to-checkout-button`.
3. Confirm `/login` is shown.
4. Log in as `STANDARD_USER`.

**Expected assertions:**
- After login: URL is `/checkout`.
- `checkout-page` is visible; `checkout-heading` is “Checkout”.
- Do **not** fill or submit the checkout form.

### 2. Authenticated cart page (authenticated)

**Project:** `authenticated` (`e2e/.auth/standard.json`)  
**Auth:** `STANDARD_USER` (do not UI-login).  
**Arrange:** `clearCartViaApi` then catalog card Add as needed.

#### 2.1. empty-cart-after-clear

**Preconditions:**
- Project `authenticated`.
- In this scenario: visit `/catalog` or `/cart`, then `clearCartViaApi`.

**Steps:**
1. Visit `/cart` (or `/catalog` then `/cart`) and `clearCartViaApi`.
2. Observe empty cart and navbar.

**Expected assertions:**
- `cart-empty-state` and `cart-empty-heading` (“Your cart is empty”) are visible.
- No `cart-item-{id}` rows; `cart-items-list` not shown.
- `navbar-cart-badge` is not visible.

#### 2.2. filled-cart-shows-line-and-summary

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, then Add one in-stock product from catalog card, then open `/cart`.

**Steps:**
1. `clearCartViaApi`.
2. On `/catalog`, click enabled `product-add-to-cart-{id}` (observed: Power Bank `9`, `$59.99`).
3. Open `/cart`.

**Expected assertions:**
- `cart-heading` is “Shopping Cart”.
- `cart-item-count` reflects 1 line (e.g. “1 items in your cart”).
- `cart-item-{id}` visible; `cart-item-name-{id}`, `cart-item-price-{id}`, `cart-item-quantity-{id}` (`1`), `cart-item-subtotal-{id}` (equals unit price at qty 1).
- `cart-order-summary`, `order-subtotal`, `order-shipping` (“Free”), `order-total` visible; subtotal and total match line subtotal.
- `navbar-cart-badge` shows `1`.
- `proceed-to-checkout-button` visible (do not click in this scenario).

#### 2.3. increase-quantity-updates-totals-and-badge

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add one in-stock product with stock &gt; 1, open `/cart` at qty 1.

**Steps:**
1. Arrange as in 2.2 (independently).
2. Confirm `navbar-cart-badge` is `1` and `cart-item-decrease-{id}` is disabled.
3. Click `cart-item-increase-{id}`.

**Expected assertions:**
- `cart-item-quantity-{id}` is `2`.
- Line subtotal and `order-total` equal unit price × 2 (observed Power Bank: `$119.98`).
- `navbar-cart-badge` is `2`.
- Decrease is enabled.

#### 2.4. decrease-quantity-disabled-at-one

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add one in-stock product, open `/cart`, increase to qty 2 (this scenario’s own increase).

**Steps:**
1. Arrange qty 2 on `/cart` as above.
2. Confirm badge `2` and decrease enabled.
3. Click `cart-item-decrease-{id}`.

**Expected assertions:**
- Quantity is `1`; subtotal/total return to unit price; `navbar-cart-badge` is `1`.
- `cart-item-decrease-{id}` is **disabled**.

#### 2.5. increase-disabled-at-product-stock

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`. Use a **low-stock** in-stock product so the ceiling is reachable (observed: Mechanical Keyboard `7`, stock **8** from PDP `product-detail-stock-badge` “8 in stock”). Discover via `product-low-stock-badge-{id}` or PDP stock text; do not assume 8 if seed changes.

**Steps:**
1. `clearCartViaApi`.
2. Optionally read stock `N` from PDP (`{N} in stock`).
3. Add that product from **catalog card**; open `/cart`.
4. Click `cart-item-increase-{id}` until quantity equals `N`.

**Expected assertions:**
- `cart-item-quantity-{id}` is `N`.
- `cart-item-increase-{id}` is **disabled**.
- `navbar-cart-badge` is `N` (observed `8`).

#### 2.6. remove-line-at-qty-one-shows-empty

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add one in-stock product, open `/cart` at qty 1.

**Steps:**
1. Arrange one line at qty 1.
2. Click `cart-item-remove-{id}` (not decrease).

**Expected assertions:**
- `cart-empty-state` visible; `cart-item-{id}` gone.
- `navbar-cart-badge` not visible.

#### 2.7. clear-cart-button-empties-cart

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add ≥1 in-stock product, open filled `/cart`.

**Steps:**
1. Arrange filled cart.
2. Click `clear-cart-button`.

**Expected assertions:**
- `cart-empty-state` visible; no line items.
- `navbar-cart-badge` not visible.

#### 2.8. continue-shopping-from-filled-cart

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add one in-stock product, open filled `/cart`.

**Steps:**
1. Arrange filled cart.
2. Click `continue-shopping-link-button` (summary; not the empty-state `continue-shopping-button`).

**Expected assertions:**
- URL is `/catalog`.

#### 2.9. proceed-to-checkout-authenticated

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add one in-stock product, open filled `/cart`.

**Steps:**
1. Arrange filled cart.
2. Click `proceed-to-checkout-button`.

**Expected assertions:**
- URL is `/checkout`.
- `checkout-page` visible (`checkout-heading` “Checkout” if present).
- Do **not** fill or submit the checkout form.

#### 2.10. two-products-then-remove-one

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, then Add **two distinct** in-stock products from catalog (enabled Add, different ids). Observed: Power Bank `9` (`$59.99`) and Wireless Headphones `1` (`$199.99`).

**Steps:**
1. `clearCartViaApi`.
2. On `/catalog`, Add product A and product B.
3. Open `/cart`.
4. Assert two lines, counts, totals, badge.
5. Click `cart-item-remove-{id}` for **one** product.

**Expected assertions (after step 3):**
- Two `cart-item-{id}` rows.
- `cart-item-count` reflects 2 (e.g. “2 items in your cart”).
- Each line has its own name/price/qty (`1`)/subtotal.
- `order-subtotal` / `order-total` equal sum of line subtotals (observed `$259.98`).
- `navbar-cart-badge` is `2` (qty 1 each).

**Expected assertions (after step 5):**
- Removed `cart-item-{id}` gone; the other line remains; cart **not** empty.
- `cart-item-count` reflects 1; `navbar-cart-badge` is remaining total qty (`1`).

#### 2.11. remove-line-at-qty-greater-than-one

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add **one** in-stock product, open `/cart`, increase qty to ≥ 2 (this scenario’s own increase).

**Steps:**
1. Arrange one line.
2. Click `cart-item-increase-{id}` until qty ≥ 2; confirm badge matches qty (observed qty `2`, badge `2`).
3. Click `cart-item-remove-{id}` (not decrease).

**Expected assertions:**
- Entire line is removed (quantity is **not** left at qty−1).
- `cart-item-{id}` not visible; `cart-empty-state` visible (only product).
- `navbar-cart-badge` not visible.

#### 2.12. cart-line-name-opens-pdp

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add one in-stock product from catalog card, open `/cart`.

**Steps:**
1. Arrange one line on `/cart`.
2. Click `cart-item-name-{id}`.

**Expected assertions:**
- URL is a product PDP (`/products/...`).
- `product-page` is visible.
- PDP name and price match the cart line.

#### 2.13. cart-line-image-opens-pdp

**Preconditions:**
- Same independent arrange as 2.12.

**Steps:**
1. Arrange one line on `/cart`.
2. Click `cart-item-image-link-{id}`.

**Expected assertions:**
- Same as 2.12 (PDP matches the cart line).

#### 2.14. filled-cart-survives-reload

**Preconditions:**
- Project `authenticated`.
- In this scenario: `clearCartViaApi`, Add one in-stock product from catalog card.

**Steps:**
1. Add from catalog card (In Cart visible).
2. Reload `/catalog`.
3. Open `/cart` via navbar.
4. Reload `/cart`.

**Expected assertions:**
- After catalog reload: `product-in-cart-actions-{id}` still visible.
- After cart reload: `cart-item-{id}` visible; name matches; qty `1`; `navbar-cart-badge` is `1`.
