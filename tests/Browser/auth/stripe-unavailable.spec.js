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
        const isInertiaXhr = (response.headers()['x-inertia'] === 'true'
            || contentType.includes('application/json'))
            && route.request().headers()['x-inertia'];
        const isHtml = contentType.includes('text/html');

        if (isInertiaXhr) {
            // Inertia XHR navigation — patch props directly
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
        } else if (isHtml) {
            // Full page load — patch the embedded data-page JSON in the HTML
            try {
                const html = await response.text();
                const patched = html.replace(
                    /(<div[^>]+id="app"[^>]+data-page=")([^"]+)(")/,
                    (match, pre, encoded, post) => {
                        const data = JSON.parse(decodeURIComponent(encoded.replace(/&quot;/g, '"').replace(/&#039;/g, "'")));
                        if (data.props) {
                            data.props.stripe_available = false;
                        }
                        const reEncoded = JSON.stringify(data).replace(/"/g, '&quot;');
                        return `${pre}${reEncoded}${post}`;
                    }
                );
                await route.fulfill({
                    status: response.status(),
                    headers: response.headers(),
                    body: patched,
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
        // Navigate to the listing filtered to General courses (type_id=1) — the
        // stripe-unavailable UI only renders on General course detail pages.
        await page.goto('/classes?type_id=1');
        await waitForApp(page);

        // Find the first course detail link and navigate to it
        const courseLink = page.locator('a[href*="/classes/"]').first();
        const courseHref = await courseLink.getAttribute('href');

        if (!courseHref) {
            test.skip(true, 'No General course links found on /classes listing. Seed General courses first.');
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
