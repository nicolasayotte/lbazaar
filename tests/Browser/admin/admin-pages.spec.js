// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.admin });

test.describe('Admin pages load without errors', () => {
    test('/admin/class-applications renders successfully', async ({ page }) => {
        const response = await page.goto('/admin/class-applications');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        // Page should stay on class-applications (not redirect to error)
        await expect(page).toHaveURL(/\/admin\/class-applications/);
    });

    test('/admin/wallet-history renders successfully', async ({ page }) => {
        const response = await page.goto('/admin/wallet-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        // Page should stay on wallet-history (not redirect to error)
        await expect(page).toHaveURL(/\/admin\/wallet-history/);
    });
});
