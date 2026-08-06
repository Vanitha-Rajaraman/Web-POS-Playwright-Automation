import { APIRequestContext, BrowserContext, request } from '@playwright/test';
import { env } from '@config/env';

interface StorageState {
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Pallet Lynx keeps its session entirely in localStorage (no auth cookies),
 * so the tokens have to be read out of the browser context's storage state
 * and attached manually — Playwright's APIRequestContext only replays
 * cookies automatically from storage state, not localStorage.
 */
function extractTokens(state: StorageState): { accessToken: string; refreshToken: string } {
  const origin = state.origins.find((o) => o.origin === env.baseUrl);
  const accessToken = origin?.localStorage.find((item) => item.name === 'access_token')?.value;
  const refreshToken = origin?.localStorage.find((item) => item.name === 'refresh_token')?.value;
  if (!accessToken || !refreshToken) {
    throw new Error(
      'Could not find access_token/refresh_token in the browser context storage state. Make sure the UI login completed before calling the API.'
    );
  }
  return { accessToken, refreshToken };
}

/**
 * The backend does not use a standard `Authorization: Bearer` header — the
 * real POS frontend sends the access/refresh tokens as `at`/`rt` headers,
 * plus a fixed set of client-identity headers (`org_id`, `user`, `platform`,
 * `user_role`) that are constant across accounts/orgs, not derived from the
 * logged-in user. Confirmed by inspecting the frontend's own network calls.
 *
 * Reads tokens straight from the given browser context's live storage state
 * (the same context the calling test just logged in with) rather than a
 * shared file, so each test's API calls are authenticated with its own
 * session — no cross-test/cross-domain coupling, safe to run in parallel.
 */
export async function createAuthenticatedApiContext(context: BrowserContext): Promise<APIRequestContext> {
  const state = await context.storageState();
  const { accessToken, refreshToken } = extractTokens(state);
  return request.newContext({
    baseURL: env.apiBaseUrl,
    extraHTTPHeaders: {
      at: accessToken,
      rt: refreshToken,
      org_id: 'PALLET',
      user: 'testuser',
      platform: 'POS',
      user_role: 'CLIENT',
      'Content-Type': 'application/json',
    },
  });
}
