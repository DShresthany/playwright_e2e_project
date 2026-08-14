# Ecommerce Login Test Plan

## Application Overview

QADemo login at `/login` authenticates against the Worker API and, on success, redirects to `/catalog` (or a stored `from` path). The form uses client-side required validation and a page-level alert (`role="alert"`) for API errors. Credentials must be read from environment variables (`STANDARD_USER` / `STANDARD_PASSWORD`, `LOCKED_USER` / `LOCKED_PASSWORD`, `ADMIN_USER` / `ADMIN_PASSWORD`). Do not hardcode secret values in tests or this spec.

**App URL:** `http://localhost:5173/login` (`BASE_URL` + `/login`)

**Key locators (`data-testid`):**

| Element | `data-testid` |
| --- | --- |
| Login page | `login-page` |
| Heading | `login-heading` |
| Form | `login-form` |
| Username | `username-input` |
| Password | `password-input` |
| Submit | `login-submit-button` |
| API error banner | `login-error` |
| API error text | `login-error-message` |
| Catalog page | `catalog-page` |
| Catalog heading | `catalog-heading` |
| Navbar | `navbar` |
| Navbar username | `navbar-username` |
| Navbar logout | `navbar-logout-button` |
| Navbar Admin link | `navbar-admin-link` |

Field-level validation messages (`Username is required`, `Password is required`) have no `data-testid`; assert via visible text next to the corresponding input.

Each scenario starts from a logged-out session on `/login`. Do not chain sessions.

## Test Scenarios

### 1. Login

#### 1.1. standard-user-successful-login

**Preconditions:**
- Logged out (no auth in localStorage / cookies).
- On `/login`.
- `STANDARD_USER` and `STANDARD_PASSWORD` are set in `.env`.

**Steps:**
1. Confirm the login form is visible (`login-page`, `login-form`, heading "Welcome Back").
2. Fill `username-input` with `process.env.STANDARD_USER`.
3. Fill `password-input` with `process.env.STANDARD_PASSWORD`.
4. Click `login-submit-button`.

**Expected assertions:**
- URL is `/catalog`.
- `catalog-page` and `catalog-heading` ("Product Catalog") are visible.
- `navbar-username` shows `STANDARD_USER`.
- `navbar-logout-button` is visible.
- `navbar-admin-link` is **not** present.

#### 1.2. locked-user-shows-account-locked-error

**Preconditions:**
- Logged out.
- On `/login`.
- `LOCKED_USER` and `LOCKED_PASSWORD` are set in `.env`.

**Steps:**
1. Fill `username-input` with `process.env.LOCKED_USER`.
2. Fill `password-input` with `process.env.LOCKED_PASSWORD`.
3. Click `login-submit-button`.

**Expected assertions:**
- URL remains `/login`.
- `login-error` (alert) is visible.
- `login-error-message` has text `Account is locked`.
- Catalog is not shown.

#### 1.3. admin-user-successful-login-shows-admin-link

**Preconditions:**
- Logged out.
- On `/login`.
- `ADMIN_USER` and `ADMIN_PASSWORD` are set in `.env`.

**Steps:**
1. Fill `username-input` with `process.env.ADMIN_USER`.
2. Fill `password-input` with `process.env.ADMIN_PASSWORD`.
3. Click `login-submit-button`.

**Expected assertions:**
- URL is `/catalog`.
- `catalog-page` and `catalog-heading` ("Product Catalog") are visible.
- `navbar-username` shows `ADMIN_USER`.
- `navbar-admin-link` is visible, text includes `Admin`, href `/admin`.

#### 1.4. empty-username-submission

**Preconditions:**
- Logged out.
- On `/login`.
- Username field is empty.

**Steps:**
1. Leave `username-input` empty.
2. Optionally fill `password-input` with any non-empty dummy value (not a real account password) so only username validation fires.
3. Click `login-submit-button`.

**Expected assertions:**
- URL remains `/login`.
- Visible text `Username is required` appears under the username field.
- `login-error` is **not** shown (client validation; no API call).

#### 1.5. empty-password-submission

**Preconditions:**
- Logged out.
- On `/login`.
- Password field is empty.

**Steps:**
1. Fill `username-input` with a non-empty dummy value (e.g. `foo`).
2. Leave `password-input` empty.
3. Click `login-submit-button`.

**Expected assertions:**
- URL remains `/login`.
- Visible text `Password is required` appears under the password field.
- `login-error` is **not** shown.

#### 1.6. invalid-credentials

**Preconditions:**
- Logged out.
- On `/login`.

**Steps:**
1. Fill `username-input` with `foo`.
2. Fill `password-input` with `bar`.
3. Click `login-submit-button`.

**Expected assertions:**
- URL remains `/login`.
- `login-error` (alert) is visible.
- `login-error-message` has text `Invalid username or password`.
- Catalog is not shown.
