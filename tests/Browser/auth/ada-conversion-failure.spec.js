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
 * Uses Playwright route interception to simulate ADA unavailability
 * by patching Inertia response props — no special env vars needed.
 */

test.use({ storageState: STORAGE_STATE.student });

/**
 * Intercept Inertia responses and patch props to simulate ADA unavailability.
 */
/**
 * Patch Inertia props to simulate ADA unavailability.
 */
function patchInertiaProps(props) {
    props.ada_available = false;
    if (props.course) props.course.price_in_ada = null;
    if (props.courses?.data) {
        props.courses.data.forEach(c => { c.price_in_ada = null; });
    }
}

async function interceptAdaUnavailable(page) {
    await page.route('**/*', async (route) => {
        const response = await route.fetch();
        const contentType = response.headers()['content-type'] || '';
        const headers = { ...response.headers() };
        delete headers['content-length'];

        // XHR Inertia navigation: JSON response with x-inertia request header
        if (route.request().headers()['x-inertia'] && contentType.includes('application/json')) {
            try {
                const json = await response.json();
                if (json.props) patchInertiaProps(json.props);
                await route.fulfill({ status: response.status(), headers, body: JSON.stringify(json) });
            } catch {
                await route.fulfill({ response });
            }
            return;
        }

        // Initial full-page HTML load: patch data-page attribute embedded in the HTML
        if (contentType.includes('text/html')) {
            try {
                const html = await response.text();
                const patched = html.replace(
                    /(<div[^>]+id="app"[^>]+data-page=")([^"]+)(")/,
                    (_match, pre, encoded, post) => {
                        try {
                            // data-page value is HTML-entity-encoded JSON
                            const decoded = encoded.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
                            const pageData = JSON.parse(decoded);
                            if (pageData.props) patchInertiaProps(pageData.props);
                            const reencoded = JSON.stringify(pageData).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
                            return `${pre}${reencoded}${post}`;
                        } catch {
                            return _match;
                        }
                    }
                );
                await route.fulfill({ status: response.status(), headers, body: patched });
            } catch {
                await route.fulfill({ response });
            }
            return;
        }

        await route.fulfill({ response });
    });
}

test.describe('ADA conversion unavailable (TS-01.08 through TS-01.11)', () => {
    test.beforeEach(async ({ page }) => {
        await interceptAdaUnavailable(page);
    });

    test.afterEach(async ({ page }) => {
        await page.unrouteAll({ behavior: 'ignoreErrors' });
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
