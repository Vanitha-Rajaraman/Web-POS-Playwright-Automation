# Web POS Playwright Automation

Playwright + TypeScript end-to-end framework for **Pallet Lynx** POS
(`https://stage-pos.palletnow.co/`).

## Stack

- [Playwright Test](https://playwright.dev/) + TypeScript
- [`@faker-js/faker`](https://fakerjs.dev/) for dynamic test data
- GitHub Actions for CI

## Project structure

Three domains — **grocery**, **restaurant-dinein**, **restaurant-qsr** — each
with their own org/location/session page objects, since the onboarding flow
diverges per domain (restaurants have an extra Access Mode step grocery
doesn't). `LoginPage`/`BasePage` are shared by all three.

```
.
├── .github/workflows/playwright.yml   # CI pipeline (push/PR + nightly schedule)
├── auth-setup/auth.setup.ts           # one-time login, cached as storageState
├── src/
│   ├── config/env.ts                  # env-driven config (URLs, credentials, org/location names)
│   ├── api/
│   │   ├── apiClient.ts               # authenticated APIRequestContext factory
│   │   └── endpoints/authApi.ts       # typed API wrappers
│   ├── pages/
│   │   ├── LoginPage.ts               # shared
│   │   ├── BasePage.ts                # shared
│   │   ├── grocery/                   # OrgLocSelectionPage, SessionStartPage, CartPage
│   │   ├── restaurant-dinein/         # same three, dine-in specific
│   │   └── restaurant-qsr/            # same three, QSR specific
│   ├── fixtures/                      # index.ts (shared) + one file per domain
│   ├── data/factories/                # faker-based dynamic data builders
│   └── utils/                         # logger, UI-vs-API validation helper
├── tests/
│   ├── auth/                          # login mechanics only (domain-agnostic)
│   ├── grocery/
│   ├── restaurant-dinein/
│   └── restaurant-qsr/
├── playwright.config.ts
└── .env.example
```

## Setup

```bash
npm install
npx playwright install --with-deps
cp .env.example .env   # fill in real values (see below)
```

### Environment variables

| Variable                | Purpose                                              |
| ----------------------- | ----------------------------------------------------- |
| `BASE_URL`              | App under test (default `https://stage-pos.palletnow.co`) |
| `API_BASE_URL`          | Backend API host (default `https://stage-highway.palletnow.co`) |
| `MOBILE_NUMBER`         | Seeded staging login (real account, not fake data)   |
| `PIN`                   | 4-digit PIN for the account above                    |
| `ORG_NAME`              | Grocery org to select during onboarding (default `Twinleaves`) |
| `LOCATION_NAME`         | Grocery location under that org (default `Automation Testing`) |
| `RESTAURANT_ORG_NAME`   | Restaurant org, shared by both dine-in and QSR (default `CANTEEN`) |
| `DINEIN_LOCATION_NAME`  | Dine-in location under the restaurant org (default `Automation Testing Dine In`) |
| `QSR_LOCATION_NAME`     | QSR location under the restaurant org (default `Automation Testing QSR`) |

Locally these come from `.env` (gitignored). In CI they're read from
**GitHub Actions secrets** of the same names — add them under
*Settings → Secrets and variables → Actions* before the workflow can run.

## Running tests

```bash
npm test                 # all browsers (chromium, firefox, webkit)
npm run test:chromium    # single browser
npm run test:headed      # watch it run
npm run test:ui          # Playwright's UI mode
npm run report           # open the last HTML report
```

## How authentication works

Pallet Lynx's login is multi-step: mobile + PIN → select organization →
select location → terminal/session picker. Repeating that in every test
would be slow and brittle, so it only happens once:

1. `auth-setup/auth.setup.ts` is registered as a Playwright **setup project**
   (see `playwright.config.ts`). It runs first, drives the real login and
   onboarding steps, and saves the result with
   `page.context().storageState({ path: 'playwright/.auth/user.json' })`.
2. The `chromium`, `firefox`, and `webkit` projects declare
   `dependencies: ['setup']` and `use: { storageState: 'playwright/.auth/user.json' }`,
   so every test starts already authenticated.
3. Pallet Lynx stores its whole session in **`localStorage`** (`access_token`,
   `refresh_token`, `orgId`, `locId`, etc.) — there are no auth cookies.
   Playwright's `storageState` captures localStorage per-origin natively, so
   this works without any extra plumbing on the UI side.
4. A test that needs to exercise the login form itself (e.g.
   `tests/auth/login.spec.ts`) opts out with
   `test.use({ storageState: { cookies: [], origins: [] } })`.

`playwright/.auth/` is gitignored — it contains a live token and is
regenerated on every run.

## Dynamic test data

Nothing is hardcoded in spec files beyond the one real seeded account.
Per-domain factories in `src/data/factories/` build randomized, typed data
with `@faker-js/faker` (e.g. `buildInvalidMobileNumber()`,
`buildInvalidPin()` for negative-path tests). Add one factory file per
page/domain as new specs are written.

## Validating the UI against the API

Because the app keeps its token in `localStorage` rather than cookies,
`src/api/apiClient.ts` reads the cached `access_token` out of
`playwright/.auth/user.json` and attaches it as a bearer token to a
Playwright `APIRequestContext` pointed at `API_BASE_URL`.

The pattern, demonstrated in each domain's `tests/*/login.spec.ts`:

1. Drive the UI (log in, select org/location, proceed to session).
2. Call the equivalent backend endpoint via `authApi` (or a new endpoint
   wrapper under `src/api/endpoints/`).
3. Cross-check via `verifyLoginAgainstApi()` in `src/utils/apiValidation.ts`,
   which asserts the UI-authenticated identity (mobile number, roles) matches
   what the API independently reports, and captures both the comparison and
   the raw API response as **report attachments** while also logging them to
   the console (visible live in the terminal and in the HTML report's stdout
   section).

Extend this by adding an endpoint wrapper per feature area and a matching
validation helper, then call both from the corresponding spec — every new
page/spec should include at least one such cross-check rather than only
asserting against other UI state.

## Reporting & failure artifacts

Configured in `playwright.config.ts`:

- **Screenshots**: captured `only-on-failure`
- **Video**: `retain-on-failure`
- **Trace**: `retain-on-failure` (view with `npx playwright show-trace <file>`)
- **HTML report**: written to `playwright-report/` (`npm run report` to view)

All of the above live under the gitignored `test-results/` and
`playwright-report/` directories locally, and are uploaded as CI artifacts
on every run (`.github/workflows/playwright.yml`), pass or fail.

## CI

`.github/workflows/playwright.yml` runs:

- on every push/PR to `main`
- manually via `workflow_dispatch`
- **nightly at 11:00 PM IST** (`30 17 * * *` UTC) via `schedule`

It installs dependencies and browsers, runs the full suite, and uploads the
HTML report and `test-results/` (traces, videos, screenshots) as workflow
artifacts — visible under the run's **Summary** tab even when tests fail.
Note: GitHub only fires `schedule` triggers off the workflow file as it
exists on the default branch, so the cron won't run until this file is
merged to `main`.

Add all nine `secrets.*` referenced in the workflow (`BASE_URL`,
`API_BASE_URL`, `MOBILE_NUMBER`, `PIN`, `ORG_NAME`, `LOCATION_NAME`,
`RESTAURANT_ORG_NAME`, `DINEIN_LOCATION_NAME`, `QSR_LOCATION_NAME`) under
*Settings → Secrets and variables → Actions* before the workflow can run.

## Adding a new page/flow

1. Add a page object under `src/pages/<domain>/`, following the existing
   ones (locators in the constructor, actions as methods). Add it to all
   three domain folders if the screen is common to all of them.
2. Add a data factory under `src/data/factories/` if the flow needs dynamic
   input.
3. Add an API endpoint wrapper under `src/api/endpoints/` if there's a
   backend call to validate against, plus a validation helper in
   `src/utils/apiValidation.ts`.
4. Register the page object in the relevant `src/fixtures/<domain>.ts` file
   (or `src/fixtures/index.ts` if it's shared across domains) so specs can
   consume it via dependency injection instead of constructing it manually.
5. Add the spec under `tests/<domain>/`.

## Known scope for this pass

Page objects/tests currently cover **Login → Organization+Location select →
(restaurant only) Access Mode → Start Day (if the location has no active
business day) → Start-session (terminal picker) screen**. `SessionStartPage`
automatically clicks "Start Day" when it's shown — this is a real,
state-changing action on the shared staging environment, but a necessary one
to reliably reach the terminal picker. Actually **starting a session on a
terminal** (picking a specific terminal card) is a further state-changing
step that's intentionally out of scope until specific terminals/flows are
designated for automation — `CartPage` exists as an empty stub per domain
for when that scope is picked up.
