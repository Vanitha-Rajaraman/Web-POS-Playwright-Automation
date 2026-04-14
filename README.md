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

This makes it easier to connect Slack to GitHub Actions and trigger only the test you want.

## Slack Trigger Options

Yes, you can run these tests via Slack. The cleanest setup is:

1. Create a Slack slash command such as `/pos-test login` or `/pos-test cart`.
2. Send that command to a small webhook service or serverless function.
3. Have the webhook call the GitHub Actions `workflow_dispatch` API for this repo.
4. Post the workflow result and artifact link back into Slack.

If you want the fastest path with the least custom code, keep test execution in GitHub Actions and use Slack only as the trigger and status UI.
