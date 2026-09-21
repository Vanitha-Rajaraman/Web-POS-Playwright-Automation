# Web POS Playwright Automation

Playwright + JavaScript end-to-end tests for Pallet Lynx POS. Source files use native ES modules and explicit relative imports with .js extensions. No TypeScript build or path-alias loader is required.

## Project structure

```text
.github/workflows/playwright.yml   CI: validation, tests, reports
src/
  config/env.js                    Environment configuration
  pages/                           Shared LoginPage/BasePage and domain page objects
    grocery/
    restaurant-dinein/
    restaurant-qsr/
  fixtures/
    domainSession.js               Shared page and lifecycle for ordered domain tests
  api/                             API client and endpoint wrappers
  data/                            Seeded catalog data and generated data factories
  utils/                           Logging and UI/API comparison helpers
tests/
  auth/
  grocery/                         Feature test cases matched to page-object names
  restaurant-dinein/
  restaurant-qsr/
  parallel/                        Opt-in concurrent multi-tab scenario
  suites/pos-session-sequence.spec.js               Registers grocery, dine-in, then QSR in order
  framework/                      Offline session lifecycle checks
scripts/check.js                   JavaScript syntax and local-import checks
playwright.config.js              All named projects and shared settings
jsconfig.json                     Editor JavaScript configuration
.env.example                      Environment template
```

## Which test uses which page?

Page objects contain locators and UI actions. Test files contain the scenarios and assertions. A workflow can use several page objects, so there is not always one test file per screen.

Feature names match their primary page object: `HoldCart.spec.js` uses `HoldCartPage.js`, and `CartProductSearch.spec.js` uses `CartProductSearchPage.js`. A suffix describes the scenario, such as order placement in `Cart.order.spec.js`.

All grocery test files below are under `tests/grocery/`; grocery page objects are under `src/pages/grocery/` unless marked shared.

| Test file | Main page object | Additional pages used |
| --- | --- | --- |
| `Login.identity.spec.js` | Shared `src/pages/LoginPage.js` | `OrganizationLocationPage.js` during shared setup; API identity validation in the test |
| `SessionStart.spec.js` | `SessionStartPage.js` | Starts/resumes the grocery terminal session and verifies the dashboard |
| `Cart.order.spec.js` | `CartPage.js` | Cash payment actions are currently in `CartPage.js` |
| `CartProductSearch.spec.js` | `CartProductSearchPage.js` | `CartPage.js` opens the cart and completes the order |
| `HoldCart.spec.js` | `HoldCartPage.js` | `CartPage.js` for product selection and payment |
| `ClearCart.spec.js` | `ClearCartPage.js` | `CartPage.js` for product selection |
| `Offer.spec.js` | `OfferPage.js` | `CartPage.js` for products and payment |
| `Coupon.spec.js` | `CouponPage.js` | `CartPage.js` for products and payment |
| `Loyalty.spec.js` | `LoyaltyPage.js` | `CartPage.js` for products and payment |
| `Payment.methods.spec.js` | `PaymentPage.js` | `CartPage.js` for cart setup and cash payment |
| `SessionClose.review.spec.js` | `SessionClosePage.js` | Reviews reconciliation without finalizing the close |
| `Logout.spec.js` | Shared `src/pages/LogoutPage.js` | Shared `LoginPage.js` verifies return to login |

For both `tests/restaurant-dinein/` and `tests/restaurant-qsr/`, `Login.identity.spec.js` uses shared `LoginPage.js` plus that domain's `OrganizationLocationPage.js`. `SessionStart.spec.js` uses the domain's `SessionStartPage.js` to select POS access mode and verify the terminal picker. Restaurant tests still stop before selecting a terminal. `Logout.spec.js` uses shared `LogoutPage.js`. Restaurant `CartPage.js` files are placeholders; no restaurant cart scenarios exist yet.

`tests/auth/Login.spec.js` tests shared `LoginPage.js` independently. `tests/parallel/all-domains-concurrent.spec.js` uses login and onboarding pages across the three domains. `tests/framework/session-lifecycle.spec.js` checks framework behavior offline and needs no application page object.

The runnable entry point is [tests/suites/pos-session-sequence.spec.js](tests/suites/pos-session-sequence.spec.js). It imports the feature `.spec.js` files in order to preserve one login and a final logout per domain. Run the domain commands below, rather than running a `.spec.js` file directly. `OrganizationLocationPage.js` replaces the abbreviated `OrgLocSelectionPage.js` name in every domain.

