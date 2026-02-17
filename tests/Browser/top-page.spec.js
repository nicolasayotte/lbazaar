// @ts-check
import { test, expect } from '@playwright/test';

// Wait for Inertia/React app to mount before asserting on React-rendered content.
// Requires Vite dev server running: sail npm run dev
const waitForApp = async (page) => {
    await page.waitForSelector('#app', { state: 'attached' });
    // Wait for React to hydrate (the #app div should have child content)
    await page.waitForFunction(() => {
        const app = document.querySelector('#app');
        return app && app.children.length > 0;
    }, { timeout: 10000 });
};

test.describe('Top Page', () => {
    test('loads the top page with welcome title', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/LE BAZAAR/i);
    });

    test('displays navigation elements', async ({ page }) => {
        await page.goto('/');
        await waitForApp(page);

        // The page should have a visible link to classes
        const classesLink = page.locator('a[href*="classes"]').first();
        await expect(classesLink).toBeVisible();
    });
});

test.describe('Login Page', () => {
    test('renders the portal login form', async ({ page }) => {
        await page.goto('/portal/login');
        await waitForApp(page);

        // Login page should have email and password fields
        await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
        await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
    });

    test('has a submit button', async ({ page }) => {
        await page.goto('/portal/login');
        await waitForApp(page);

        const submitButton = page.locator('button[type="submit"]').first();
        await expect(submitButton).toBeVisible();
    });
});
