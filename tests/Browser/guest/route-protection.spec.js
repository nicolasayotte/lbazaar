// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';

test.use({ storageState: { cookies: [], origins: [] } });

// F-06.2: Unauthenticated admin access redirects to admin login
test.describe('F-06.2: Admin route protection (unauthenticated)', () => {
    test('visiting /admin/profile without auth redirects to /admin/login', async ({ page }) => {
        await page.goto('/admin/profile');
        await waitForApp(page);
        await expect(page).toHaveURL(/\/admin\/login/);
    });
});