## Setup

Use Node.js 22.13 or newer in the Node 22 release line (CI uses Node 22), or a supported newer LTS release.

```powershell
npm.cmd ci
npx.cmd playwright install --with-deps
Copy-Item .env.example .env
```

Fill in your local .env. On macOS/Linux use npm/npx and cp .env.example .env. On Windows, npm.cmd/npx.cmd also work when PowerShell blocks the npm.ps1/npx.ps1 launchers.

Environment variables:

| Variable | Purpose |
| --- | --- |
| BASE_URL | POS URL; defaults to https://stage-pos.palletnow.co |
| API_BASE_URL | Backend URL; defaults to https://stage-highway.palletnow.co |
| MOBILE_NUMBER, PIN | Required seeded account credentials when login is used |
| ORG_NAME, LOCATION_NAME, TERMINAL_NAME | Grocery organization, location, and terminal |
| RESTAURANT_ORG_NAME | Restaurant organization |
| DINEIN_LOCATION_NAME, QSR_LOCATION_NAME | Restaurant locations |

See src/config/env.js for defaults. CI reads these ten variables from GitHub Actions secrets. Catalog prerequisites and customer/manager test data are in src/data/grocery.js; randomized input builders are in src/data/factories/.

## Commands

All suites use one configuration. The regression matrix has nine named projects: each combination of `chromium`, `firefox`, and `webkit` with `grocery`, `dinein`, and `qsr`. The utility projects are `parallel-tabs`, `auth`, and `framework`.

`npm test` and CI select the nine regression projects. With `workers: 9`, Playwright can run every browser/domain combination concurrently. Tests inside each project remain serial and share one login: login → session start → domain tests → logout. Bare `npx playwright test` selects all projects, including the utility scenarios, so use the commands below or an explicit `--project` selection.

```text
npm run check            Check JavaScript syntax and local import paths
npm run test:list        Discover regression tests without launching browsers
npm test                 All 9 browser/domain projects in parallel
npm run test:chromium    All domains concurrently on Chromium
npm run test:firefox     All domains concurrently on Firefox
npm run test:webkit      All domains concurrently on WebKit
npm run test:grocery     Grocery concurrently on all three browsers
npm run test:restaurant  Dine-in and QSR concurrently on all three browsers
npm run test:dinein      Dine-in concurrently on all three browsers
npm run test:qsr         QSR concurrently on all three browsers
npm run test:auth        Standalone login-mechanics tests
npm run test:framework   Offline lifecycle checks; no staging calls
npm run test:headed      Regression tests with visible browsers
npm run test:debug       Playwright debugger
npm run test:ui          Playwright UI
npm run test:parallel    Explicitly run concurrent multi-tab scenario
npm run report          Open the default HTML report
```

Use npm.cmd in place of npm where required on Windows. Append -- --list --reporter=list to either opt-in command to inspect its tests without executing them.

The legacy run_ordered_grocery.sh delegates to test:grocery. It creates one report, preserves Playwright's exit status, and uses the explicit registration order in tests/suites/pos-session-sequence.spec.js.

## Authentication and isolation

The custom fixture entry point is `src/fixtures/domainSession.js`. Standalone login tests import Playwright's standard `test` and `expect` and construct `new LoginPage(page)` in each test, preserving fresh per-test pages without a separate authentication fixture.

| Fixture | Import from these tests | Behavior |
| --- | --- | --- |
| `src/fixtures/domainSession.js` | Grocery, dine-in, QSR, and the ordered suite | Shares one live page per domain; supplies login, organization/location, session-start, and cart page objects |

The domain fixture rejects access before setup or after logout. The cart fixture also requires `SessionStart.spec.js` to have completed. Teardown clears page-object references even if logout or context closure fails, and reports both errors if both fail. Each registered domain suite enforces serial execution and disables retries.

The app currently cannot reliably resume onboarding from restored storageState: a fresh page can reach a restricted-access gate. There is no setup project or cached authentication file in the execution path.

The default entry point is tests/suites/pos-session-sequence.spec.js. Each browser/domain project executes one of these flows:

