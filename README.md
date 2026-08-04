# web-pos-playwrite-automation

## CI/CD

This repo includes a GitHub Actions workflow at `.github/workflows/playwright.yml` that:

- installs Node.js dependencies with `npm ci`
- installs Playwright Chrome with Linux dependencies
- runs the selected Playwright suite
- uploads `reports/html` and `test-results` as workflow artifacts

### GitHub secrets

Add these repository secrets before enabling the workflow:

- `POS_BASE_URL`
- `POS_MOBILE`
- `POS_PIN`
- `POS_CASH_AMOUNT`
- `POS_CUSTOMER_MOBILE`
- `POS_CUSTOMER_NAME`
- `POS_PRODUCT_KEYWORD`

The tests still fall back to `data/testData.json` locally, but CI can override them through secrets/env vars.

### Triggering

The workflow runs on:

- push to `main` or `master`
- pull requests
- manual trigger with `workflow_dispatch`

### Manual suite selection

When you run the workflow manually, you can choose:

- `all`
- `login`
- `cart`
- `custom` with one or more comma-separated entries in `test_paths`

This makes it easier to connect Slack to GitHub Actions and trigger only the test you want.

### Custom test paths

When `suite=custom`, populate `test_paths` with values such as:

- `tests/login.spec.js`
- `tests/cart.spec.js`
- `tests/login.spec.js,tests/cart.spec.js`

Only files under `tests/` matching `*.spec.js` or `*.spec.ts` are accepted.

## Slack Trigger Setup

This repo now includes a tiny Slack webhook service at [slack-command-server.js](C:\Users\PalletNow\Playwright Web POS Automation\slack\slack-command-server.js). It receives a Slack slash command, verifies the signature, and dispatches `.github/workflows/playwright.yml`.

### Slack app values to paste

In your Slack app:

- `Slash Command`: `/pos-test`
- `Request URL`: `https://YOUR-DOMAIN/slack/commands/pos-test`
- `Short Description`: `Run POS Playwright tests from Slack`
- `Usage Hint`: `all | login | cart | tests/login.spec.js | tests/login.spec.js,tests/cart.spec.js`
- `OAuth Scope`: `commands`

### Supported Slack commands

Examples:

- `/pos-test all`
- `/pos-test login`
- `/pos-test cart`
- `/pos-test tests/login.spec.js`
- `/pos-test tests/login.spec.js,tests/cart.spec.js`

### Environment variables for the webhook service

Copy [.env.slack.example](C:\Users\PalletNow\Playwright Web POS Automation\.env.slack.example) and fill in:

- `SLACK_SIGNING_SECRET`: from `Slack App -> Basic Information -> App Credentials`
- `GITHUB_OWNER`: your GitHub user or org name
- `GITHUB_REPO`: repository name exactly as it appears on GitHub
- `GITHUB_TOKEN`: a GitHub token that can dispatch Actions workflows for this repo
- `GITHUB_WORKFLOW_ID`: `playwright.yml`
- `GITHUB_REF`: branch to run, usually `main`

### Run the webhook locally

```bash
npm run slack:webhook
```

The server listens on:

- `POST /slack/commands/pos-test`
- `GET /health`

For Slack testing, expose the local service with a public HTTPS URL using a tunnel such as `ngrok` or deploy it to Vercel, Render, Railway, Azure, or AWS.

### GitHub token permissions

The GitHub token used by the webhook must be able to trigger workflows in this repository. A fine-grained token with repository access and Actions write permission is the safest option.

### End-to-end flow

1. A user runs `/pos-test cart` in your Slack workspace.
2. Slack sends the request to your webhook URL.
3. The webhook verifies the Slack signature.
4. The webhook calls GitHub Actions `workflow_dispatch` with the right inputs.
5. The workflow runs the selected suite or specific test files.

### Notes

- The workflow file must remain on the default branch for `workflow_dispatch` to work reliably.
- The `GITHUB_REPO` value is the GitHub repository name, which may differ from the local folder name.
- If your default branch is `master`, set `GITHUB_REF=master`.
