// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.teacher });

test.describe('F-01: Class Applications', () => {

    test('F-01.1: class applications list page loads without errors', async ({ page }) => {
        const response = await page.goto('/mypage/class-application');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/mypage\/class-application/);

        // Either the table or an empty state card must be present
        const tableOrEmpty = page.locator('table, [class*="EmptyCard"], .MuiCard-root').first();
        await expect(tableOrEmpty).toBeVisible();
    });

    test('F-01.2: create class application form renders required fields', async ({ page }) => {
        const response = await page.goto('/mypage/class-application/create');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/mypage\/class-application\/create/);

        // Required visible inputs
        await expect(page.locator('input[name="title"]')).toBeVisible();
        await expect(page.locator('textarea[name="description"]').first()).toBeVisible();

        // Submit button
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('F-01.3: submitting a valid class application succeeds', async ({ page }) => {
        await page.goto('/mypage/class-application/create');
        await waitForApp(page);

        const testTitle = `[E2E-TEST] Class App ${Date.now()}`;

        // Fill title
        await page.locator('input[name="title"]').fill(testTitle);

        // Fill length
        await page.locator('input[name="length"]').fill('01:30:00');

        // Fill description
        const descriptionField = page.locator('textarea[name="description"]').first();
        await descriptionField.fill('E2E test description for automated submission.');

        // Submit the form
        await page.locator('button[type="submit"]').click();

        // Wait for Inertia POST → redirect → GET index
        await waitForInertiaNavigation(page);

        // Must land on index (not create page)
        await expect(page).toHaveURL(/\/mypage\/class-application(?!\/create)/);

        // New application title must appear somewhere on the page
        await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 5000 });
    });

    test('F-01.4: submitting incomplete application shows validation errors', async ({ page }) => {
        await page.goto('/mypage/class-application/create');
        await waitForApp(page);

        // Clear title (it is empty by default, but be explicit)
        await page.locator('input[name="title"]').fill('');

        // Submit without filling required fields
        await page.locator('button[type="submit"]').click();

        // Wait for Inertia to re-render with errors
        await page.waitForLoadState('networkidle');

        // MUI adds .Mui-error to FormControl wrappers when errors prop is non-empty
        await expect(page.locator('.Mui-error').first()).toBeVisible({ timeout: 5000 });

        // Must stay on create page
        await expect(page).toHaveURL(/\/mypage\/class-application\/create/);
    });

    test('F-01.5: class application detail page renders', async ({ page }) => {
        await page.goto('/mypage/class-application');
        await waitForApp(page);

        // Check for at least one data row in the table
        const firstViewLink = page.locator('table tbody tr').first().locator('a[href*="/details/"]');
        const rowCount = await page.locator('table tbody tr').count();

        if (rowCount === 0) {
            test.skip(true, 'No class applications exist — skipping detail view test');
            return;
        }

        const detailHref = await firstViewLink.getAttribute('href');
        if (!detailHref) {
            test.skip(true, 'No detail link found on first row — skipping');
            return;
        }

        const response = await page.goto(detailHref);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/mypage\/class-application\/details\//);

        // Detail page must show a status Chip and a "Back" button
        await expect(page.locator('.MuiChip-root').first()).toBeVisible();
    });

});
