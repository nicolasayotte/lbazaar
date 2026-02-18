// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';

// The student registration form lives at /register/student
const REGISTER_URL = '/register/student';

// ---------------------------------------------------------------------------
// Registration form rendering
// ---------------------------------------------------------------------------
test.describe('Registration form rendering', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('renders first_name input', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        await expect(page.locator('input[name="first_name"]')).toBeVisible();
    });

    test('renders last_name input', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        await expect(page.locator('input[name="last_name"]')).toBeVisible();
    });

    test('renders country_id as native <select> (selectOption compatible)', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        // Input.jsx uses SelectProps: { native: true } which renders a native <select>
        const countrySelect = page.locator('select[name="country_id"]');
        await expect(countrySelect).toBeVisible();
    });

    test('renders email input', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('renders password input', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('renders password_confirmation input', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        await expect(page.locator('input[name="password_confirmation"]')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Successful registration
// ---------------------------------------------------------------------------
test.describe('Successful registration', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('fills form with unique email, submits -> redirected to /email/verify', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        const uniqueEmail = `pw-test-${Date.now()}@example.com`;

        await page.locator('input[name="first_name"]').fill('Test');
        await page.locator('input[name="last_name"]').fill('User');
        await page.selectOption('select[name="country_id"]', { index: 1 });
        await page.locator('input[name="email"]').fill(uniqueEmail);
        await page.locator('input[name="password"]').fill('Test1234!');
        await page.locator('input[name="password_confirmation"]').fill('Test1234!');

        await page.locator('button[type="submit"]').click();
        await waitForInertiaNavigation(page);

        await expect(page).toHaveURL(/\/email\/verify/);
    });
});

// ---------------------------------------------------------------------------
// Validation errors
// ---------------------------------------------------------------------------
test.describe('Validation errors', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('password mismatch -> error message visible', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        const uniqueEmail = `pw-mismatch-${Date.now()}@example.com`;

        await page.locator('input[name="first_name"]').fill('Test');
        await page.locator('input[name="last_name"]').fill('User');
        await page.selectOption('select[name="country_id"]', { index: 1 });
        await page.locator('input[name="email"]').fill(uniqueEmail);
        await page.locator('input[name="password"]').fill('Test1234!');
        await page.locator('input[name="password_confirmation"]').fill('DifferentPass999!');

        await page.locator('button[type="submit"]').click();
        await waitForApp(page);

        // An error element should appear (MUI error class or ErrorText component)
        const errorEl = page.locator('.Mui-error, [class*="error"]').first();
        await expect(errorEl).toBeVisible();
    });

    test('submitting empty form -> validation errors visible', async ({ page }) => {
        await page.goto(REGISTER_URL);
        await waitForApp(page);

        await page.locator('button[type="submit"]').click();
        await waitForApp(page);

        // At least one validation error element should be visible
        const errorEl = page.locator('.Mui-error, [class*="error"]').first();
        await expect(errorEl).toBeVisible();
    });
});
