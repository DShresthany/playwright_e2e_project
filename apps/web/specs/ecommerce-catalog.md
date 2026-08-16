# Ecommerce Catalog Test Plan

## Application Overview

`/catalog` is public: heading, grid, product cards (name, price, image, stock badges), and links to product detail. Catalog **card** Add / Remove / “In Cart” cart mutations require a logged-in standard user (`storageState: e2e/.auth/standard.json`). There is no search, filter, or sort. This plan does not cover PDP add/remove, cart line qty/totals, or checkout.

## Independence (mandatory)

Scenarios are numbered **for readability only**. Each must be independently executable.

- Do **not** assume another scenario already ran.
- Do **not** write preconditions like “after 2.1” or “cart left by previous test”.
- Shared **auth** via `storageState` is allowed for group 2.
- Shared **cart contents** across scenarios is **not** allowed.
- Each authenticated scenario (2.1–2.4) must start from an empty cart: if items are present, clear them in **that** test, then perform its own Add/remove.

### Empty cart (authenticated only)

Use `clearCartViaApi` from `e2e/src/helpers/cart.ts` (or equivalent): it `DELETE`s `/api/cart` with `X-Session-ID`, resets `cart-storage` in localStorage, and reloads. Call it after the page has an origin (e.g. after visiting `/catalog`) whenever the cart is not empty, so the scenario starts empty.

## Seed products observed

| id | Name | Price | Slug | Stock UI | Catalog Add |
| --- | --- | --- | --- | --- | --- |
| 9 | Power Bank | $59.99 | `/products/power-bank` | none | enabled (in stock) |
| 1 | Wireless Headphones | $199.99 | `/products/wireless-headphones` | none | enabled |
| 2 | Smart Watch | $299.99 | `/products/smart-watch` | none | enabled |
| 10 | Webcam | $69.99 | `/products/webcam` | none | enabled |
| 7 | Mechanical Keyboard | $149.99 | `/products/mechanical-keyboard` | **Low Stock** | enabled |
| 4 | Bluetooth Speaker | $159.99 | `/products/bluetooth-speaker` | **Out of Stock** | disabled |
| 5 | Fitness Tracker | $89.99 | `/products/fitness-tracker` | Out of Stock | disabled |
| 3 | Laptop Backpack | $49.99 | `/products/laptop-backpack` | Out of Stock | disabled |
| 8 | Wireless Mouse | $39.99 | `/products/wireless-mouse` | Out of Stock | disabled |

Catalog count text: “Browse our complete selection of **9** products” — matches **9** `product-card-{id}` nodes.

Representative ids for tests: **1.2 / 1.3 / 1.4 / 2.x** → Power Bank `9`; **1.5** → Bluetooth Speaker `4`; **1.6** → Mechanical Keyboard `7`. Any matching stock class is valid if seed data shifts.

## Key locators (`data-testid`)

| Area | `data-testid` |
| --- | --- |
| Catalog | `catalog-page`, `catalog-heading`, `catalog-product-count`, `product-grid` |
| Card | `product-card-{id}`, `product-link-{id}`, `product-image-{id}`, `product-name-{id}`, `product-price-{id}`, `product-description-{id}` |
| Stock | `product-low-stock-badge-{id}`, `product-out-of-stock-badge-{id}` |
| Card cart (logged in) | `product-add-to-cart-{id}`, `product-in-cart-actions-{id}`, `product-remove-from-cart-{id}`, `product-go-to-cart-{id}` |
| Navbar | `navbar-cart-link`, `navbar-cart-badge` (only when count &gt; 0), `navbar-username` |
| PDP | `product-page`, `product-detail-name`, `product-detail-price` |
| Invalid slug | `product-not-found`, `product-not-found-heading`, `product-not-found-back-button` |
| Cart landing (2.4 only) | `cart-page` |

## Test Scenarios

### 1. Catalog browse (unauthenticated)

**Project:** `unauthenticated`  
**Auth:** none (do not use storageState).

#### 1.1. catalog-loads-heading-grid-and-count

**Preconditions:**
- Project `unauthenticated`.
- Open `/catalog` (logged out).

**Steps:**
1. Go to `/catalog`.
2. Read `catalog-heading` and `catalog-product-count`.
3. Count `product-card-{id}` nodes inside `product-grid`.

**Expected assertions:**
- URL is `/catalog`; `catalog-page` is visible.
- `catalog-heading` is “Product Catalog”.
- `product-grid` is visible.
- The number in `catalog-product-count` (e.g. 9) equals the number of product cards.

#### 1.2. product-card-shows-name-price-image

**Preconditions:**
- Project `unauthenticated`.
- `/catalog` loaded.

**Steps:**
1. Locate `product-card-9` (Power Bank) or any in-stock card.
2. Read name, price, and image.

**Expected assertions:**
- `product-name-9` is “Power Bank”.
- `product-price-9` is `$59.99`.
- `product-image-9` is visible.

#### 1.3. product-link-opens-pdp-matching-card

**Preconditions:**
- Project `unauthenticated`.
- `/catalog` loaded.

