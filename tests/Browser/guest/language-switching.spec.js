// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';

// F-09.1: Language switch changes page content
test.describe('F-09.1: Language switch changes page content', () => {
    test('switching to English shows English content', async ({ page }) => {
        await page.goto('/lang/en');
        await waitForApp(page);
        const englishContent = page.getByText(/welcome to le bazaar/i);
        await expect(englishContent).toBeVisible();
    });

    test('switching to Japanese shows Japanese content', async ({ page }) => {
        await page.goto('/lang/ja');
        await waitForApp(page);
        const japaneseContent = page.getByText(/LE Bazaar にようこそ/);
        await expect(japaneseContent).toBeVisible();
    });

    test('language toggle links present in navbar', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);
        const langLink = page.locator('a[href*="/lang/"]');
        await expect(langLink.first()).toBeVisible();
    });
});
