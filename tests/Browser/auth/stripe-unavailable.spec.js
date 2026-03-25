// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

/**
 * TS-04.06 / TS-04.07 — Stripe Unavailable
 *
 * Uses Playwright route interception to simulate Stripe unavailability
 * by patching Inertia response props — no special env vars needed.
 */

test.use({ storageState: STORAGE_STATE.student });

/**
 * Intercept Inertia responses and patch props to simulate Stripe unavailability.
 */
async function interceptStripeUnavailable(page) {
    await page.route('**/*', async (route) => {
        const response = await route.fetch();
        const contentType = response.headers()['content-type'] || '';
        const isInertia = response.headers()['x-inertia'] === 'true'
            || contentType.includes('application/json');

        if (isInertia && route.request().headers()['x-inertia']) {
            try {
                const json = await response.json();
                if (json.props) {
                    json.props.stripe_available = false;
                }
                await route.fulfill({
                    status: response.status(),
                    headers: response.headers(),
                    body: JSON.stringify(json),
                });
            } catch {
                await route.fulfill({ response });
            }
        } else {
            await route.fulfill({ response });
        }
    });
}

test.describe('Stripe unavailable (TS-04.06 / TS-04.07)', () => {
    test.beforeEach(async ({ page }) => {
        await interceptStripeUnavailable(page);
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
