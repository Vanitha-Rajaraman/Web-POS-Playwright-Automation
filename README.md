# web-pos-playwrite-automation

## CI/CD

This repo includes a GitHub Actions workflow at `.github/workflows/playwright.yml` that:

- installs Node.js dependencies with `npm ci`
- installs Playwright Chrome with Linux dependencies
- runs `npm test`
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
