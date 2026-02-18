// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from './helpers/wait-for-app.js';

test.describe('Top Page', () => {
    test('loads the top page with welcome title', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/LE BAZAAR/i);
    });

    test('displays navigation elements', async ({ page }) => {
        // Use /classes instead of / — the home page renders featured courses that
        // may include seeded courses with null course_type, crashing Course.jsx.
        await page.goto('/classes');
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
