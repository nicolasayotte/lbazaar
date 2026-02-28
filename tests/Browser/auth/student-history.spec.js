// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.student });

// ---------------------------------------------------------------------------
// F-03: Course History
// ---------------------------------------------------------------------------
test.describe('F-03: Course History', () => {

    test('F-03.1: page loads without errors', async ({ page }) => {
        const response = await page.goto('/mypage/class-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/class-history/);
    });

    test('F-03.2: displays records or empty-state message', async ({ page }) => {
        await page.goto('/mypage/class-history');
        await waitForApp(page);

        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count > 0) {
            await expect(rows.first()).toBeVisible();
        } else {
            const emptyMsg = page.locator('h6:has-text("No Records Found")');
            await expect(emptyMsg).toBeVisible();
        }
    });

    test('F-03.3: records show class name and status indicator', async ({ page }) => {
        await page.goto('/mypage/class-history');
        await waitForApp(page);

        const rows = page.locator('table tbody tr');
        const count = await rows.count();
        test.skip(count === 0, 'No course history records in seed data (SC-04)');

        const firstRow = rows.first();
        const titleCell = firstRow.locator('td').first();
        await expect(titleCell).not.toBeEmpty();

        const statusCell = firstRow.locator('td').nth(5);
        const chipText = await statusCell.locator('.MuiChip-label').textContent();
        expect(['Ongoing', 'Completed']).toContain(chipText.trim());
    });

});

// ---------------------------------------------------------------------------
// F-04: Purchase History
// ---------------------------------------------------------------------------
test.describe('F-04: Purchase History', () => {

    test('F-04.1: page loads without errors', async ({ page }) => {
        const response = await page.goto('/mypage/purchase-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/purchase-history/);
    });

    test('F-04.2: displays records or empty-state message', async ({ page }) => {
        await page.goto('/mypage/purchase-history');
        await waitForApp(page);

        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count > 0) {
            const firstRow = rows.first();
            const cells = firstRow.locator('td');
            await expect(cells.nth(0)).not.toBeEmpty();
            await expect(cells.nth(1)).not.toBeEmpty();
            await expect(cells.nth(2)).not.toBeEmpty();
            await expect(cells.nth(3)).not.toBeEmpty();
        } else {
            const emptyMsg = page.locator('h6:has-text("You haven\'t purchased any classes yet.")');
            await expect(emptyMsg).toBeVisible();
        }
    });

});

// ---------------------------------------------------------------------------
// F-05: Wallet History
// ---------------------------------------------------------------------------
test.describe('F-05: Wallet History', () => {

    test('F-05.1: page loads without errors', async ({ page }) => {
        const response = await page.goto('/mypage/wallet-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/wallet-history/);
    });

    test('F-05.2: displays records or empty-state message', async ({ page }) => {
        await page.goto('/mypage/wallet-history');
        await waitForApp(page);

        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count > 0) {
            await expect(rows.first()).toBeVisible();
        } else {
            const emptyMsg = page.locator('h6:has-text("No Records Found")');
            await expect(emptyMsg).toBeVisible();
        }
    });

});
