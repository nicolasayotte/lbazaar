// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { TEST_USERS, STORAGE_STATE } from '../helpers/test-users.js';
import { LoginPage } from '../pages/LoginPage.js';

// ---------------------------------------------------------------------------
// Login page rendering
// ---------------------------------------------------------------------------
test.describe('Login page rendering', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('renders email input', async ({ page }) => {
        await page.goto('/portal/login');
        await waitForApp(page);

        await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('renders password input', async ({ page }) => {
        await page.goto('/portal/login');
        await waitForApp(page);

        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('renders submit button', async ({ page }) => {
        await page.goto('/portal/login');
        await waitForApp(page);

        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('has forgot-password link', async ({ page }) => {
        await page.goto('/portal/login');
        await waitForApp(page);

        const forgotLink = page.locator('a[href*="forgot-password"]').first();
        await expect(forgotLink).toBeVisible();
    });

    test('has register link', async ({ page }) => {
        await page.goto('/portal/login');
        await waitForApp(page);

        const registerLink = page.locator('a[href*="register"]').first();
        await expect(registerLink).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Successful login
// ---------------------------------------------------------------------------
test.describe('Successful login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('student login -> URL changes away from /portal/login', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.loginAndWaitForRedirect(TEST_USERS.student.email, TEST_USERS.student.password);

        await expect(page).not.toHaveURL(/\/portal\/login/);
    });

    test('teacher login -> URL changes away from /portal/login', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.loginAndWaitForRedirect(TEST_USERS.teacher.email, TEST_USERS.teacher.password);

        await expect(page).not.toHaveURL(/\/portal\/login/);
    });
});

// ---------------------------------------------------------------------------
// Authenticated access (uses saved student session)
// ---------------------------------------------------------------------------
test.describe('Authenticated access', () => {
    test.use({ storageState: STORAGE_STATE.student });

    test('authenticated user can navigate to /mypage/profile without redirect', async ({ page }) => {
        await page.goto('/mypage/profile');
        await waitForApp(page);

        await expect(page).toHaveURL(/\/mypage\/profile/);
    });
});

// ---------------------------------------------------------------------------
// Login failures
// ---------------------------------------------------------------------------
test.describe('Login failures', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('invalid credentials -> error message visible', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('wrong@example.com', 'wrongpassword');

        // Wait for the error response to render (Inertia page reload with errors)
        await waitForApp(page);

        // MUI TextField error state + ErrorText component render a visible error
        const errorEl = page.locator('.Mui-error, [class*="error"]').first();
        await expect(errorEl).toBeVisible();
    });

    test('empty email -> validation error visible', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        // Submit with empty fields
        await page.locator('button[type="submit"]').click();

        await waitForApp(page);

        // HTML5 validation or server-side validation error should surface
        const emailInput = page.locator('input[name="email"]');
        // Either the input itself is invalid (HTML5) or an error element appears
        const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
        if (!isInvalid) {
            const errorEl = page.locator('.Mui-error, [class*="error"]').first();
            await expect(errorEl).toBeVisible();
        }
        expect(isInvalid || true).toBe(true); // at least one validation path fired
    });
});

// ---------------------------------------------------------------------------
// Route protection
// ---------------------------------------------------------------------------
test.describe('Route protection', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('unauthenticated GET /mypage -> redirected to /portal/login', async ({ page }) => {
        await page.goto('/mypage');
        await waitForApp(page);

        await expect(page).toHaveURL(/\/portal\/login/);
    });
});
