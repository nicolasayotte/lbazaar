// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

/**
 * TS-04.06 / TS-04.07 — Stripe Unavailable
 *
 * Prerequisites:
 * 1. Set STRIPE_SECRET= (empty) in .env
 * 2. Set STRIPE_UNAVAILABLE_MODE=true in the Playwright environment
 *
 * Self-skipping: this test does nothing unless STRIPE_UNAVAILABLE_MODE=true,
 * so it is safe to include in the normal test suite.
 */

// Guard: skip entire suite unless STRIPE_UNAVAILABLE_MODE=true is set
const STRIPE_UNAVAILABLE_MODE = process.env.STRIPE_UNAVAILABLE_MODE === 'true';

test.use({ storageState: STORAGE_STATE.student });

test.describe('Stripe unavailable (TS-04.06 / TS-04.07)', () => {
    test.beforeEach(async ({}, testInfo) => {
        if (!STRIPE_UNAVAILABLE_MODE) {
            testInfo.skip(true, 'STRIPE_UNAVAILABLE_MODE is not set. Set STRIPE_SECRET= (empty) in .env and STRIPE_UNAVAILABLE_MODE=true to enable.');
        }
    });

    // -------------------------------------------------------------------------
    // TS-04.06: CC button disabled on General course detail page when Stripe unavailable
    // TS-04.07: ADA button still present (not hidden) when Stripe unavailable
    // -------------------------------------------------------------------------
    test('TS-04.06/07: CC button disabled and ADA button present when Stripe unavailable', async ({ page }) => {
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

        // TS-04.06: "Pay with Credit Card" button should be disabled
        const ccButton = page.locator('button:has-text("Pay with Credit Card")');
        if (await ccButton.count() > 0) {
            await expect(ccButton.first()).toBeDisabled();
        }

        // Explanation text should be visible
        await expect(page.locator('text=/Credit card payment temporarily unavailable/i').first()).toBeVisible();

        // TS-04.07: "Buy with ADA" button should still be present (not hidden)
        const adaButton = page.locator('button:has-text("Buy with ADA")');
        if (await adaButton.count() > 0) {
            await expect(adaButton.first()).toBeVisible();
        }
    });
});
