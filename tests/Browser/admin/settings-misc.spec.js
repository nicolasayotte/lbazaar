// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.admin });

// ─── F-09: Settings — Translations ───────────────────────────────────────────

test.describe('F-09: Settings — Translations', () => {

    test('F-09.1: translations settings page loads', async ({ page }) => {
        const response = await page.goto('/admin/settings/translations');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/settings\/translations/);

        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
    });

    test('F-09.2: editing a translation succeeds and persists', async ({ page }) => {
        await page.goto('/admin/settings/translations');
        await waitForApp(page);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        test.skip(rowCount === 0, 'No translation rows — skipping edit test');

        const firstInput = rows.first().locator('input[name="translations"]');
        const originalValue = await firstInput.inputValue();
        const testValue = originalValue + '_pw_test';

        await firstInput.fill(testValue);

        const saveBtn = page.locator('button:has-text("Save")').first();
        await saveBtn.click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });
        const confirmBtn = dialog.locator('button.MuiButton-contained');
        const responsePromise = page.waitForResponse(
            resp => resp.url().includes('/admin/settings/translations') && resp.status() < 500
        );
        await confirmBtn.click();
        await responsePromise;
        await waitForInertiaNavigation(page);

        // Verify persistence on reload
        await page.goto('/admin/settings/translations');
        await waitForApp(page);
        const reloadedInput = page.locator('table tbody tr').first().locator('input[name="translations"]');
        await expect(reloadedInput).toHaveValue(testValue);

        // Restore original value
        await reloadedInput.fill(originalValue);
        const restoreSaveBtn = page.locator('button:has-text("Save")').first();
        await restoreSaveBtn.click();
        const restoreDialog = page.locator('[role="dialog"]');
        await expect(restoreDialog).toBeVisible({ timeout: 5000 });
        const restoreConfirm = restoreDialog.locator('button.MuiButton-contained');
        const restorePromise = page.waitForResponse(
            resp => resp.url().includes('/admin/settings/translations') && resp.status() < 500
        );
        await restoreConfirm.click();
        await restorePromise;
        await waitForInertiaNavigation(page);
    });
});

// ─── F-10: Settings — General ─────────────────────────────────────────────────

test.describe('F-10: Settings — General', () => {

    test('F-10.1: general settings page loads without errors', async ({ page }) => {
        const response = await page.goto('/admin/settings/general');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/settings\/general/);

        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
    });

    test('F-10.2: updating a general setting succeeds and persists', async ({ page }) => {
        await page.goto('/admin/settings/general');
        await waitForApp(page);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        test.skip(rowCount === 0, 'No general settings rows — skipping edit test');

        // First input may be type="number" — use a numeric increment instead of text suffix
        const firstInput = rows.first().locator('input').first();
        const inputType = await firstInput.getAttribute('type');
        const originalValue = await firstInput.inputValue();
        const testValue = inputType === 'number'
            ? String(Number(originalValue) + 1)
            : originalValue + '_pw';

        await firstInput.click();
        await page.keyboard.press('Control+a');
        await firstInput.pressSequentially(testValue);

        const saveBtn = page.locator('button:has-text("Save")').first();
        await saveBtn.click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });
        const confirmBtn = dialog.locator('button.MuiButton-contained');
        const responsePromise = page.waitForResponse(
            resp => resp.url().includes('/admin/settings/general') && resp.status() < 500
        );
        await confirmBtn.click();
        await responsePromise;
        await waitForInertiaNavigation(page);

        // Verify persistence on reload
        await page.goto('/admin/settings/general');
        await waitForApp(page);
        const reloadedInput = page.locator('table tbody tr').first().locator('input').first();
        await expect(reloadedInput).toHaveValue(testValue);

        // Restore original value
        await reloadedInput.click();
        await page.keyboard.press('Control+a');
        await reloadedInput.pressSequentially(originalValue);
        const restoreSaveBtn = page.locator('button:has-text("Save")').first();
        await restoreSaveBtn.click();
        const restoreDialog = page.locator('[role="dialog"]');
        await expect(restoreDialog).toBeVisible({ timeout: 5000 });
        const restoreConfirm = restoreDialog.locator('button.MuiButton-contained');
        const restorePromise = page.waitForResponse(
            resp => resp.url().includes('/admin/settings/general') && resp.status() < 500
        );
        await restoreConfirm.click();
        await restorePromise;
        await waitForInertiaNavigation(page);
    });
});

// ─── F-11: Wallet History ─────────────────────────────────────────────────────

test.describe('F-11: Wallet History', () => {

    test('F-11.1: admin wallet history page loads with records or empty state', async ({ page }) => {
        const response = await page.goto('/admin/wallet-history');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/wallet-history/);

        // Either table rows or empty card
        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
    });
});

// ─── F-12: Refunds ────────────────────────────────────────────────────────────

test.describe('F-12: Refunds', () => {

    test('F-12.1: refunds page loads with records or empty state', async ({ page }) => {
        const response = await page.goto('/admin/refunds');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/refunds/);

        // Filter form keyword input is always present
        await expect(page.locator('input[name="keyword"]')).toBeVisible();

        // Either table or empty card
        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
    });
});

// ─── F-13: Admin Certificate Roster ───────────────────────────────────────────

test.describe('F-13: Admin Certificate Roster', () => {

    test('F-13.1: admin can view certificate roster for a course', async ({ page }) => {
        // Discover a course ID from the public /classes listing
        await page.goto('/classes');
        await waitForApp(page);

        const courseLink = page.locator('a[href*="/classes/"]').first();
        const linkCount = await courseLink.count();
        if (linkCount === 0) {
            test.skip(true, 'No courses found in /classes listing — skipping');
            return;
        }

        const href = await courseLink.getAttribute('href');
        if (!href) {
            test.skip(true, 'No course link href found — skipping');
            return;
        }

        const match = href.match(/\/classes\/(\d+)/);
        if (!match) {
            test.skip(true, 'Could not extract course ID from link — skipping');
            return;
        }

        const courseId = match[1];
        const response = await page.goto(`/admin/courses/${courseId}/certificates`);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(new RegExp(`/admin/courses/${courseId}/certificates`));

        // Page renders either a roster table or empty state
        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
    });
});
