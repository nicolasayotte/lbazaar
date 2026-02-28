// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';

// F-10.1: Forgot password page renders form
test.describe('F-10.1: Forgot password page renders form', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('renders email input', async ({ page }) => {
        await page.goto('/forgot-password');
        await waitForApp(page);
        await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('renders submit button', async ({ page }) => {
        await page.goto('/forgot-password');
        await waitForApp(page);
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
});

// F-10.2: Valid email shows success confirmation
test.describe('F-10.2: Valid email shows success', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('submitting registered email shows success toast', async ({ page }) => {
        await page.goto('/forgot-password');
        await waitForApp(page);
        await page.locator('input[name="email"]').fill('pw-student@example.com');
        await page.locator('button[type="submit"]').click();
        await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
    });
});

// F-10.3: Unregistered email shows error
test.describe('F-10.3: Unregistered email shows error', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('submitting unregistered email shows email field error', async ({ page }) => {
        await page.goto('/forgot-password');
        await waitForApp(page);
        await page.locator('input[name="email"]').fill('no-such-user@example.com');
        await page.locator('button[type="submit"]').click();
        await waitForInertiaNavigation(page);
        // ErrorText renders as <span class="MuiTypography-root MuiTypography-p ...">
        // color="error" is applied via generated css class, not MuiTypography-colorError
        const errorEl = page.locator('span.MuiTypography-p').first();
        await expect(errorEl).toBeVisible();
    });
});