1. Grocery: one UI login and onboarding, all grocery cases on the same page, session-close review, then logout.
2. Restaurant dine-in: one UI login and onboarding, all registered dine-in tests on that page, then logout.
3. Restaurant QSR: one UI login and onboarding, all registered QSR tests on that page, then logout.

src/fixtures/domainSession.js owns this lifecycle. A beforeAll hook logs in once, selects the organization/location, and creates the domain page objects. `Login.identity.spec.js` validates identity, then `SessionStart.spec.js` performs the session-start steps before the remaining features. No test logs in again. The final test performs UI logout and verifies the login screen; afterAll closes the context before the next domain starts. If a failure skips the final logout test, afterAll still attempts UI logout and reports any failure. Closing a context is not treated as successful logout.

Each domain project is serial with retries disabled. A failure skips the remaining tests in that browser/domain project while the other eight projects continue independently. `npm test` performs one login per browser/domain combination, for nine logins total. Use the provided domain commands because filtering individual features can omit the required SessionStart test.

The regression configuration uses `workers: 9` and `fullyParallel: false`. Parallelism occurs between the nine projects; order is preserved inside each project. All projects currently read the same credentials and terminal from `.env`. If staging permits only one active session per account or terminal, concurrent runs can interfere with each other. Stable parallel CI normally requires a separate account, terminal, or isolated test data for each browser/domain project.

After each successful grocery case except logout, cleanup dismisses payment/customer screens and verifies navigation is actionable. Unexpected cleanup failures stop the serial sequence. This checks UI readiness; it does not roll back server-side orders, customers, or loyalty changes.

Standalone authentication and concurrency tests are opt-in because they perform independent logins and do not follow the ordered domain lifecycle.

## API validation

src/api/apiClient.js reads access_token and refresh_token from the current browser context's localStorage, then sends the backend's at/rt headers and client identity headers. It does not read a cached file or use a Bearer header. verifyLoginAgainstApi compares the UI identity with the API result and attaches its findings to the report.

## Reports and CI

CI installs dependencies and browsers, runs npm run check and npm run test:framework, executes the ordered regression suite, and uploads HTML reports and test artifacts. It runs on main pushes/pull requests, manual dispatch, and daily at 23:00 IST (17:30 UTC). Standalone authentication and intentional concurrency are excluded from this default suite.

The shared HTML report is in playwright-report/ and is replaced by the next HTML-reporting run. The framework command uses only the list reporter. Auth, concurrency, and framework projects have separate artifact folders under test-results/. Generated results and playwright/.auth/ are ignored by Git. Never commit saved authentication state. Removing a previously tracked file does not erase Git history or invalidate its tokens; invalidate any still-valid exposed credentials separately.

Playwright manages tracing using `trace: 'retain-on-failure'`. The shared-session fixture does not start or stop tracing itself. Failed-test traces are saved in the test's output directory as `trace.zip`; open one with `npx.cmd playwright show-trace <path-to-trace.zip>`. There is no custom whole-domain trace archive. The VS Code extension's **Show Trace** setting controls its trace viewer independently.


## Adding coverage

1. Add a .js page object under src/pages/<domain>/; share components when their behavior is actually common.
2. Add seeded data or a factory when needed.
3. Use the shared page from src/fixtures/domainSession.js to construct feature page objects.
4. Add a .spec.js file under tests/<domain>/ that exports registerTests(), using test/expect from domainSession.js. Import and call that function in tests/suites/pos-session-sequence.spec.js before the domain's logout registration. The .spec.js files are not standalone entry points.
5. Add API checks where they provide independent validation, and run npm run check plus npm run test:list.

Grocery coverage includes onboarding, product search, cart orders, hold/clear, offers, coupons, loyalty, payment methods, logout, and session-close review. Restaurant coverage currently includes onboarding/terminal selection and final logout; restaurant CartPage classes remain placeholders. Future restaurant cases belong before their logout registration. Session-close coverage stops before final reconciliation confirmation.

Live verification is still needed for restaurant logout controls at the terminal picker. Prior exploration also recorded grocery logout becoming unresponsive after session-close review. That review now stays on the shared page as requested; if the app defect persists, the logout case fails explicitly. The framework does not reload, relogin, clear storage, or finalize reconciliation to work around it.

Tests use staging and can create customers/orders, redeem loyalty, and start sessions. Use dedicated automation data and resources.
