// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.admin });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function waitForDialog(page, titleText) {
    await expect(page.locator('.MuiDialog-root')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.MuiDialogTitle-root')).toContainText(titleText);
}

async function clickDialogConfirm(page) {
    const dialogActions = page.locator('.MuiDialogActions-root');
    await dialogActions.locator('button.MuiButton-contained').click();
}

// ─── F-05: Settings — Course Categories ───────────────────────────────────────

test.describe.serial('F-05: Settings — Course Categories', () => {
    // Category name validation: letters and spaces only — no numbers
    const uid = Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 8);
    const testCategoryName = `PW Test Category ${uid}`;

    test('F-05.1: categories settings page loads', async ({ page }) => {
        const response = await page.goto('/admin/settings/categories');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/settings\/categories/);
        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
        await expect(page.locator('button').filter({ hasText: /Create/i }).first()).toBeVisible();
    });

    test('F-05.2: creating a new category via dialog succeeds', async ({ page }) => {
        await page.goto('/admin/settings/categories');
        await waitForApp(page);

        await page.locator('button').filter({ hasText: /Create/i }).first().click();
        await waitForDialog(page, 'Create');

        const nameInput = page.locator('.MuiDialog-root input[name="name"]');
        await nameInput.click();
        await nameInput.pressSequentially(testCategoryName);

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/categories') && resp.request().method() === 'POST'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: testCategoryName }).first())
            .toBeVisible({ timeout: 5000 });
    });

    test('F-05.3: editing a category via dialog succeeds', async ({ page }) => {
        await page.goto('/admin/settings/categories');
        await waitForApp(page);

        const testRow = page.locator('table tbody tr').filter({ hasText: testCategoryName }).first();
        if (await testRow.count() === 0) {
            test.skip(true, 'Test category not found — skipping edit test');
            return;
        }

        await testRow.locator('button[title="Edit"]').click();
        await waitForDialog(page, 'Edit');

        const nameInput = page.locator('.MuiDialog-root input[name="name"]');
        await nameInput.click();
        await nameInput.press('Control+a');
        await nameInput.press('Backspace');
        const updatedName = testCategoryName + ' EDITED';
        await nameInput.pressSequentially(updatedName);

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/categories') && resp.request().method() === 'PATCH'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: updatedName }).first())
            .toBeVisible({ timeout: 5000 });
    });

    test('F-05.4: deleting a test-created category succeeds', async ({ page }) => {
        await page.goto('/admin/settings/categories');
        await waitForApp(page);

        const editedName = testCategoryName + ' EDITED';
        let testRow = page.locator('table tbody tr').filter({ hasText: editedName }).first();
        if (await testRow.count() === 0) {
            testRow = page.locator('table tbody tr').filter({ hasText: testCategoryName }).first();
        }
        if (await testRow.count() === 0) {
            test.skip(true, 'Test category not found — skipping delete test');
            return;
        }

        await testRow.locator('button[title="Delete"]').click();
        await waitForDialog(page, 'Delete');

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/categories') && resp.request().method() === 'DELETE'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: testCategoryName }).first())
            .not.toBeVisible({ timeout: 5000 });
    });
});

// ─── F-06: Settings — Course Types ────────────────────────────────────────────

test.describe('F-06: Settings — Course Types', () => {
    test('F-06.1: course types settings page loads without errors', async ({ page }) => {
        const response = await page.goto('/admin/settings/class-types');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/settings\/class-types/);
        await expect(page.locator('table')).toBeVisible();
    });
});

// ─── F-07: Settings — Classifications ─────────────────────────────────────────

