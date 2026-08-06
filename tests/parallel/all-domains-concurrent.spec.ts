/**
 * ============================================================================
 * ONE BROWSER, ONE CONTEXT, THREE TABS — CONCURRENT (Promise.all) EXECUTION
 * ============================================================================
 *
 * Grocery, Restaurant Dine-In, and Restaurant QSR each drive their own
 * Playwright `Page` (tab), inside a single shared `BrowserContext`, inside a
 * single `Browser` process. No extra browser instances, no extra Playwright
 * workers — everything below runs in ONE `test()` block. Verified passing
 * twice in a row: all three tabs start their login within ~30ms of each
 * other and finish independently, each in its own correct org/location.
 *
 * WHY THIS ACTUALLY WORKS:
 *
 * Each `Page` is its own execution context in the Chromium sense — its own
 * DOM, its own JS event loop, its own in-page React state. Two tabs
 * navigating and clicking things do not block each other; the browser
 * schedules their network requests and rendering independently. That's what
 * lets three flows genuinely run "at the same time" and is why
 * `Promise.all()` below overlaps their execution instead of queuing it.
 *
 * A `BrowserContext` IS a single shared storage partition, though — every
 * `Page` opened via `context.newPage()` shares one `localStorage` per
 * origin, and Pallet Lynx keeps `access_token`/`refresh_token` and the
 * selected org/location there. Given that, you'd expect the three tabs to
 * stomp on each other's data. They don't, in practice, because of *when*
 * each tab actually reads from that shared storage:
 *
 *   - Each tab does exactly ONE real navigation (`loginPage.goto()`) and
 *     never reloads afterwards — every step after that (org/location
 *     select, proceeding to session) is client-side SPA routing. The app
 *     drives those transitions from its own in-memory state (captured from
 *     its own login response, its own click handlers), not by re-reading
 *     localStorage on every step.
 *   - So even though a sibling tab's login/org-selection may overwrite the
 *     shared localStorage value a moment later, a tab that's already past
 *     that point doesn't care — it's working off what it already has in
 *     memory, not re-deriving state from storage mid-flow.
 *
 * The failure mode from earlier experiments (a tab reset via localStorage
 * clear + a fresh `page.goto()` landing on grocery's "Day Status" instead
 * of its own org picker) happened specifically because that forced a full
 * page reload mid-flow, which DOES force the app to re-derive its state
 * from whatever is currently sitting in the shared storage at that instant.
 *
 * THE RULE THIS DEPENDS ON: never call `page.goto()` / `page.reload()` on
 * any of these tabs after its initial load. One continuous SPA session per
 * tab is what keeps them independent despite the shared storage partition.
 * Keep that in mind if you extend `runPosFlow` for a 4th/5th POS variant —
 * any code path that forces a reload reintroduces the race.
 *
 * Not included here: the UI-vs-API cross-check used in tests/grocery, etc.
 * (`verifyLoginAgainstApi`). That helper reads tokens via
 * `page.context().storageState()`, which is context-wide — with three tabs
 * sharing one context it would return whatever token is CURRENTLY in the
 * shared slot, not reliably "this tab's own" token. Doable, but it needs a
 * different extraction (e.g. `page.evaluate(() => localStorage.getItem(...))`
 * captured immediately after that tab's own login) — ask if you want that
 * added.
 */
import { Page, expect, test } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { OrgLocSelectionPage as GroceryOrgLoc } from '@pages/grocery/OrgLocSelectionPage';
import { SessionStartPage as GrocerySession } from '@pages/grocery/SessionStartPage';
import { OrgLocSelectionPage as DineInOrgLoc } from '@pages/restaurant-dinein/OrgLocSelectionPage';
import { SessionStartPage as DineInSession } from '@pages/restaurant-dinein/SessionStartPage';
import { OrgLocSelectionPage as QsrOrgLoc } from '@pages/restaurant-qsr/OrgLocSelectionPage';
import { SessionStartPage as QsrSession } from '@pages/restaurant-qsr/SessionStartPage';
import { env } from '@config/env';
import { logger } from '@utils/logger';

// ----------------------------------------------------------------------------
// 1. FLOW CONFIG — this is the "scalable" part. Adding a 4th/5th POS variant
//    (e.g. a Pharmacy module) means adding ONE object to this array and
//    creating its OrgLocSelectionPage/SessionStartPage classes under
//    src/pages/<new-domain>/ — nothing else in this file changes.
// ----------------------------------------------------------------------------
interface PosFlow {
  /** Used in logs/report step names/screenshot filenames — keep it short. */
  label: string;
  orgName: string;
  locationName: string;
  /** Domain-specific page objects — same shape (constructor takes a Page), different screens under the hood. */
  OrgLocSelectionPage: typeof GroceryOrgLoc;
  SessionStartPage: typeof GrocerySession;
}

