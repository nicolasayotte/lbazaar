// @ts-check
// ---------------------------------------------------------------------------
// F-01.2: ADA price freshness — TS-01.06, TS-01.07
//
// Tests verify that Details.jsx polls /api/courses/{id}/ada-price every 60s
// and displays a drift warning when the price shifts >5%.
//
// Uses Playwright route interception + clock API — no env vars needed.
// ---------------------------------------------------------------------------
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

// All tests in this file run as the authenticated student.
test.use({ storageState: STORAGE_STATE.student });

/**
 * Navigate to the first General course detail page and return its URL.
 * Returns null if no course is found.
 */
async function navigateToFirstCourse(page) {
    await page.goto('/classes');
    await waitForApp(page);

    // Prefer a paid General course whose card shows a dual JPY+ADA price (~₳), since
    // only those expose the "Buy with ADA" button on the detail page. Fall back to the
    // first card if none advertise an ADA price.
    const adaCardLink = page.locator('.MuiCard-root').filter({ hasText: /~₳/ })
        .locator('a[href*="/classes/"]').first();
    const anyCardLink = page.locator('.MuiCard-root a[href*="/classes/"]').first();
    const courseLink = (await adaCardLink.count()) > 0 ? adaCardLink : anyCardLink;
    if (await courseLink.count() === 0) return null;

    const href = await courseLink.getAttribute('href');
    if (!href) return null;

    await page.goto(href);
    await waitForInertiaNavigation(page);
    return href;
}

// ---------------------------------------------------------------------------
// TS-01.06: ADA price updates without full page reload
// ---------------------------------------------------------------------------
test.describe('TS-01.06: ADA price live refresh', () => {

    test('ADA price updates in-place when market rate changes', async ({ page }) => {
        // Install fake timers before navigation so setInterval uses them
        await page.clock.install();

        let callCount = 0;
        await page.route('**/api/courses/*/ada-price', async (route) => {
            callCount++;
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify(
                    callCount <= 1
                        ? { available: true, data: { price_in_ada: 77.00 } }
                        : { available: true, data: { price_in_ada: 80.00 } }
                ),
            });
        });

        // Also intercept network-status to avoid it interfering
        await page.route('**/api/cardano/network-status', async (route) => {
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ status: 'healthy' }),
            });
        });

        const courseUrl = await navigateToFirstCourse(page);
        test.skip(!courseUrl, 'No courses found on /classes listing');

        // The "Buy with ADA" button text includes the current ADA price
        const adaButton = page.locator('button:has-text("Buy with ADA")');
        if (await adaButton.count() === 0) {
            test.skip(true, 'No ADA purchase button found — course may not be General type');
            return;
        }

        // Capture initial button text
        const initialText = await adaButton.first().textContent();

        // Advance clock past 60s to trigger the polling interval
        await page.clock.fastForward(61_000);

        // Wait for the button text to update with the new price
        await expect(adaButton.first()).not.toHaveText(initialText, { timeout: 5000 });

        // Confirm the URL didn't change (no full page reload)
        await expect(page).toHaveURL(new RegExp(courseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
});

// ---------------------------------------------------------------------------
// TS-01.07: Warning dialog when ADA rate drifts significantly before checkout
// ---------------------------------------------------------------------------
test.describe('TS-01.07: ADA price drift warning', () => {

    test('warning text appears when ADA rate drifts beyond 5% threshold', async ({ page }) => {
        // Install fake timers before navigation
        await page.clock.install();

        // The initial page-load price comes from the Inertia prop (price_in_ada).
        // After 60s, the poll returns a price that drifts >5%.
        // If initial price_in_ada = 77, a >5% drift means returning < 73.15 or > 80.85.
        let callCount = 0;
        await page.route('**/api/courses/*/ada-price', async (route) => {
            callCount++;
            // Return a price that drifts >10% from whatever initial value was shown
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({
                    available: true,
                    data: { price_in_ada: 999.99 },
                }),
            });
        });

        await page.route('**/api/cardano/network-status', async (route) => {
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ status: 'healthy' }),
            });
        });

        const courseUrl = await navigateToFirstCourse(page);
        test.skip(!courseUrl, 'No courses found on /classes listing');

        const adaButton = page.locator('button:has-text("Buy with ADA")');
        if (await adaButton.count() === 0) {
            test.skip(true, 'No ADA purchase button found — course may not be General type');
            return;
        }

        // Advance clock to trigger poll — the massive price change triggers drift warning
        await page.clock.fastForward(61_000);

        // Assert the drift warning text appears
        const driftWarning = page.locator('text=/shifted >5%|price has shifted/i');
        await expect(driftWarning.first()).toBeVisible({ timeout: 5000 });
    });
});
