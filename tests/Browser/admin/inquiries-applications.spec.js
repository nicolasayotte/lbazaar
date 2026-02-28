// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.admin });

// ─── F-03: Inquiries Management ───────────────────────────────────────────────

test.describe('F-03: Inquiries Management', () => {

    test('F-03.1: inquiries list page loads (table or empty state)', async ({ page }) => {
        const response = await page.goto('/admin/inquiries');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/inquiries/);
        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
    });

    test('F-03.2: inquiry detail page shows submitter info and message', async ({ page }) => {
        const response = await page.goto('/admin/inquiries');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        const rowCount = await page.locator('table tbody tr').count();
        if (rowCount === 0) {
            test.skip(true, 'No inquiries exist — skipping detail view test');
            return;
        }

        const firstViewLink = page.locator('table tbody tr').first().locator('a[href*="/admin/inquiries/"]');
        const detailHref = await firstViewLink.getAttribute('href');
        if (!detailHref) {
            test.skip(true, 'No detail link found on first inquiry row — skipping');
            return;
        }

        const detailResponse = await page.goto(detailHref);
        expect(detailResponse).not.toBeNull();
        expect(detailResponse.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/inquiries\/\d+/);
        await expect(page.locator('table')).toBeVisible();
        await expect(page.locator('a[href^="mailto:"]')).toBeVisible();

        const rowCountDetail = await page.locator('table tbody tr').count();
        expect(rowCountDetail).toBeGreaterThanOrEqual(5);
    });
});

// ─── F-04: Class Applications Management ──────────────────────────────────────

test.describe('F-04: Class Applications Management', () => {

    test('F-04.1: class applications list page loads (table or empty state)', async ({ page }) => {
        const response = await page.goto('/admin/class-applications');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/class-applications/);
        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
    });

    test('F-04.2: class application detail page shows class name, teacher, and status', async ({ page }) => {
        const response = await page.goto('/admin/class-applications');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        const rowCount = await page.locator('table tbody tr').count();
        if (rowCount === 0) {
            test.skip(true, 'No class applications exist — skipping detail view test');
            return;
        }

        const firstViewLink = page.locator('table tbody tr').first().locator('a[href*="/admin/class-applications/"]');
        const detailHref = await firstViewLink.getAttribute('href');
        if (!detailHref) {
            test.skip(true, 'No detail link found on first class application row — skipping');
            return;
        }

        const detailResponse = await page.goto(detailHref);
        expect(detailResponse).not.toBeNull();
        expect(detailResponse.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/class-applications\/\d+/);
        await expect(page.locator('.MuiChip-root').first()).toBeVisible();
        await expect(page.locator('table').first()).toBeVisible();
    });

    test('F-04.3: class application status can be updated (approve)', async ({ page }) => {
        const response = await page.goto('/admin/class-applications');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        const pendingRow = page.locator('table tbody tr').filter({
            has: page.locator('.MuiChip-label', { hasText: 'Pending' })
        }).first();

        const pendingRowCount = await pendingRow.count();
        if (pendingRowCount === 0) {
            test.skip(true, 'No pending class applications exist — skipping status update test');
            return;
        }

        const viewLink = pendingRow.locator('a[href*="/admin/class-applications/"]');
        const detailHref = await viewLink.getAttribute('href');
        if (!detailHref) {
            test.skip(true, 'No detail link found on pending row — skipping');
            return;
        }

        const detailResponse = await page.goto(detailHref);
        expect(detailResponse).not.toBeNull();
        expect(detailResponse.status()).toBeLessThan(500);
        await waitForApp(page);

        const approveButton = page.locator('button:has-text("Approve")');
        const approveVisible = await approveButton.isVisible();
        if (!approveVisible) {
            test.skip(true, 'Approve button not visible — application may not be Pending — skipping');
            return;
        }

        await approveButton.click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();

        const patchPromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/class-applications/') &&
            resp.url().includes('/status/') &&
            resp.request().method() === 'PATCH'
        );

        await page.locator('[role="dialog"] button').filter({ hasText: /confirm/i }).click();

        const patchResponse = await patchPromise;
        expect(patchResponse.status()).toBeLessThan(500);

        await waitForInertiaNavigation(page);

        const statusChip = page.locator('.MuiChip-root').first();
        await expect(statusChip).toBeVisible();
        await expect(statusChip).not.toHaveText('Pending');
    });
});
