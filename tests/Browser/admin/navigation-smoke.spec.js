// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.admin });

// ─── F-14: Admin Navigation ───────────────────────────────────────────────────

test.describe('F-14: Admin Navigation', () => {

    test('F-14.1: admin sidebar shows all main navigation sections', async ({ page }) => {
        const response = await page.goto('/admin/class-applications');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('a[href="/admin/class-applications"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/inquiries"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/wallet-history"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/refunds"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/profile"]').first()).toBeVisible();
    });

    test('F-14.1b: admin sidebar Settings submenu shows all settings sections', async ({ page }) => {
        const response = await page.goto('/admin/settings/categories');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('a[href="/admin/settings/categories"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/settings/class-types"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/settings/nft"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/settings/translations"]').first()).toBeVisible();
        await expect(page.locator('a[href="/admin/settings/general"]').first()).toBeVisible();
    });

    test('F-14.2: each main admin section is reachable via sidebar link', async ({ page }) => {
        await page.goto('/admin/class-applications');
        await waitForApp(page);

        await page.locator('a[href="/admin/users"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/users/);

        await page.locator('a[href="/admin/inquiries"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/inquiries/);

        await page.locator('a[href="/admin/wallet-history"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/wallet-history/);

        await page.locator('a[href="/admin/refunds"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/refunds/);

        await page.locator('a[href="/admin/profile"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/profile/);
    });

    test('F-14.2b: Settings submenu sections are reachable via sidebar', async ({ page }) => {
        await page.goto('/admin/settings/categories');
        await waitForApp(page);

        await page.locator('a[href="/admin/settings/general"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/settings\/general/);

        await expect(page.locator('a[href="/admin/settings/categories"]').first()).toBeVisible();

        await page.locator('a[href="/admin/settings/translations"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/settings\/translations/);

        await page.locator('a[href="/admin/settings/nft"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/settings\/nft/);

        await page.locator('a[href="/admin/settings/class-types"]').first().click();
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/settings\/class-types/);
    });
});

// ─── F-15: Route Smoke Test ───────────────────────────────────────────────────

test.describe('F-15: Route Smoke Test — Admin', () => {
    const routes = [
        { name: 'Profile',                  path: '/admin/profile' },
        { name: 'Users',                    path: '/admin/users' },
        { name: 'Inquiries',               path: '/admin/inquiries' },
        { name: 'Class Applications',      path: '/admin/class-applications' },
        { name: 'Settings: Categories',    path: '/admin/settings/categories' },
        { name: 'Settings: Class Types',   path: '/admin/settings/class-types' },
        { name: 'Settings: Classifications', path: '/admin/settings/classifications' },
        { name: 'Settings: NFT',           path: '/admin/settings/nft' },
        { name: 'Settings: Translations',  path: '/admin/settings/translations' },
        { name: 'Settings: General',       path: '/admin/settings/general' },
        { name: 'Wallet History',          path: '/admin/wallet-history' },
        { name: 'Refunds',                 path: '/admin/refunds' },
    ];

    for (const route of routes) {
        test(`${route.name} returns non-500`, async ({ page }) => {
            const response = await page.goto(route.path);
            expect(response.status()).toBeLessThan(500);
            await waitForApp(page);
        });
    }
});