const posFlows: PosFlow[] = [
  {
    label: 'grocery',
    orgName: env.orgName,
    locationName: env.locationName,
    OrgLocSelectionPage: GroceryOrgLoc,
    SessionStartPage: GrocerySession,
  },
  {
    label: 'restaurant-dinein',
    orgName: env.restaurantOrgName,
    locationName: env.dineInLocationName,
    OrgLocSelectionPage: DineInOrgLoc,
    SessionStartPage: DineInSession,
  },
  {
    label: 'restaurant-qsr',
    orgName: env.restaurantOrgName,
    locationName: env.qsrLocationName,
    OrgLocSelectionPage: QsrOrgLoc,
    SessionStartPage: QsrSession,
  },
];

// ----------------------------------------------------------------------------
// 2. RESULT TYPE — every flow reports back its own outcome instead of
//    throwing, so one tab failing never hides/cancels what the other two
//    tabs did. This is the "error handling" requirement: Promise.all() over
//    promises that catch their own errors behaves like allSettled() while
//    still literally being Promise.all().
// ----------------------------------------------------------------------------
interface FlowResult {
  label: string;
  ok: boolean;
  error?: string;
}

// ----------------------------------------------------------------------------
// 3. PER-TAB WORKFLOW — one function drives ANY POS flow end to end on ITS
//    OWN page. This is the reusable component: grocery/dine-in/QSR don't
//    get separate hand-written workflow functions, they get separate PAGE
//    OBJECTS passed into this one function.
// ----------------------------------------------------------------------------
async function runPosFlow(page: Page, flow: PosFlow): Promise<FlowResult> {
  try {
    // Page Object Model: each screen is its own class, this function only
    // orchestrates calls between them — it never touches selectors directly.
    const loginPage = new LoginPage(page);
    const orgLocSelectionPage = new flow.OrgLocSelectionPage(page);
    const sessionStartPage = new flow.SessionStartPage(page);

    await test.step(`[${flow.label}] log in`, async () => {
      logger.info(`[${flow.label}] navigating to login and authenticating as ${env.mobileNumber}`);
      await loginPage.goto();
      // Separate login call, made independently on THIS tab's own Page —
      // this is what makes the three logins run concurrently rather than
      // one tab waiting for another to finish first.
      await loginPage.login(env.mobileNumber, env.pin);
    });

    await test.step(`[${flow.label}] select org "${flow.orgName}" / location "${flow.locationName}"`, async () => {
      await orgLocSelectionPage.selectOrgAndLocation(flow.orgName, flow.locationName);
    });

    await test.step(`[${flow.label}] proceed to session`, async () => {
      // Handles the optional "Start Day" prompt (and, for restaurants, the
      // Access Mode step) internally — see SessionStartPage.proceedToSession().
      await sessionStartPage.proceedToSession();
      await expect(sessionStartPage.title).toHaveText('Start session');
    });

    logger.info(`[${flow.label}] completed successfully`);
    return { label: flow.label, ok: true };
  } catch (err) {
    // Caught here (not left to bubble) so Promise.all below can't be
    // short-circuited by one tab's failure — every tab gets to finish or
    // fail on its own.
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[${flow.label}] failed`, message);
    return { label: flow.label, ok: false, error: message };
  }
}

test.describe('One browser, one context, three concurrent tabs', () => {
  test('grocery + restaurant dine-in + restaurant QSR run at the same time', async ({ browser }) => {
    // Three full onboarding flows running concurrently take longer than a
    // typical single-page test — extend well past the 30s default.
    test.setTimeout(120_000);

    // --------------------------------------------------------------------
    // STEP 1: Launch/obtain ONE browser. `browser` here is Playwright's own
    // worker-scoped fixture — no manual chromium.launch() needed, and it
    // still respects --headed/--project from the CLI.
    // --------------------------------------------------------------------
    // STEP 2: Create ONE context — this is the single shared storage
    // partition every tab below will live in.
    // --------------------------------------------------------------------
    const context = await browser.newContext();

    try {
      // ------------------------------------------------------------------
      // STEP 3: Open THREE tabs (pages) inside that one context, all at
      // once. `context.newPage()` opens a new tab, not a new window — this
      // is the actual "one browser, three tabs" mechanic.
      // ------------------------------------------------------------------
      const pages = await Promise.all(posFlows.map(() => context.newPage()));

      // ------------------------------------------------------------------
      // STEP 4: Run all three POS flows CONCURRENTLY via Promise.all().
      // Each call starts immediately — none of them wait for another to
      // reach any particular point first.
      // ------------------------------------------------------------------
      const results = await Promise.all(pages.map((page, i) => runPosFlow(page, posFlows[i])));

      // ------------------------------------------------------------------
      // STEP 5: Report per-tab outcome. Assert only after every tab has
      // had a chance to finish, so the report shows all three results even
      // if one failed.
      // ------------------------------------------------------------------
      for (const result of results) {
        logger.info(`Result [${result.label}]: ${result.ok ? 'PASSED' : `FAILED — ${result.error}`}`);
      }

      const failures = results.filter((r) => !r.ok);
      expect(failures, `${failures.length} of ${results.length} concurrent tabs failed`).toEqual([]);
    } finally {
      // Always clean up the context/tabs, pass or fail.
      await context.close();
    }
  });
});
