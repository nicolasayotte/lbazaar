// @ts-check
// ---------------------------------------------------------------------------
// F-01.2: ADA price freshness — TS-01.06, TS-01.07
//
// STATUS: BLOCKED pending operator decisions on OQ-02.
//
// Both tests self-skip in normal CI.  To unskip individually, set the
// corresponding environment variable before running Playwright:
//
//   ADA_REFRESH_INTERVAL_DEFINED=true  — unskips TS-01.06
//   ADA_DRIFT_WARNING_DEFINED=true     — unskips TS-01.07
//
// Required implementation work before either test can pass:
//   - Operator must resolve OQ-02 (define refresh interval, drift threshold)
//   - PRICE_REFRESH_INTERVAL_MS must be set in .env and consumed by a
//     polling hook inside resources/js/pages/Courses/Details.jsx
//   - PRICE_DRIFT_THRESHOLD_PCT must be set in .env and consumed by a
//     warning dialog inside Details.jsx
// ---------------------------------------------------------------------------
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

// All tests in this file run as the authenticated student.
test.use({ storageState: STORAGE_STATE.student });

// ---------------------------------------------------------------------------
// TS-01.06: ADA price updates without full page reload
// ---------------------------------------------------------------------------
test.describe('TS-01.06: ADA price live refresh', () => {
    // Unblock condition:
    //   1. Operator sets PRICE_REFRESH_INTERVAL_MS in .env (resolves OQ-02)
    //   2. Details.jsx implements a polling/websocket hook that re-fetches the
    //      ADA/USD rate and updates the displayed price in-place
    //   3. Set ADA_REFRESH_INTERVAL_DEFINED=true in the Playwright environment

    test('ADA price updates in-place when market rate changes', async ({ page }) => {
        test.skip(
            !process.env.ADA_REFRESH_INTERVAL_DEFINED,
            'Blocked: OQ-02 — operator must define PRICE_REFRESH_INTERVAL_MS and implement polling hook in Details.jsx',
        );

        // --- Implementation notes (fill in when unblocked) ---
        //
        // 1. Navigate to a course detail page that displays an ADA price.
        //    await page.goto('/courses/1');
        //    await waitForApp(page);
        //
        // 2. Read the initial ADA price text from the page.
        //    const priceLocator = page.locator('[data-testid="ada-price"]');
        //    const initialPrice = await priceLocator.textContent();
        //
        // 3. Trigger a market-rate change (e.g. mock the exchange-rate API
        //    endpoint via page.route() or advance a fake timer).
        //
        // 4. Wait for the price element to show a different value without
        //    a full navigation event (no page reload should occur).
        //    await expect(priceLocator).not.toHaveText(initialPrice, { timeout: 15000 });
        //
        // 5. Confirm the URL and page identity did not change (no reload).
        //    await expect(page).toHaveURL(/\/courses\/1/);

        // Placeholder assertion — unreachable while skipped.
        expect(true).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// TS-01.07: Warning dialog when ADA rate drifts significantly before checkout
// ---------------------------------------------------------------------------
test.describe('TS-01.07: ADA price drift warning', () => {
    // Unblock condition:
    //   1. Operator sets PRICE_DRIFT_THRESHOLD_PCT in .env (resolves OQ-02)
    //   2. Details.jsx implements a warning dialog that fires when the live
    //      ADA price deviates from the page-load price by more than the
    //      configured threshold before the user submits checkout
    //   3. Set ADA_DRIFT_WARNING_DEFINED=true in the Playwright environment

    test('warning dialog appears when ADA rate drifts beyond threshold before checkout', async ({ page }) => {
        test.skip(
            !process.env.ADA_DRIFT_WARNING_DEFINED,
            'Blocked: OQ-02 — operator must define PRICE_DRIFT_THRESHOLD_PCT and implement warning dialog in Details.jsx',
        );

        // --- Implementation notes (fill in when unblocked) ---
        //
        // 1. Navigate to a course detail page.
        //    await page.goto('/courses/1');
        //    await waitForApp(page);
        //
        // 2. Capture the ADA price shown at page load.
        //    const initialPrice = await page.locator('[data-testid="ada-price"]').textContent();
        //
        // 3. Simulate a rate drift that exceeds PRICE_DRIFT_THRESHOLD_PCT
        //    (e.g. intercept the exchange-rate API and return a value that
        //    differs by more than the threshold).
        //    await page.route('**/api/ada-rate*', route =>
        //        route.fulfill({ json: { rate: simulatedDriftedRate } })
        //    );
        //
        // 4. Trigger the refresh (advance timer or wait for polling interval).
        //
        // 5. Click the checkout / enrol button.
        //    await page.locator('[data-testid="enrol-button"]').click();
        //
        // 6. Assert the warning dialog is visible before the checkout proceeds.
        //    const dialog = page.locator('[data-testid="price-drift-warning"]');
        //    await expect(dialog).toBeVisible();
        //    await expect(dialog).toContainText(/price.*changed/i);

        // Placeholder assertion — unreachable while skipped.
        expect(true).toBe(true);
    });
});