test.describe.serial('F-07: Settings — Classifications', () => {
    const testClassificationName = `E2E Test Classification ${Date.now()}`;
    const testCommissionRate = '15';
    const updatedClassificationName = testClassificationName + ' EDITED';

    test('F-07.1: classifications settings page loads', async ({ page }) => {
        const response = await page.goto('/admin/settings/classifications');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/settings\/classifications/);
        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
        await expect(page.locator('button').filter({ hasText: /Create/i }).first()).toBeVisible();
    });

    test('F-07.2a: creating a new classification via dialog succeeds', async ({ page }) => {
        await page.goto('/admin/settings/classifications');
        await waitForApp(page);

        await page.locator('button').filter({ hasText: /Create/i }).first().click();
        await waitForDialog(page, 'Create');

        const nameInput = page.locator('.MuiDialog-root input[name="name"]');
        await nameInput.click();
        await nameInput.pressSequentially(testClassificationName);

        // Note: "commision_rate" is the actual field name in the DB/codebase — single 's' is intentional.
        const rateInput = page.locator('.MuiDialog-root input[name="commision_rate"]');
        await rateInput.click();
        await rateInput.pressSequentially(testCommissionRate);

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/classifications') && resp.request().method() === 'POST'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: testClassificationName }).first())
            .toBeVisible({ timeout: 5000 });
    });

    test('F-07.2b: editing the classification via dialog succeeds', async ({ page }) => {
        await page.goto('/admin/settings/classifications');
        await waitForApp(page);

        const testRow = page.locator('table tbody tr').filter({ hasText: testClassificationName }).first();
        if (await testRow.count() === 0) {
            test.skip(true, 'Test classification not found — skipping edit test');
            return;
        }

        await testRow.locator('button[title="Edit"]').click();
        await waitForDialog(page, 'Edit');

        const nameInput = page.locator('.MuiDialog-root input[name="name"]');
        await nameInput.click();
        await nameInput.press('Control+a');
        await nameInput.press('Backspace');
        await nameInput.pressSequentially(updatedClassificationName);

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/classifications') && resp.request().method() === 'PATCH'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: updatedClassificationName }).first())
            .toBeVisible({ timeout: 5000 });
    });

    test('F-07.2c: deleting the classification via dialog succeeds', async ({ page }) => {
        await page.goto('/admin/settings/classifications');
        await waitForApp(page);

        let testRow = page.locator('table tbody tr').filter({ hasText: updatedClassificationName }).first();
        if (await testRow.count() === 0) {
            testRow = page.locator('table tbody tr').filter({ hasText: testClassificationName }).first();
        }
        if (await testRow.count() === 0) {
            test.skip(true, 'Test classification not found — skipping delete test');
            return;
        }

        const deleteBtn = testRow.locator('button[title="Delete"]');
        await expect(deleteBtn).toBeVisible();
        await deleteBtn.click();
        await waitForDialog(page, 'Delete');

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/classifications') && resp.request().method() === 'DELETE'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: testClassificationName }).first())
            .not.toBeVisible({ timeout: 5000 });
    });
});

// ─── F-08: Settings — NFT Configuration ──────────────────────────────────────

test.describe.serial('F-08: Settings — NFT Configuration', () => {
    // NFT name validation: alpha_dash (letters, numbers, dashes, underscores — NO spaces)
    const testNftName = `E2E-Test-NFT-${Date.now()}`;
    const testImageUrl = 'QmTestCID123ExampleIPFSHash';
    const updatedNftName = `E2E-Test-NFT-${Date.now()}-edited`;

    test('F-08.1: NFT settings page loads', async ({ page }) => {
        const response = await page.goto('/admin/settings/nft');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/settings\/nft/);
        const tableOrEmpty = page.locator('table, .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
        await expect(page.locator('button').filter({ hasText: /Create/i }).first()).toBeVisible();
    });

    test('F-08.2a: creating a new NFT config via dialog succeeds', async ({ page }) => {
        await page.goto('/admin/settings/nft');
        await waitForApp(page);

        await page.locator('button').filter({ hasText: /Create/i }).first().click();
        await waitForDialog(page, 'Create');

        const nameInput = page.locator('.MuiDialog-root input[name="name"]');
        await nameInput.click();
        await nameInput.pressSequentially(testNftName);

        const imageInput = page.locator('.MuiDialog-root input[name="imageUrl"]');
        await imageInput.click();
        await imageInput.pressSequentially(testImageUrl);

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/nft') && resp.request().method() === 'POST'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: testNftName }).first())
            .toBeVisible({ timeout: 5000 });
    });

    test('F-08.2b: editing the NFT config via dialog succeeds', async ({ page }) => {
        await page.goto('/admin/settings/nft');
        await waitForApp(page);

        const testRow = page.locator('table tbody tr').filter({ hasText: testNftName }).first();
        if (await testRow.count() === 0) {
            test.skip(true, 'Test NFT not found — skipping edit test');
            return;
        }

        await testRow.locator('button[title="Edit"]').click();
        await waitForDialog(page, 'Edit');

        const nameInput = page.locator('.MuiDialog-root input[name="name"]');
        await nameInput.click();
        await nameInput.press('Control+a');
        await nameInput.press('Backspace');
        await nameInput.pressSequentially(updatedNftName);

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/nft') && resp.request().method() === 'PATCH'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: updatedNftName }).first())
            .toBeVisible({ timeout: 5000 });
    });

    test('F-08.2c: deleting the NFT config via dialog succeeds', async ({ page }) => {
        await page.goto('/admin/settings/nft');
        await waitForApp(page);

        let testRow = page.locator('table tbody tr').filter({ hasText: updatedNftName }).first();
        if (await testRow.count() === 0) {
            testRow = page.locator('table tbody tr').filter({ hasText: testNftName }).first();
        }
        if (await testRow.count() === 0) {
            test.skip(true, 'Test NFT not found — skipping delete test');
            return;
        }

        await testRow.locator('button[title="Delete"]').click();
        await waitForDialog(page, 'Delete');

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/settings/nft') && resp.request().method() === 'DELETE'
        );
        await clickDialogConfirm(page);
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page.locator('table td').filter({ hasText: testNftName }).first())
            .not.toBeVisible({ timeout: 5000 });
    });
});
