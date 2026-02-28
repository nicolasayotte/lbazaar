// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.teacher });

// ---------------------------------------------------------------------------
// F-06: Teaching Schedules
// ---------------------------------------------------------------------------
test.describe('F-06: Teaching Schedules', () => {

    test('F-06.1: teaching schedules page loads without errors', async ({ page }) => {
        const response = await page.goto('/mypage/schedules');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/schedules/);

        // Page renders table rows or empty state
        const rows = page.locator('table tbody tr');
        const count = await rows.count();
        if (count > 0) {
            await expect(rows.first()).toBeVisible();
        } else {
            const emptyState = page.locator('[class*="EmptyCard"], .MuiCard-root').first();
            await expect(emptyState).toBeVisible();
        }
    });

});

// ---------------------------------------------------------------------------
// F-07: Certificate Management UI
// ---------------------------------------------------------------------------
test.describe('F-07: Certificate Management UI', () => {

    async function getFirstClassId(page) {
        await page.goto('/mypage/manage-class');
        await waitForApp(page);

        const settingsLink = page.locator('a[href*="/mypage/manage-class/"]').first();
        const count = await settingsLink.count();
        if (count === 0) return null;

        const href = await settingsLink.getAttribute('href');
        if (!href) return null;

        const match = href.match(/\/mypage\/manage-class\/(\d+)/);
        return match ? match[1] : null;
    }

    test('F-07.1: certificate roster renders eligible students', async ({ page }) => {
        const classId = await getFirstClassId(page);
        test.skip(!classId, 'No classes found for teacher — skipping');

        const response = await page.goto(`/mypage/manage-class/${classId}/certificates`);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/manage-class\/\d+\/certificates/);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        test.skip(rowCount === 0, 'No students with completed status — skipping');

        // First row should have a non-empty name cell
        const nameCell = rows.first().locator('td').first();
        await expect(nameCell).not.toBeEmpty();
    });

    test('F-07.2: airdrop button is visible on certificates tab', async ({ page }) => {
        const classId = await getFirstClassId(page);
        test.skip(!classId, 'No classes found for teacher — skipping');

        const response = await page.goto(`/mypage/manage-class/${classId}/certificates`);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        // The Airdrop button is always rendered (may be disabled without wallet)
        const airdropButton = page.locator('button:has-text("Airdrop")');
        await expect(airdropButton).toBeVisible();
    });

});
