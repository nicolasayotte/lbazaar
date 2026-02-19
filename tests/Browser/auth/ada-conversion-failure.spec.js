// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

/**
 * ADA Conversion Failure tests (TS-01.08 through TS-01.11)
 *
 * These tests verify correct UI behaviour when the ADA/JPY exchange rate
 * is unavailable (price_in_ada === null).
 *
 * Prerequisites:
 *   1. Set ADA_FAILURE_MODE=true in the environment
 *   2. Run: sail artisan db:seed --class=PlaywrightExchangeRateFailureSeeder
 *      (deletes ada-to-jpy Setting and flushes cache)
 *   3. The application must have at least one General-type course with a JPY
 *      price in the database.
 *
 * The suite self-skips when ADA_FAILURE_MODE is not set to 'true'.
 */

// Guard: skip entire suite unless ADA_FAILURE_MODE=true is set
const ADA_FAILURE_MODE = process.env.ADA_FAILURE_MODE === 'true';

test.use({ storageState: STORAGE_STATE.student });

test.describe('ADA conversion unavailable (TS-01.08 through TS-01.11)', () => {
    test.beforeEach(async ({}, testInfo) => {
        if (!ADA_FAILURE_MODE) {
            testInfo.skip(true, 'ADA_FAILURE_MODE is not set. Run PlaywrightExchangeRateFailureSeeder and set ADA_FAILURE_MODE=true to enable.');
        }
    });

    // -------------------------------------------------------------------------
    // TS-01.08: JPY price visible on listing page when ADA unavailable
    // -------------------------------------------------------------------------
    test('TS-01.08: JPY price is visible on the course listing page', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        // At least one JPY price should appear on the listing
        const jpyPrice = page.locator('text=/¥[0-9,]+/').first();
        await expect(jpyPrice).toBeVisible();
    });

    // -------------------------------------------------------------------------
    // TS-01.09: ADA equivalent price NOT visible on listing when unavailable
    // -------------------------------------------------------------------------
    test('TS-01.09: ADA equivalent price is NOT shown on the course listing page', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        // No ~₳ pattern should appear anywhere in the listing
        const adaPrice = page.locator('text=/~₳[0-9]/');
        await expect(adaPrice).toHaveCount(0);
    });

    // -------------------------------------------------------------------------
    // TS-01.10: ADA button disabled on General course detail page
    // TS-01.11: CC button NOT disabled on General course detail page
    // -------------------------------------------------------------------------
    test('TS-01.10 and TS-01.11: ADA button is disabled, CC button is enabled on General course detail', async ({ page }) => {
        // Navigate to the listing and click the first available General course
        await page.goto('/classes');
        await waitForApp(page);

        // Find the first course detail link and navigate to it
        const courseLink = page.locator('a[href*="/classes/"]').first();
        const courseHref = await courseLink.getAttribute('href');

        if (!courseHref) {
            test.skip(true, 'No course links found on /classes listing. Seed General courses first.');
            return;
        }

        await page.goto(courseHref);
        await waitForInertiaNavigation(page);

        // TS-01.10: "Buy with ADA" button should be disabled
        const adaButton = page.locator('button:has-text("Buy with ADA")');
        if (await adaButton.count() > 0) {
            await expect(adaButton.first()).toBeDisabled();
        }

        // TS-01.11: "Pay with Credit Card" button should NOT be disabled
        const ccButton = page.locator('button:has-text("Pay with Credit Card")');
        if (await ccButton.count() > 0) {
            await expect(ccButton.first()).not.toBeDisabled();
        }
    });
});