**Steps:**
1. Read `product-name-9` and `product-price-9` on the card.
2. Click `product-link-9` (do not click Add).
3. On PDP, read `product-detail-name` and `product-detail-price`.

**Expected assertions:**
- URL is `/products/power-bank`.
- `product-page` is visible.
- PDP name and price match the catalog card (“Power Bank”, `$59.99`).

#### 1.4. in-stock-card-add-enabled-no-oos-badge

**Preconditions:**
- Project `unauthenticated`.
- `/catalog` loaded.
- Use an in-stock product with no low-stock badge (Power Bank `9`).

**Steps:**
1. Inspect `product-card-9`.

**Expected assertions:**
- `product-add-to-cart-9` is visible and **enabled**.
- `product-out-of-stock-badge-9` is **not** present.
- `product-low-stock-badge-9` is **not** present.

#### 1.5. out-of-stock-badge-and-add-disabled

**Preconditions:**
- Project `unauthenticated`.
- `/catalog` loaded.
- Use a real OOS product: Bluetooth Speaker `4` (also 5, 3, 8).

**Steps:**
1. Inspect `product-card-4`.

**Expected assertions:**
- `product-out-of-stock-badge-4` is visible with text “Out of Stock”.
- `product-add-to-cart-4` is **disabled**.
- `product-low-stock-badge-4` is not present.

#### 1.6. low-stock-badge-and-add-enabled

**Preconditions:**
- Project `unauthenticated`.
- `/catalog` loaded.
- Use a real low-stock product: Mechanical Keyboard `7`.

**Steps:**
1. Inspect `product-card-7`.

**Expected assertions:**
- `product-low-stock-badge-7` is visible with text “Low Stock”.
- `product-add-to-cart-7` is **enabled**.
- `product-out-of-stock-badge-7` is not present.

#### 1.7. invalid-slug-shows-not-found-and-back-to-catalog

**Preconditions:**
- Project `unauthenticated`.
- No login.

**Steps:**
1. Go to `/products/no-such-product`.
2. Click `product-not-found-back-button`.

**Expected assertions:**
- After step 1: URL is `/products/no-such-product`; `product-not-found` is visible; `product-not-found-heading` is “Product Not Found”.
- After step 2: URL is `/catalog`; `catalog-page` is visible.

### 2. Catalog card cart (authenticated)

**Project:** `authenticated` (`storageState: e2e/.auth/standard.json`)  
**Auth:** `STANDARD_USER` (do not UI-login in these tests).  
**Actions under test:** catalog card only (`product-add-to-cart-{id}`, `product-remove-from-cart-{id}`, `product-go-to-cart-{id}`). Do **not** use PDP add/remove.  
**Shared start:** if the cart is not empty, `clearCartViaApi` (or equivalent) in **this** scenario, then that scenario’s own Add/remove.

Use in-stock Power Bank `9` (or any enabled Add card).

#### 2.1. catalog-card-add-shows-in-cart-actions

**Preconditions:**
- Project `authenticated`.
- If cart is not empty, clear it (`clearCartViaApi` or equivalent), then continue in this test.

**Steps:**
1. Go to `/catalog`.
2. Ensure empty cart if items are present.
3. Click `product-add-to-cart-9` on the catalog card (must stay on `/catalog`).

**Expected assertions:**
- URL remains `/catalog`.
- `product-in-cart-actions-9` is visible.
- `product-remove-from-cart-9` is visible.
- `product-go-to-cart-9` is visible (text “In Cart”).
- `product-add-to-cart-9` is **not** present.

#### 2.2. catalog-card-remove-restores-add-button

**Preconditions:**
- Project `authenticated`.
- If cart is not empty, clear it in this test.
- This test must Add from the catalog card itself (do not reuse another test’s cart).

**Steps:**
1. Go to `/catalog`; ensure empty cart if needed.
2. Click `product-add-to-cart-9`.
3. Click `product-remove-from-cart-9`.

**Expected assertions:**
- After remove: `product-add-to-cart-9` is visible and enabled.
- `product-remove-from-cart-9` is not present.
- `product-in-cart-actions-9` is not present.

#### 2.3. catalog-card-add-shows-navbar-badge-1

**Preconditions:**
- Project `authenticated`.
- If cart is not empty, clear it in this test so the badge starts absent.

**Steps:**
1. Go to `/catalog`; ensure empty cart if needed.
2. Confirm `navbar-cart-badge` is not present.
3. Click `product-add-to-cart-9`.

**Expected assertions:**
- Before add: `navbar-cart-badge` has count 0 / is not shown.
- After add: `navbar-cart-badge` is visible with text `1`.
- URL remains `/catalog`.

#### 2.4. catalog-card-in-cart-navigates-to-cart-page

**Preconditions:**
- Project `authenticated`.
- If cart is not empty, clear it in this test.
- This test must Add from the catalog card itself.

**Steps:**
1. Go to `/catalog`; ensure empty cart if needed.
2. Click `product-add-to-cart-9`.
3. Click `product-go-to-cart-9` (“In Cart”).

**Expected assertions:**
- URL is `/cart`.
- `cart-page` is visible.
- Do **not** assert cart line name/qty/totals (Cart plan).
