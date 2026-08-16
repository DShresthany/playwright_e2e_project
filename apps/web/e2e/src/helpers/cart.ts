import { expect, type APIRequestContext, type Page } from '@playwright/test';

const SESSION_STORAGE_KEY = 'session_id';
const CART_STORAGE_KEY = 'cart-storage';

/**
 * Clears the server cart (KV) and client Zustand cart persist so the UI
 * shows an empty cart. Must run against an origin that has localStorage
 * (e.g. after visiting /catalog).
 */
export async function clearCartViaApi(
  page: Page,
  request: APIRequestContext,
): Promise<void> {
  const sessionId = await page.evaluate(
    (key) => localStorage.getItem(key),
    SESSION_STORAGE_KEY,
  );

  if (sessionId) {
    const response = await request.delete('/api/cart', {
      headers: { 'X-Session-ID': sessionId },
    });
    expect(response.ok(), `DELETE /api/cart failed: ${response.status()}`).toBeTruthy();
  }

  await page.evaluate(
    ({ cartKey }) => {
      localStorage.setItem(
        cartKey,
        JSON.stringify({ state: { items: [] }, version: 0 }),
      );
    },
    { cartKey: CART_STORAGE_KEY },
  );

  await page.reload();
}
