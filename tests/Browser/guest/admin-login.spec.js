// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { TEST_USERS } from '../helpers/test-users.js';
import { LoginPage } from '../pages/LoginPage.js';

// F-05.1: Admin login page renders form elements
test.describe('F-05.1: Admin login page renders form elements', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('renders email input', async ({ page }) => {
        await page.goto('/admin/login');
        await waitForApp(page);
        await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('renders password input', async ({ page }) => {
        await page.goto('/admin/login');
        await waitForApp(page);
        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('renders submit button', async ({ page }) => {
        await page.goto('/admin/login');
        await waitForApp(page);
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
});

// F-05.2: Successful admin login redirects to admin panel
test.describe('F-05.2: Successful admin login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('valid admin credentials redirect away from /admin/login', async ({ page }) => {
        const loginPage = new LoginPage(page, '/admin/login');
        await loginPage.goto();
        await loginPage.loginAndWaitForRedirect(TEST_USERS.admin.email, TEST_USERS.admin.password);
        await expect(page).not.toHaveURL(/\/admin\/login/);
        await expect(page).toHaveURL(/\/admin\//);
    });
});

// F-05.3: Invalid admin credentials show error
test.describe('F-05.3: Invalid admin credentials', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('wrong credentials show error and stay on /admin/login', async ({ page }) => {
        const loginPage = new LoginPage(page, '/admin/login');
        await loginPage.goto();
        await loginPage.login('wrong@example.com', 'wrongpassword');
        await waitForInertiaNavigation(page);
        // Assert on error text content — stable across MUI versions
        await expect(page.getByText(/do not match our records/i)).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/login/);
    });
});
