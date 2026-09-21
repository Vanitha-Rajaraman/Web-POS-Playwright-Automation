import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage.js';
import { env } from '../../src/config/env.js';
import { buildInvalidMobileNumber, buildInvalidPin } from '../../src/data/factories/loginData.js';
/**
 * Login mechanics only — domain-agnostic, shared by grocery/restaurant-dinein/
 * restaurant-qsr. Full onboarding (org/location/start-session) per domain
 * lives under tests/grocery, tests/restaurant-dinein, tests/restaurant-qsr.
 */
test.describe('Login', () => {
    test('logs in and reaches organization selection', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(env.mobileNumber, env.pin);
        await expect(page.getByText('Select your organization')).toBeVisible();
    });
    test('rejects an invalid mobile number and PIN', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(buildInvalidMobileNumber(), buildInvalidPin());
        // Invalid credentials must not progress past the login screen.
        await expect(loginPage.mobileInput).toBeVisible();
        await expect(page).not.toHaveURL(/\/(products|session-page)\//);
    });
});
